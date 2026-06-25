<?php
require_once 'auth_helper.php';

// Check if user is already logged in or auto-logged in via remember me
if (check_remember_me()) {
    header('Location: dashboard.php');
    exit;
}

$error_message = '';
$success_message = '';

if (isset($_GET['logged_out']) && $_GET['logged_out'] == 1) {
    $success_message = 'Erfolgreich abgemeldet.';
} elseif (isset($_GET['password_changed']) && $_GET['password_changed'] == 1) {
    $success_message = 'Dein Passwort wurde erfolgreich geändert. Bitte melde dich mit dem neuen Passwort an.';
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';
    $remember_me = isset($_POST['remember_me']);

    if (empty($username) || empty($password)) {
        $error_message = 'Bitte gib Benutzernamen und Passwort ein.';
    } else {
        try {
            $pdo = get_db_connection();
            $stmt = $pdo->prepare("SELECT * FROM accounts WHERE username = :username");
            $stmt->execute(['username' => $username]);
            $user = $stmt->fetch();

            if ($user && $user['is_active']) {
                if (password_verify($password, $user['password_hash'])) {
                    // Start session securely
                    $_SESSION['logged_in'] = true;
                    $_SESSION['user_id'] = $user['id'];
                    $_SESSION['username'] = $user['username'];
                    $_SESSION['role'] = $user['role'];

                    // Update last login
                    $stmt_update = $pdo->prepare("UPDATE accounts SET last_login_at = CURRENT_TIMESTAMP WHERE id = :id");
                    $stmt_update->execute(['id' => $user['id']]);

                    // Set Remember Me token if checked
                    if ($remember_me) {
                        set_remember_token($pdo, $user['id']);
                    }

                    header('Location: dashboard.php');
                    exit;
                }
            }

            // Generic error message for security (don't reveal whether user exists)
            $error_message = 'Ungültiger Benutzername oder Passwort.';
        } catch (Exception $e) {
            error_log("Login error: " . $e->getMessage());
            $error_message = 'Ein Systemfehler ist aufgetreten. Bitte versuche es später noch einmal.';
        }
    }
}
?>
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Anmelden - Secure Access</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="login-wrapper">
        <div class="card">
            <div class="logo-area">
                <div class="logo-icon">
                    <svg viewBox="0 0 24 24">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                </div>
                <h1>Willkommen</h1>
                <p class="subtitle">Bitte melde dich an, um fortzufahren.</p>
            </div>

            <?php if (!empty($error_message)): ?>
                <div class="alert alert-danger" id="alert-error">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <span><?php echo htmlspecialchars($error_message); ?></span>
                </div>
            <?php endif; ?>

            <?php if (!empty($success_message)): ?>
                <div class="alert alert-success" id="alert-success">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    <span><?php echo htmlspecialchars($success_message); ?></span>
                </div>
            <?php endif; ?>

            <form action="login.php" method="POST" autocomplete="off">
                <div class="form-group">
                    <label for="username" class="form-label">Benutzername</label>
                    <div class="input-wrapper">
                        <div class="input-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                        </div>
                        <input type="text" id="username" name="username" class="form-input" placeholder="Dein Benutzername" required value="<?php echo htmlspecialchars($username ?? ''); ?>">
                    </div>
                </div>

                <div class="form-group">
                    <label for="password" class="form-label">Passwort</label>
                    <div class="input-wrapper">
                        <div class="input-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                        </div>
                        <input type="password" id="password" name="password" class="form-input" placeholder="••••••••" required>
                    </div>
                </div>

                <div class="form-options">
                    <label class="checkbox-container">
                        <input type="checkbox" id="remember_me" name="remember_me">
                        <span class="checkmark"></span>
                        Angemeldet bleiben
                    </label>
                </div>

                <button type="submit" class="btn" id="btn-login">
                    Anmelden
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                </button>
            </form>
        </div>
    </div>
</body>
</html>
