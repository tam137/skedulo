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

if ($action === 'save') {
    $id = intval($input['id'] ?? 0);
    $action = ($id > 0) ? 'update' : 'create';
}

try {
    switch ($action) {
        case 'users':
            $stmt = $pdo->prepare("SELECT id, username FROM accounts WHERE is_active = true AND id != :id ORDER BY username ASC");
            $stmt->execute(['id' => $userId]);
            $users = $stmt->fetchAll();
            echo json_encode([
                'success' => true,
                'users' => $users
            ]);
            break;

        case 'list':
            $today = date('Y-m-d');
            global $db_config;
            $pastDaysLimit = $db_config['past_appointments_days_limit'] ?? 30;
            $limitDate = date('Y-m-d', strtotime("-$pastDaysLimit days"));

            // Fetch upcoming appointments (next first: ASC)
            $stmt = $pdo->prepare("
                SELECT a.*, acc.username as creator_name,
                       (SELECT COUNT(*) FROM files f WHERE f.appointment_id = a.id) as file_count
                FROM appointments a
                JOIN accounts acc ON a.created_by = acc.id
                WHERE a.appointment_date >= :today
                  AND (
                      a.created_by = :userId
                      OR EXISTS (
                          SELECT 1 FROM appointment_permissions ap
                          WHERE ap.appointment_id = a.id AND ap.account_id = :userId
                      )
                  )
                ORDER BY a.appointment_date ASC
            ");
            $stmt->execute(['today' => $today, 'userId' => $userId]);
            $upcoming = $stmt->fetchAll();

            // Fetch past appointments (recent past first: DESC)
            $stmt = $pdo->prepare("
                SELECT a.*, acc.username as creator_name,
                       (SELECT COUNT(*) FROM files f WHERE f.appointment_id = a.id) as file_count
                FROM appointments a
                JOIN accounts acc ON a.created_by = acc.id
                WHERE a.appointment_date < :today
                  AND a.appointment_date >= :limitDate
                  AND (
                      a.created_by = :userId
                      OR EXISTS (
                          SELECT 1 FROM appointment_permissions ap
                          WHERE ap.appointment_id = a.id AND ap.account_id = :userId
                      )
                  )
                ORDER BY a.appointment_date DESC
            ");
            $stmt->execute(['today' => $today, 'limitDate' => $limitDate, 'userId' => $userId]);
            $past = $stmt->fetchAll();

            foreach ($upcoming as &$apt) {
                $apt['all_day'] = filter_var($apt['all_day'], FILTER_VALIDATE_BOOLEAN);
                $apt['duration_hours'] = $apt['duration_hours'] !== null ? floatval($apt['duration_hours']) : null;
                $apt['duration_days'] = $apt['duration_days'] !== null ? intval($apt['duration_days']) : null;
            }
            foreach ($past as &$apt) {
                $apt['all_day'] = filter_var($apt['all_day'], FILTER_VALIDATE_BOOLEAN);
                $apt['duration_hours'] = $apt['duration_hours'] !== null ? floatval($apt['duration_hours']) : null;
                $apt['duration_days'] = $apt['duration_days'] !== null ? intval($apt['duration_days']) : null;
            }

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

            $appointment['all_day'] = filter_var($appointment['all_day'], FILTER_VALIDATE_BOOLEAN);
            $appointment['duration_hours'] = $appointment['duration_hours'] !== null ? floatval($appointment['duration_hours']) : null;
            $appointment['duration_days'] = $appointment['duration_days'] !== null ? intval($appointment['duration_days']) : null;

            // Check access permission: creator or explicitly shared in appointment_permissions
            if ($appointment['created_by'] !== $userId) {
                $stmtPerm = $pdo->prepare("
                    SELECT 1 FROM appointment_permissions 
                    WHERE appointment_id = :appointment_id AND account_id = :account_id
                ");
                $stmtPerm->execute(['appointment_id' => $id, 'account_id' => $userId]);
                if (!$stmtPerm->fetch()) {
                    http_response_code(403);
                    echo json_encode(['error' => 'Keine Berechtigung für diesen Termin.']);
                    exit;
                }
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

            // Fetch attached files
            $stmtFiles = $pdo->prepare("
                SELECT f.id, f.original_filename as original_name, f.mime_type, f.file_size, f.uploaded_at, 
                       acc.username as creator_name, f.uploaded_by as created_by
                FROM files f
                JOIN accounts acc ON f.uploaded_by = acc.id
                WHERE f.appointment_id = :id
                ORDER BY f.uploaded_at ASC
            ");
            $stmtFiles->execute(['id' => $id]);
            $files = $stmtFiles->fetchAll();

            // Fetch sharing permissions
            $stmtPerms = $pdo->prepare("SELECT account_id FROM appointment_permissions WHERE appointment_id = :id");
            $stmtPerms->execute(['id' => $id]);
            $allowedUsers = $stmtPerms->fetchAll(PDO::FETCH_COLUMN);

            echo json_encode([
                'success' => true,
                'appointment' => $appointment,
                'history' => $history,
                'files' => $files,
                'allowed_users' => $allowedUsers
            ]);
            break;

        case 'create':
            $title = trim($input['title'] ?? '');
            $location = trim($input['location'] ?? '');
            $dateRaw = trim($input['appointment_date'] ?? '');
            $notes = trim($input['notes'] ?? '');
            $icon = trim($input['icon'] ?? '');

            if (empty($title)) {
                throw new Exception('Bitte gib einen Namen für den Termin ein.');
            }
            if (empty($dateRaw)) {
                throw new Exception('Bitte gib ein Datum ein.');
            }

            $type = trim($input['appointment_type'] ?? 'all_day');
            $all_day = true;
            $duration_hours = null;
            $duration_days = null;

            if ($type === 'time_based') {
                $all_day = false;
                $startTime = trim($input['start_time'] ?? '');
                if (empty($startTime)) {
                    throw new Exception('Bitte gib eine Startzeit ein.');
                }
                $dateFormatted = date('Y-m-d H:i:00', strtotime("$dateRaw $startTime"));
                $duration_hours = floatval($input['duration_hours'] ?? 0);
                if ($duration_hours <= 0) {
                    throw new Exception('Bitte gib eine gültige Dauer in Stunden ein.');
                }
            } else if ($type === 'multi_day') {
                $all_day = true;
                $dateFormatted = date('Y-m-d 00:00:00', strtotime($dateRaw));
                $duration_days = intval($input['duration_days'] ?? 0);
                if ($duration_days < 2) {
                    throw new Exception('Ein Mehrtagestermin muss mindestens 2 Tage dauern.');
                }
            } else {
                $all_day = true;
                $dateFormatted = date('Y-m-d 00:00:00', strtotime($dateRaw));
                $duration_days = 1;
            }

            $pdo->beginTransaction();

            $stmt = $pdo->prepare("
                INSERT INTO appointments (title, location, appointment_date, created_by, notes, icon, all_day, duration_hours, duration_days)
                VALUES (:title, :location, :appointment_date, :created_by, :notes, :icon, :all_day, :duration_hours, :duration_days)
                RETURNING id
            ");
            $stmt->execute([
                'title' => $title,
                'location' => $location !== '' ? $location : null,
                'appointment_date' => $dateFormatted,
                'created_by' => $userId,
                'notes' => $notes !== '' ? $notes : null,
                'icon' => $icon !== '' ? $icon : null,
                'all_day' => $all_day ? 1 : 0,
                'duration_hours' => $duration_hours,
                'duration_days' => $duration_days
            ]);
            $newId = $stmt->fetchColumn();

            // Insert sharing permissions
            if (isset($input['allowed_users'])) {
                $allowedUsers = $input['allowed_users'];
                if (is_string($allowedUsers)) {
                    $allowedUsers = json_decode($allowedUsers, true) ?? [];
                }
                if (is_array($allowedUsers)) {
                    $stmtPerm = $pdo->prepare("INSERT INTO appointment_permissions (appointment_id, account_id) VALUES (:appointment_id, :account_id)");
                    foreach ($allowedUsers as $allowedUserId) {
                        $allowedUserId = intval($allowedUserId);
                        if ($allowedUserId !== $userId) {
                            $stmtPerm->execute([
                                'appointment_id' => $newId,
                                'account_id' => $allowedUserId
                            ]);
                        }
                    }
                }
            }

            $pdo->commit();

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
            $icon = trim($input['icon'] ?? '');

            if (empty($title)) {
                throw new Exception('Der Name des Termins darf nicht leer sein.');
            }
            if (empty($dateRaw)) {
                throw new Exception('Das Datum darf nicht leer sein.');
            }

            $type = trim($input['appointment_type'] ?? 'all_day');
            $all_day = true;
            $duration_hours = null;
            $duration_days = null;

            if ($type === 'time_based') {
                $all_day = false;
                $startTime = trim($input['start_time'] ?? '');
                if (empty($startTime)) {
                    throw new Exception('Bitte gib eine Startzeit ein.');
                }
                $newDateFormatted = date('Y-m-d H:i:00', strtotime("$dateRaw $startTime"));
                $duration_hours = floatval($input['duration_hours'] ?? 0);
                if ($duration_hours <= 0) {
                    throw new Exception('Bitte gib eine gültige Dauer in Stunden ein.');
                }
            } else if ($type === 'multi_day') {
                $all_day = true;
                $newDateFormatted = date('Y-m-d 00:00:00', strtotime($dateRaw));
                $duration_days = intval($input['duration_days'] ?? 0);
                if ($duration_days < 2) {
                    throw new Exception('Ein Mehrtagestermin muss mindestens 2 Tage dauern.');
                }
            } else {
                $all_day = true;
                $newDateFormatted = date('Y-m-d 00:00:00', strtotime($dateRaw));
                $duration_days = 1;
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

            // Check write permission: creator or shared user
            if ($existing['created_by'] !== $userId) {
                $stmtPerm = $pdo->prepare("
                    SELECT 1 FROM appointment_permissions 
                    WHERE appointment_id = :appointment_id AND account_id = :account_id
                ");
                $stmtPerm->execute(['appointment_id' => $id, 'account_id' => $userId]);
                if (!$stmtPerm->fetch()) {
                    $pdo->rollBack();
                    http_response_code(403);
                    echo json_encode(['error' => 'Keine Berechtigung diesen Termin zu bearbeiten.']);
                    exit;
                }
            }

            $oldDateFormatted = $existing['appointment_date'];

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

            if ($oldDateFormatted !== $newDateFormatted) {
                $oldDStr = $existing['all_day'] ? date('Y-m-d', strtotime($oldDateFormatted)) : $oldDateFormatted;
                $newDStr = $all_day ? date('Y-m-d', strtotime($newDateFormatted)) : $newDateFormatted;
                if ($oldDStr !== $newDStr) {
                    $changes['appointment_date'] = ['old' => $oldDStr, 'new' => $newDStr];
                }
            }

            $oldNotes = $existing['notes'] ?? '';
            if ($oldNotes !== $notes) {
                $changes['notes'] = ['old' => $oldNotes, 'new' => $notes];
            }

            $oldIcon = $existing['icon'] ?? '';
            if ($oldIcon !== $icon) {
                $changes['icon'] = ['old' => $oldIcon, 'new' => $icon];
            }

            $oldAllDay = filter_var($existing['all_day'], FILTER_VALIDATE_BOOLEAN);
            if ($oldAllDay !== $all_day) {
                $changes['all_day'] = ['old' => $oldAllDay, 'new' => $all_day];
            }

            $oldDurationHours = $existing['duration_hours'] !== null ? floatval($existing['duration_hours']) : null;
            if ($oldDurationHours !== $duration_hours) {
                $changes['duration_hours'] = ['old' => $oldDurationHours, 'new' => $duration_hours];
            }

            $oldDurationDays = $existing['duration_days'] !== null ? intval($existing['duration_days']) : null;
            if ($oldDurationDays !== $duration_days) {
                $changes['duration_days'] = ['old' => $oldDurationDays, 'new' => $duration_days];
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
                        icon = :icon,
                        all_day = :all_day,
                        duration_hours = :duration_hours,
                        duration_days = :duration_days,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = :id
                ");
                $stmtUpdate->execute([
                    'title' => $title,
                    'location' => $location !== '' ? $location : null,
                    'appointment_date' => $newDateFormatted,
                    'notes' => $notes !== '' ? $notes : null,
                    'icon' => $icon !== '' ? $icon : null,
                    'all_day' => $all_day ? 1 : 0,
                    'duration_hours' => $duration_hours,
                    'duration_days' => $duration_days,
                    'id' => $id
                ]);
            }

            // Security check: Only the creator can change the sharing list
            $allowedUsers = [];
            if (isset($input['allowed_users'])) {
                $allowedUsers = $input['allowed_users'];
                if (is_string($allowedUsers)) {
                    $allowedUsers = json_decode($allowedUsers, true) ?? [];
                }
            }

            if ($existing['created_by'] !== $userId) {
                if (isset($input['allowed_users'])) {
                    // Fetch existing allowed users
                    $stmtCurrentPerms = $pdo->prepare("SELECT account_id FROM appointment_permissions WHERE appointment_id = :id");
                    $stmtCurrentPerms->execute(['id' => $id]);
                    $currentAllowed = $stmtCurrentPerms->fetchAll(PDO::FETCH_COLUMN);
                    $currentAllowed = array_map('intval', $currentAllowed);

                    $newAllowed = array_map('intval', $allowedUsers);
                    $newAllowed = array_filter($newAllowed, function($uid) use ($existing) {
                        return $uid !== intval($existing['created_by']);
                    });

                    sort($currentAllowed);
                    sort($newAllowed);

                    if ($currentAllowed !== $newAllowed) {
                        throw new Exception('Nur der Ersteller dieses Termins darf die Freigabeliste ändern.');
                    }
                }
            } else {
                // Delete and re-insert sharing permissions (only for creator)
                $stmtDelPerm = $pdo->prepare("DELETE FROM appointment_permissions WHERE appointment_id = :id");
                $stmtDelPerm->execute(['id' => $id]);

                if (is_array($allowedUsers)) {
                    $stmtAddPerm = $pdo->prepare("INSERT INTO appointment_permissions (appointment_id, account_id) VALUES (:appointment_id, :account_id)");
                    foreach ($allowedUsers as $allowedUserId) {
                        $allowedUserId = intval($allowedUserId);
                        if ($allowedUserId !== $existing['created_by']) { // creator always has access
                            $stmtAddPerm->execute([
                                'appointment_id' => $id,
                                'account_id' => $allowedUserId
                            ]);
                        }
                    }
                }
            }

            $pdo->commit();

            echo json_encode([
                'success' => true,
                'message' => 'Termin erfolgreich aktualisiert.',
                'changed' => !empty($changes)
            ]);
            break;

        case 'delete':
            $id = intval($_GET['id'] ?? $input['id'] ?? 0);
            if ($id <= 0) {
                throw new Exception('Ungültige Termin-ID.');
            }

            $pdo->beginTransaction();

            // Fetch existing appointment to check permission
            $stmt = $pdo->prepare("SELECT * FROM appointments WHERE id = :id FOR UPDATE");
            $stmt->execute(['id' => $id]);
            $existing = $stmt->fetch();

            if (!$existing) {
                $pdo->rollBack();
                http_response_code(404);
                echo json_encode(['error' => 'Termin nicht gefunden.']);
                exit;
            }

            // Check permission: only the creator can delete the appointment
            if ($existing['created_by'] !== $userId) {
                $pdo->rollBack();
                http_response_code(403);
                echo json_encode(['error' => 'Nur der Ersteller darf diesen Termin löschen.']);
                exit;
            }

            $stmtDel = $pdo->prepare("DELETE FROM appointments WHERE id = :id");
            $stmtDel->execute(['id' => $id]);

            $pdo->commit();

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
