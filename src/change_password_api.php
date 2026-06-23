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

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

$currentPassword = $input['current_password'] ?? '';
$newPassword = $input['new_password'] ?? '';
$confirmPassword = $input['confirm_password'] ?? '';

try {
    if (empty($currentPassword) || empty($newPassword) || empty($confirmPassword)) {
        throw new Exception('Bitte fülle alle Felder aus.');
    }

    if ($newPassword === $currentPassword) {
        throw new Exception('Das neue Passwort darf nicht mit dem aktuellen Passwort übereinstimmen.');
    }

    if ($newPassword !== $confirmPassword) {
        throw new Exception('Das neue Passwort und die Bestätigung stimmen nicht überein.');
    }

    // Complexity checks
    if (strlen($newPassword) < 9) {
        throw new Exception('Das neue Passwort muss mindestens 9 Zeichen lang sein.');
    }
    if (!preg_match('/[a-z]/', $newPassword)) {
        throw new Exception('Das neue Passwort muss mindestens einen Kleinbuchstaben enthalten.');
    }
    if (!preg_match('/[A-Z]/', $newPassword)) {
        throw new Exception('Das neue Passwort muss mindestens einen Großbuchstaben enthalten.');
    }
    if (!preg_match('/\d/', $newPassword)) {
        throw new Exception('Das neue Passwort muss mindestens eine Zahl enthalten.');
    }

    // Verify current password
    $stmt = $pdo->prepare("SELECT password_hash FROM accounts WHERE id = :id");
    $stmt->execute(['id' => $userId]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($currentPassword, $user['password_hash'])) {
        throw new Exception('Das eingegebene aktuelle Passwort ist nicht korrekt.');
    }

    // Start database transaction
    $pdo->beginTransaction();

    // Update password hash
    $newHash = password_hash($newPassword, PASSWORD_DEFAULT);
    $stmtUpdate = $pdo->prepare("
        UPDATE accounts 
        SET password_hash = :password_hash, 
            updated_at = CURRENT_TIMESTAMP 
        WHERE id = :id
    ");
    $stmtUpdate->execute([
        'password_hash' => $newHash,
        'id' => $userId
    ]);

    // Clean up all remember me tokens for this user in the database
    $stmtTokens = $pdo->prepare("DELETE FROM remember_me_tokens WHERE account_id = :account_id");
    $stmtTokens->execute(['account_id' => $userId]);

    $pdo->commit();

    // Clear session and delete cookie
    if (isset($_COOKIE['remember_me'])) {
        setcookie('remember_me', '', time() - 3600, '/', '', true, true);
    }

    $_SESSION = array();
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(
            session_name(), 
            '', 
            time() - 42000,
            $params["path"], 
            $params["domain"],
            $params["secure"], 
            $params["httponly"]
        );
    }
    session_destroy();

    echo json_encode([
        'success' => true,
        'message' => 'Passwort erfolgreich geändert.'
    ]);

} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(400);
    echo json_encode([
        'error' => $e->getMessage()
    ]);
}
