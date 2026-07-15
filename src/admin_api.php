<?php
require_once 'auth_helper.php';

// Force authentication
if (!check_remember_me()) {
    header('HTTP/1.1 401 Unauthorized');
    echo json_encode(['success' => false, 'error' => 'Nicht autorisiert.']);
    exit;
}

header('Content-Type: application/json');

try {
    $pdo = get_db_connection();
    
    // Check if the current user exists, is active, and is an ADMIN
    $stmt = $pdo->prepare("SELECT id, username, is_active, role FROM accounts WHERE id = :id");
    $stmt->execute(['id' => $_SESSION['user_id']]);
    $currentUser = $stmt->fetch();

    if (!$currentUser || !$currentUser['is_active']) {
        echo json_encode(['success' => false, 'error' => 'Konto inaktiv oder gelöscht.']);
        exit;
    }

    if ($currentUser['role'] !== 'admin') {
        echo json_encode(['success' => false, 'error' => 'Zugriff verweigert. Admin-Rechte erforderlich.']);
        exit;
    }

    $action = $_GET['action'] ?? '';
    
    // Read JSON payload for POST requests, fallback to $_POST
    $input = file_get_contents('php://input');
    $payload = json_decode($input, true) ?? $_POST;

    if ($action === 'list_users') {
        $stmt = $pdo->query("
            SELECT id, username, role, is_active, last_login_at 
            FROM accounts 
            ORDER BY id ASC
        ");
        $users = $stmt->fetchAll();
        echo json_encode(['success' => true, 'users' => $users]);
        exit;
    }

    if ($action === 'user_history') {
        $id = $_GET['id'] ?? null;
        if (!$id) {
            echo json_encode(['success' => false, 'error' => 'Ungültige Benutzer-ID.']);
            exit;
        }

        // Fetch username
        $stmtName = $pdo->prepare("SELECT username FROM accounts WHERE id = :id");
        $stmtName->execute(['id' => $id]);
        $username = $stmtName->fetchColumn();
        if (!$username) {
            echo json_encode(['success' => false, 'error' => 'Benutzer nicht gefunden.']);
            exit;
        }

        // Fetch last 10 changes (including creations) where the current admin has permission
        $stmt = $pdo->prepare("
            (
                SELECT h.id, h.changed_at, h.changes, a.title AS appointment_title, a.id AS appointment_id, FALSE as is_creation
                FROM appointment_history h
                JOIN appointments a ON h.appointment_id = a.id
                WHERE h.changed_by = :userId
                  AND (
                      a.created_by = :adminId
                      OR EXISTS (
                          SELECT 1 FROM appointment_permissions ap
                          WHERE ap.appointment_id = a.id AND ap.account_id = :adminId
                      )
                  )
            )
            UNION ALL
            (
                SELECT a.id, a.created_at as changed_at, CAST(NULL AS jsonb) as changes, a.title AS appointment_title, a.id AS appointment_id, TRUE as is_creation
                FROM appointments a
                WHERE a.created_by = :userId
                  AND (
                      a.created_by = :adminId
                      OR EXISTS (
                          SELECT 1 FROM appointment_permissions ap
                          WHERE ap.appointment_id = a.id AND ap.account_id = :adminId
                      )
                  )
            )
            ORDER BY changed_at DESC
            LIMIT 10
        ");
        $stmt->execute([
            'userId' => $id,
            'adminId' => $currentUser['id']
        ]);
        $history = $stmt->fetchAll();

        // Decode JSON changes and convert flags
        foreach ($history as &$log) {
            if ($log['changes'] !== null) {
                $log['changes'] = json_decode($log['changes'], true);
            }
            $log['is_creation'] = filter_var($log['is_creation'], FILTER_VALIDATE_BOOLEAN);
        }

        echo json_encode([
            'success' => true,
            'username' => $username,
            'history' => $history
        ]);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        if ($action === 'add_user') {
            $username = trim($payload['username'] ?? '');
            $role = trim($payload['role'] ?? '');

            if (empty($username) || empty($role)) {
                echo json_encode(['success' => false, 'error' => 'Bitte alle Felder ausfüllen.']);
                exit;
            }

            if ($role !== 'admin' && $role !== 'user') {
                echo json_encode(['success' => false, 'error' => 'Ungültige Rolle.']);
                exit;
            }

            // Check if username already exists
            $stmtCheck = $pdo->prepare("SELECT id FROM accounts WHERE username = :username");
            $stmtCheck->execute(['username' => $username]);
            if ($stmtCheck->fetch()) {
                echo json_encode(['success' => false, 'error' => 'Dieser Benutzername existiert bereits.']);
                exit;
            }

            $passwordHash = password_hash('Start123!', PASSWORD_DEFAULT);

            $stmtInsert = $pdo->prepare("
                INSERT INTO accounts (username, password_hash, role, is_active) 
                VALUES (:username, :password_hash, :role, true)
            ");
            
            $stmtInsert->execute([
                'username' => $username,
                'password_hash' => $passwordHash,
                'role' => $role
            ]);

            echo json_encode(['success' => true]);
            exit;
        }

        if ($action === 'reset_password') {
            $id = $payload['id'] ?? $_GET['id'] ?? null;
            if (!$id) {
                echo json_encode(['success' => false, 'error' => 'Ungültige Benutzer-ID.']);
                exit;
            }

            $passwordHash = password_hash('Start123!', PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("UPDATE accounts SET password_hash = :hash, updated_at = CURRENT_TIMESTAMP WHERE id = :id");
            $stmt->execute([
                'hash' => $passwordHash,
                'id' => $id
            ]);

            echo json_encode(['success' => true]);
            exit;
        }

        if ($action === 'deactivate_user' || $action === 'activate_user') {
            $id = $payload['id'] ?? $_GET['id'] ?? null;
            if (!$id) {
                echo json_encode(['success' => false, 'error' => 'Ungültige Benutzer-ID.']);
                exit;
            }

            if ($id == $currentUser['id']) {
                echo json_encode(['success' => false, 'error' => 'Du kannst dein eigenes Konto nicht deaktivieren.']);
                exit;
            }

            $isActive = ($action === 'activate_user') ? 'true' : 'false';

            $stmt = $pdo->prepare("UPDATE accounts SET is_active = {$isActive}, updated_at = CURRENT_TIMESTAMP WHERE id = :id");
            $stmt->execute(['id' => $id]);

            // If deactivated, we should also delete their remember me tokens so they are logged out immediately
            if ($action === 'deactivate_user') {
                $stmtDel = $pdo->prepare("DELETE FROM remember_me_tokens WHERE account_id = :id");
                $stmtDel->execute(['id' => $id]);
            }

            echo json_encode(['success' => true]);
            exit;
        }
    }

    echo json_encode(['success' => false, 'error' => 'Ungültige Aktion.']);

} catch (PDOException $e) {
    error_log("Admin API Database Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'error' => 'Datenbankfehler.']);
} catch (Exception $e) {
    error_log("Admin API General Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'error' => 'Systemfehler.']);
}
?>
