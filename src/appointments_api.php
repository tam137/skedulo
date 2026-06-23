<?php
require_once 'auth_helper.php';

// Send JSON headers
header('Content-Type: application/json');

// Force authentication
if (!check_remember_me()) {
    http_response_code(401);
    echo json_encode(['error' => 'Nicht autorisiert. Bitte melde dich an.']);
    exit;
}

$pdo = get_db_connection();
$userId = $_SESSION['user_id'];

// Get action
$input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
$action = $_GET['action'] ?? $input['action'] ?? '';

try {
    switch ($action) {
        case 'list':
            $today = date('Y-m-d');

            // Fetch upcoming appointments (next first: ASC)
            $stmt = $pdo->prepare("
                SELECT a.*, acc.username as creator_name 
                FROM appointments a
                JOIN accounts acc ON a.created_by = acc.id
                WHERE a.appointment_date >= :today
                ORDER BY a.appointment_date ASC
            ");
            $stmt->execute(['today' => $today]);
            $upcoming = $stmt->fetchAll();

            // Fetch past appointments (recent past first: DESC)
            $stmt = $pdo->prepare("
                SELECT a.*, acc.username as creator_name 
                FROM appointments a
                JOIN accounts acc ON a.created_by = acc.id
                WHERE a.appointment_date < :today
                ORDER BY a.appointment_date DESC
            ");
            $stmt->execute(['today' => $today]);
            $past = $stmt->fetchAll();

            echo json_encode([
                'success' => true,
                'upcoming' => $upcoming,
                'past' => $past
            ]);
            break;

        case 'get':
            $id = intval($_GET['id'] ?? $input['id'] ?? 0);
            if ($id <= 0) {
                throw new Exception('Ungültige Termin-ID.');
            }

            // Fetch appointment details
            $stmt = $pdo->prepare("
                SELECT a.*, acc.username as creator_name 
                FROM appointments a
                JOIN accounts acc ON a.created_by = acc.id
                WHERE a.id = :id
            ");
            $stmt->execute(['id' => $id]);
            $appointment = $stmt->fetch();

            if (!$appointment) {
                http_response_code(404);
                echo json_encode(['error' => 'Termin nicht gefunden.']);
                exit;
            }

            // Fetch edit history
            $stmt = $pdo->prepare("
                SELECT h.*, acc.username as changer_name 
                FROM appointment_history h
                JOIN accounts acc ON h.changed_by = acc.id
                WHERE h.appointment_id = :id
                ORDER BY h.changed_at DESC
            ");
            $stmt->execute(['id' => $id]);
            $history = $stmt->fetchAll();

            // Format history changes to be readable or decode JSON for client-side parsing
            foreach ($history as &$log) {
                $log['changes'] = json_decode($log['changes'], true);
            }

            echo json_encode([
                'success' => true,
                'appointment' => $appointment,
                'history' => $history
            ]);
            break;

        case 'create':
            $title = trim($input['title'] ?? '');
            $location = trim($input['location'] ?? '');
            $dateRaw = trim($input['appointment_date'] ?? '');
            $notes = trim($input['notes'] ?? '');

            if (empty($title)) {
                throw new Exception('Bitte gib einen Namen für den Termin ein.');
            }
            if (empty($dateRaw)) {
                throw new Exception('Bitte gib ein Datum ein.');
            }

            $dateFormatted = date('Y-m-d 00:00:00', strtotime($dateRaw));

            $stmt = $pdo->prepare("
                INSERT INTO appointments (title, location, appointment_date, created_by, notes)
                VALUES (:title, :location, :appointment_date, :created_by, :notes)
                RETURNING id
            ");
            $stmt->execute([
                'title' => $title,
                'location' => $location !== '' ? $location : null,
                'appointment_date' => $dateFormatted,
                'created_by' => $userId,
                'notes' => $notes !== '' ? $notes : null
            ]);
            $newId = $stmt->fetchColumn();

            echo json_encode([
                'success' => true,
                'id' => $newId,
                'message' => 'Termin erfolgreich erstellt.'
            ]);
            break;

        case 'update':
            $id = intval($input['id'] ?? 0);
            if ($id <= 0) {
                throw new Exception('Ungültige Termin-ID.');
            }

            $title = trim($input['title'] ?? '');
            $location = trim($input['location'] ?? '');
            $dateRaw = trim($input['appointment_date'] ?? '');
            $notes = trim($input['notes'] ?? '');

            if (empty($title)) {
                throw new Exception('Der Name des Termins darf nicht leer sein.');
            }
            if (empty($dateRaw)) {
                throw new Exception('Das Datum darf nicht leer sein.');
            }

            // Start a transaction to ensure both history and update succeed together
            $pdo->beginTransaction();

            // Fetch existing appointment for comparison
            $stmt = $pdo->prepare("SELECT * FROM appointments WHERE id = :id FOR UPDATE");
            $stmt->execute(['id' => $id]);
            $existing = $stmt->fetch();

            if (!$existing) {
                $pdo->rollBack();
                http_response_code(404);
                echo json_encode(['error' => 'Termin zum Bearbeiten nicht gefunden.']);
                exit;
            }

            $oldDate = date('Y-m-d', strtotime($existing['appointment_date']));
            $newDate = date('Y-m-d', strtotime($dateRaw));
            $newDateFormatted = date('Y-m-d 00:00:00', strtotime($dateRaw));

            // Compare fields to build changes array
            $changes = [];
            
            if ($existing['title'] !== $title) {
                $changes['title'] = ['old' => $existing['title'], 'new' => $title];
            }
            
            // Handle null and string equivalence for optional fields
            $oldLoc = $existing['location'] ?? '';
            if ($oldLoc !== $location) {
                $changes['location'] = ['old' => $oldLoc, 'new' => $location];
            }

            if ($oldDate !== $newDate) {
                $changes['appointment_date'] = ['old' => $oldDate, 'new' => $newDate];
            }

            $oldNotes = $existing['notes'] ?? '';
            if ($oldNotes !== $notes) {
                $changes['notes'] = ['old' => $oldNotes, 'new' => $notes];
            }

            // Only log and update if something actually changed
            if (!empty($changes)) {
                // Insert change log
                $stmtLog = $pdo->prepare("
                    INSERT INTO appointment_history (appointment_id, changed_by, changes)
                    VALUES (:appointment_id, :changed_by, :changes)
                ");
                $stmtLog->execute([
                    'appointment_id' => $id,
                    'changed_by' => $userId,
                    'changes' => json_encode($changes)
                ]);

                // Update appointment
                $stmtUpdate = $pdo->prepare("
                    UPDATE appointments
                    SET title = :title, 
                        location = :location, 
                        appointment_date = :appointment_date, 
                        notes = :notes, 
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = :id
                ");
                $stmtUpdate->execute([
                    'title' => $title,
                    'location' => $location !== '' ? $location : null,
                    'appointment_date' => $newDateFormatted,
                    'notes' => $notes !== '' ? $notes : null,
                    'id' => $id
                ]);
            }

            $pdo->commit();

            echo json_encode([
                'success' => true,
                'message' => 'Termin erfolgreich aktualisiert.',
                'changed' => !empty($changes)
            ]);
            break;

        case 'delete':
            $id = intval($input['id'] ?? 0);
            if ($id <= 0) {
                throw new Exception('Ungültige Termin-ID.');
            }

            $stmt = $pdo->prepare("DELETE FROM appointments WHERE id = :id");
            $stmt->execute(['id' => $id]);

            echo json_encode([
                'success' => true,
                'message' => 'Termin erfolgreich gelöscht.'
            ]);
            break;

        default:
            throw new Exception('Ungültige Aktion.');
    }
} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(400);
    echo json_encode([
        'error' => $e->getMessage()
    ]);
}
