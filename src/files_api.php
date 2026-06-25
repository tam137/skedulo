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
            
            // Check access control on appointment if uploading to one
            if ($appointmentId) {
                $stmtApp = $pdo->prepare("
                    SELECT 1 FROM appointments a
                    WHERE a.id = :app_id
                      AND (
                          a.created_by = :user_id
                          OR EXISTS (
                              SELECT 1 FROM appointment_permissions ap
                              WHERE ap.appointment_id = a.id AND ap.account_id = :user_id
                          )
                      )
                ");
                $stmtApp->execute(['app_id' => $appointmentId, 'user_id' => $userId]);
                if (!$stmtApp->fetch()) {
                    throw new Exception('Keine Berechtigung, Dateien für diesen Termin hochzuladen.');
                }
            } else {
                // If global file, allowed_users is mandatory!
                $allowedUsersRaw = $input['allowed_users'] ?? '';
                $allowedUsers = [];
                if (!empty($allowedUsersRaw)) {
                    if (is_array($allowedUsersRaw)) {
                        $allowedUsers = $allowedUsersRaw;
                    } else {
                        $allowedUsers = json_decode($allowedUsersRaw, true);
                    }
                }
                
                // Exclude creator if selected, just in case
                $allowedUsersFiltered = [];
                if (is_array($allowedUsers)) {
                    foreach ($allowedUsers as $uId) {
                        $uId = intval($uId);
                        if ($uId > 0 && $uId !== $userId) {
                            $allowedUsersFiltered[] = $uId;
                        }
                    }
                }
                
                if (empty($allowedUsersFiltered)) {
                    throw new Exception('Für terminfreie Dateien ist die Angabe, wer die Datei noch sehen oder löschen darf, zwingend erforderlich.');
                }
            }

            $storageName = uniqid() . '_' . bin2hex(random_bytes(4)) . '_' . preg_replace('/[^a-zA-Z0-9_\.-]/', '_', $originalName);
            $targetPath = $uploadDir . $storageName;
            
            if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
                throw new Exception('Datei konnte nicht auf dem Server gespeichert werden.');
            }
            
            $pdo->beginTransaction();

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
            } else {
                // Insert file sharing permissions
                $stmtPerm = $pdo->prepare("INSERT INTO file_permissions (file_id, account_id) VALUES (:file_id, :account_id)");
                foreach ($allowedUsersFiltered as $allowedUserId) {
                    $stmtPerm->execute([
                        'file_id' => $fileId,
                        'account_id' => $allowedUserId
                    ]);
                }
            }
            
            $pdo->commit();

            echo json_encode([
                'success' => true,
                'id' => $fileId,
                'message' => 'Datei erfolgreich hochgeladen.'
            ]);
            break;
            
        case 'list':
            $appointmentId = isset($_GET['appointment_id']) ? intval($_GET['appointment_id']) : null;
            
            if ($appointmentId) {
                // Verify user has access to the appointment
                $stmtApp = $pdo->prepare("
                    SELECT 1 FROM appointments a
                    WHERE a.id = :app_id
                      AND (
                          a.created_by = :user_id
                          OR EXISTS (
                              SELECT 1 FROM appointment_permissions ap
                              WHERE ap.appointment_id = a.id AND ap.account_id = :user_id
                          )
                      )
                ");
                $stmtApp->execute(['app_id' => $appointmentId, 'user_id' => $userId]);
                if (!$stmtApp->fetch()) {
                    http_response_code(403);
                    echo json_encode(['error' => 'Keine Berechtigung für die Dateien dieses Termins.']);
                    exit;
                }

                $query = "
                    SELECT f.id, f.appointment_id, f.original_filename, f.mime_type, f.file_size, f.uploaded_at, 
                           acc.username as uploader_name, a.title as appointment_title
                    FROM files f
                    JOIN accounts acc ON f.uploaded_by = acc.id
                    LEFT JOIN appointments a ON f.appointment_id = a.id
                    WHERE f.appointment_id = :app_id
                    ORDER BY f.uploaded_at DESC
                ";
                $stmt = $pdo->prepare($query);
                $stmt->execute(['app_id' => $appointmentId]);
            } else {
                // List all visible files for the user
                $query = "
                    SELECT f.id, f.appointment_id, f.original_filename, f.mime_type, f.file_size, f.uploaded_at, 
                           acc.username as uploader_name, a.title as appointment_title
                    FROM files f
                    JOIN accounts acc ON f.uploaded_by = acc.id
                    LEFT JOIN appointments a ON f.appointment_id = a.id
                    WHERE f.uploaded_by = :user_id
                       OR (f.appointment_id IS NOT NULL AND (
                           a.created_by = :user_id
                           OR EXISTS (
                               SELECT 1 FROM appointment_permissions ap 
                               WHERE ap.appointment_id = a.id AND ap.account_id = :user_id
                           )
                       ))
                       OR (f.appointment_id IS NULL AND EXISTS (
                           SELECT 1 FROM file_permissions fp 
                           WHERE fp.file_id = f.id AND fp.account_id = :user_id
                       ))
                    ORDER BY f.uploaded_at DESC
                ";
                $stmt = $pdo->prepare($query);
                $stmt->execute(['user_id' => $userId]);
            }
            
            $files = $stmt->fetchAll();
            echo json_encode(['success' => true, 'files' => $files]);
            break;
            
        case 'delete':
            $id = intval($input['id'] ?? 0);
            if ($id <= 0) throw new Exception('Ungültige ID.');
            
            $stmt = $pdo->prepare("SELECT appointment_id, original_filename, storage_filename, uploaded_by FROM files WHERE id = :id");
            $stmt->execute(['id' => $id]);
            $file = $stmt->fetch();
            
            if (!$file) throw new Exception('Datei nicht gefunden.');

            // Verify permission: uploader, shared on appointment, or shared on file
            $canDelete = false;
            if ($file['uploaded_by'] === $userId) {
                $canDelete = true;
            } elseif ($file['appointment_id']) {
                $stmtApp = $pdo->prepare("
                    SELECT 1 FROM appointments a
                    WHERE a.id = :app_id
                      AND (
                          a.created_by = :user_id
                          OR EXISTS (
                              SELECT 1 FROM appointment_permissions ap
                              WHERE ap.appointment_id = a.id AND ap.account_id = :user_id
                          )
                      )
                ");
                $stmtApp->execute(['app_id' => $file['appointment_id'], 'user_id' => $userId]);
                if ($stmtApp->fetch()) {
                    $canDelete = true;
                }
            } else {
                $stmtFilePerm = $pdo->prepare("
                    SELECT 1 FROM file_permissions fp
                    WHERE fp.file_id = :file_id AND fp.account_id = :user_id
                ");
                $stmtFilePerm->execute(['file_id' => $id, 'user_id' => $userId]);
                if ($stmtFilePerm->fetch()) {
                    $canDelete = true;
                }
            }

            if (!$canDelete) {
                http_response_code(403);
                throw new Exception('Keine Berechtigung diese Datei zu löschen.');
            }
            
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
            
            $stmt = $pdo->prepare("SELECT original_filename, storage_filename, mime_type, file_size, uploaded_by, appointment_id FROM files WHERE id = :id");
            $stmt->execute(['id' => $id]);
            $file = $stmt->fetch();
            
            if (!$file) {
                http_response_code(404);
                echo 'Datei nicht gefunden.';
                exit;
            }

            // Verify permission: uploader, shared on appointment, or shared on file
            $canAccess = false;
            if ($file['uploaded_by'] === $userId) {
                $canAccess = true;
            } elseif ($file['appointment_id']) {
                $stmtApp = $pdo->prepare("
                    SELECT 1 FROM appointments a
                    WHERE a.id = :app_id
                      AND (
                          a.created_by = :user_id
                          OR EXISTS (
                              SELECT 1 FROM appointment_permissions ap
                              WHERE ap.appointment_id = a.id AND ap.account_id = :user_id
                          )
                      )
                ");
                $stmtApp->execute(['app_id' => $file['appointment_id'], 'user_id' => $userId]);
                if ($stmtApp->fetch()) {
                    $canAccess = true;
                }
            } else {
                $stmtFilePerm = $pdo->prepare("
                    SELECT 1 FROM file_permissions fp
                    WHERE fp.file_id = :file_id AND fp.account_id = :user_id
                ");
                $stmtFilePerm->execute(['file_id' => $id, 'user_id' => $userId]);
                if ($stmtFilePerm->fetch()) {
                    $canAccess = true;
                }
            }

            if (!$canAccess) {
                http_response_code(403);
                echo 'Keine Berechtigung für diese Datei.';
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
