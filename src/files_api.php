<?php
require_once 'auth_helper.php';

// Only output JSON headers for non-download actions
$action = $_GET['action'] ?? $_POST['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
if (!$action && isset($input['action'])) {
    $action = $input['action'];
}

if (empty($action) && isset($_SERVER['CONTENT_LENGTH']) && $_SERVER['CONTENT_LENGTH'] > 0 && empty($_POST) && empty($_FILES)) {
    header('Content-Type: application/json');
    http_response_code(400);
    echo json_encode(['error' => 'Die hochgeladene Datei ist zu groß und überschreitet das Server-Limit.']);
    exit;
}

if ($action !== 'download' && $action !== 'view') {
    header('Content-Type: application/json');
}

// Force authentication
if (!check_remember_me()) {
    http_response_code(401);
    if ($action !== 'download' && $action !== 'view') {
        echo json_encode(['error' => 'Nicht autorisiert. Bitte melde dich an.']);
    } else {
        echo 'Nicht autorisiert. Bitte melde dich an.';
    }
    exit;
}

$pdo = get_db_connection();
$userId = $_SESSION['user_id'];
$uploadDir = __DIR__ . '/uploads/';

try {
    switch ($action) {
        case 'upload':
            if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
                throw new Exception('Fehler beim Dateiupload (Error Code: ' . ($_FILES['file']['error'] ?? 'Unbekannt') . ').');
            }
            
            $file = $_FILES['file'];
            // Check size limit: 1 GB
            if ($file['size'] > 1073741824) {
                throw new Exception('Die Datei ist zu groß. (Max. 1 GB)');
            }
            
            $originalName = basename($file['name']);
            $mimeType = $file['type'];
            if (empty($mimeType)) {
                $mimeType = mime_content_type($file['tmp_name']) ?: 'application/octet-stream';
            }
            $fileSize = $file['size'];
            $appointmentId = isset($input['appointment_id']) && $input['appointment_id'] !== '' && $input['appointment_id'] !== 'null' ? intval($input['appointment_id']) : null;
            
            $storageName = uniqid() . '_' . bin2hex(random_bytes(4)) . '_' . preg_replace('/[^a-zA-Z0-9_\.-]/', '_', $originalName);
            $targetPath = $uploadDir . $storageName;
            
            if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
                throw new Exception('Datei konnte nicht auf dem Server gespeichert werden.');
            }
            
            $stmt = $pdo->prepare("
                INSERT INTO files (appointment_id, original_filename, storage_filename, mime_type, file_size, uploaded_by)
                VALUES (:appointment_id, :original_filename, :storage_filename, :mime_type, :file_size, :uploaded_by)
                RETURNING id
            ");
            $stmt->execute([
                'appointment_id' => $appointmentId,
                'original_filename' => $originalName,
                'storage_filename' => $storageName,
                'mime_type' => $mimeType,
                'file_size' => $fileSize,
                'uploaded_by' => $userId
            ]);
            $fileId = $stmt->fetchColumn();
            
            if ($appointmentId) {
                $changes = ['file_added' => ['name' => $originalName]];
                $stmtLog = $pdo->prepare("INSERT INTO appointment_history (appointment_id, changed_by, changes) VALUES (:app_id, :user_id, :changes)");
                $stmtLog->execute([
                    'app_id' => $appointmentId,
                    'user_id' => $userId,
                    'changes' => json_encode($changes)
                ]);
            }
            
            echo json_encode([
                'success' => true,
                'id' => $fileId,
                'message' => 'Datei erfolgreich hochgeladen.'
            ]);
            break;
            
        case 'list':
            $appointmentId = isset($_GET['appointment_id']) ? intval($_GET['appointment_id']) : null;
            
            $query = "
                SELECT f.id, f.appointment_id, f.original_filename, f.mime_type, f.file_size, f.uploaded_at, 
                       acc.username as uploader_name, a.title as appointment_title
                FROM files f
                JOIN accounts acc ON f.uploaded_by = acc.id
                LEFT JOIN appointments a ON f.appointment_id = a.id
            ";
            
            if ($appointmentId) {
                $query .= " WHERE f.appointment_id = :app_id";
                $stmt = $pdo->prepare($query . " ORDER BY f.uploaded_at DESC");
                $stmt->execute(['app_id' => $appointmentId]);
            } else {
                $stmt = $pdo->query($query . " ORDER BY f.uploaded_at DESC");
            }
            
            $files = $stmt->fetchAll();
            echo json_encode(['success' => true, 'files' => $files]);
            break;
            
        case 'delete':
            $id = intval($input['id'] ?? 0);
            if ($id <= 0) throw new Exception('Ungültige ID.');
            
            $stmt = $pdo->prepare("SELECT appointment_id, original_filename, storage_filename FROM files WHERE id = :id");
            $stmt->execute(['id' => $id]);
            $file = $stmt->fetch();
            
            if (!$file) throw new Exception('Datei nicht gefunden.');
            
            $filePath = $uploadDir . $file['storage_filename'];
            if (file_exists($filePath)) {
                unlink($filePath);
            }
            
            $stmt = $pdo->prepare("DELETE FROM files WHERE id = :id");
            $stmt->execute(['id' => $id]);
            
            if ($file['appointment_id']) {
                $changes = ['file_deleted' => ['name' => $file['original_filename']]];
                $stmtLog = $pdo->prepare("INSERT INTO appointment_history (appointment_id, changed_by, changes) VALUES (:app_id, :user_id, :changes)");
                $stmtLog->execute([
                    'app_id' => $file['appointment_id'],
                    'user_id' => $userId,
                    'changes' => json_encode($changes)
                ]);
            }
            
            echo json_encode(['success' => true, 'message' => 'Datei gelöscht.']);
            break;
            
        case 'download':
        case 'view':
            $id = intval($_GET['id'] ?? 0);
            if ($id <= 0) {
                http_response_code(400);
                echo 'Ungültige ID.';
                exit;
            }
            
            $stmt = $pdo->prepare("SELECT original_filename, storage_filename, mime_type, file_size FROM files WHERE id = :id");
            $stmt->execute(['id' => $id]);
            $file = $stmt->fetch();
            
            if (!$file) {
                http_response_code(404);
                echo 'Datei nicht gefunden.';
                exit;
            }
            
            $filePath = $uploadDir . $file['storage_filename'];
            if (!file_exists($filePath)) {
                http_response_code(404);
                echo 'Physische Datei fehlt auf dem Server.';
                exit;
            }
            
            $disposition = ($action === 'view') ? 'inline' : 'attachment';
            $filename = rawurlencode($file['original_filename']);
            
            header("Content-Type: " . $file['mime_type']);
            header("Content-Disposition: $disposition; filename*=UTF-8''$filename");
            header("Content-Length: " . $file['file_size']);
            header("Cache-Control: private, max-age=0, must-revalidate");
            
            readfile($filePath);
            exit;
            
        default:
            throw new Exception('Ungültige Aktion.');
    }
} catch (Exception $e) {
    if ($action !== 'download' && $action !== 'view') {
        http_response_code(400);
        echo json_encode(['error' => $e->getMessage()]);
    } else {
        http_response_code(400);
        echo 'Fehler: ' . htmlspecialchars($e->getMessage());
    }
}
