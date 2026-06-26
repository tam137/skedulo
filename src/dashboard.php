<?php
require_once 'auth_helper.php';

// Force authentication
if (!check_remember_me()) {
    header('Location: login.php');
    exit;
}

try {
    $pdo = get_db_connection();
    // Fetch fresh user data to verify status
    $stmt = $pdo->prepare("SELECT id, username, role, is_active, created_at, last_login_at, ics_token FROM accounts WHERE id = :id");
    $stmt->execute(['id' => $_SESSION['user_id']]);
    $user = $stmt->fetch();

    if ($user && empty($user['ics_token'])) {
        $newToken = bin2hex(random_bytes(32));
        $stmtUpdate = $pdo->prepare("UPDATE accounts SET ics_token = :token WHERE id = :id");
        $stmtUpdate->execute(['token' => $newToken, 'id' => $_SESSION['user_id']]);
        $user['ics_token'] = $newToken;
    }

    // If user is inactive or deleted, force logout
    if (!$user || !$user['is_active']) {
        header('Location: logout.php');
        exit;
    }
} catch (Exception $e) {
    error_log("Dashboard load error: " . $e->getMessage());
    die("Systemfehler. Profil konnte nicht geladen werden.");
}

$first_char = strtoupper(substr($user['username'], 0, 1));
?>
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Terminkalender</title>
    <link rel="icon" type="image/svg+xml" href="favicon.svg">
    <link rel="alternate icon" type="image/png" href="favicon.png">
    <link rel="stylesheet" href="styles.css?v=<?php echo filemtime('styles.css'); ?>">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/themes/dark.css">
</head>
<body>
    <!-- Drawer Backdrop -->
    <div class="drawer-backdrop" id="drawer-backdrop"></div>

    <!-- Sidebar Drawer (Account Details) -->
    <div class="sidebar-drawer" id="sidebar-drawer">
        <div class="user-profile">
            <div class="avatar">
                <?php echo htmlspecialchars($first_char); ?>
            </div>
            <div class="user-info">
                <h2>Hallo, <?php echo htmlspecialchars($user['username']); ?>!</h2>
            </div>
        </div>

        <div class="nav-menu">
            <a href="#" class="nav-link active" id="nav-calendar">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                Kalender
            </a>
            <a href="#" class="nav-link" id="nav-files">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
                Dateiverwaltung
            </a>
            <?php if ($user['role'] === 'admin'): ?>
            <a href="#" class="nav-link" id="nav-admin">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
                Admin-Bereich
            </a>
            <?php endif; ?>
        </div>

        <div class="sidebar-footer">
            <button id="copy-ics-btn" class="change-pwd-btn" data-token="<?php echo htmlspecialchars($user['ics_token']); ?>" style="margin-bottom: 8px;">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                </svg>
                Outlook Feed Link kopieren
            </button>
            <button id="change-pwd-btn" class="change-pwd-btn">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                Passwort ändern
            </button>
            <a href="logout.php" class="logout-btn">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                Abmelden
            </a>
        </div>
    </div>

    <!-- Main Container -->
    <div class="dashboard-container">
        <div class="dashboard-header">
            <div class="dashboard-header-title-container">
                <div class="logo-icon">
                    <svg viewBox="0 0 24 24">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                </div>
                <h1 id="main-title">Kalender</h1>
            </div>
            
            <!-- Hamburger Button -->
            <button class="hamburger-btn" id="hamburger-btn" aria-label="Menü öffnen">
                <span></span>
                <span></span>
                <span></span>
            </button>
        </div>

        <!-- Dashboard Content -->
        <div id="calendar-view" class="dashboard-card">
            <div class="card-header">
                <h2>Terminkalender</h2>
                <button class="add-btn" id="add-appointment-btn">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Neuer Termin
                </button>
            </div>

            <!-- Upcoming Appointments -->
            <div class="table-container">
                <table class="appointments-table" id="upcoming-table">
                    <thead>
                        <tr>
                            <th>Datum</th>
                            <th>Name</th>
                            <th>Ort</th>
                            <th>Notizen</th>
                        </tr>
                    </thead>
                    <tbody id="upcoming-tbody">
                        <tr>
                            <td colspan="4" class="table-empty-message">
                                Lade Termine...
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Past Appointments (Accordion) -->
            <div class="past-appointments-section">
                <details class="past-appointments-details">
                    <summary class="past-appointments-summary">Vergangene Termine</summary>
                    <div class="past-appointments-content">
                        <div class="table-container">
                            <table class="appointments-table" id="past-table">
                                <thead>
                                    <tr>
                                        <th>Datum</th>
                                        <th>Name</th>
                                        <th>Ort</th>
                                        <th>Notizen</th>
                                    </tr>
                                </thead>
                                <tbody id="past-tbody">
                                    <tr>
                                        <td colspan="4" class="table-empty-message">
                                            Keine vergangenen Termine vorhanden.
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </details>
            </div>
        </div>

        <!-- Files Content -->
        <div id="files-view" class="dashboard-card hidden">
            <div class="card-header">
                <h2>Alle Dateien</h2>
                <div>
                    <input type="file" id="global-file-input" class="file-input-hidden">
                    <button class="add-btn" id="upload-global-file-btn">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line>
                        </svg>
                        Datei hochladen
                    </button>
                </div>
            </div>
            
            <div class="table-container">
                <table class="appointments-table" id="files-table">
                    <thead>
                        <tr>
                            <th>Dateiname</th>
                            <th>Termin</th>
                            <th>Größe</th>
                            <th>Hochgeladen von</th>
                            <th>Datum</th>
                            <th class="text-right">Aktionen</th>
                        </tr>
                    </thead>
                    <tbody id="files-tbody">
                        <tr>
                            <td colspan="6" class="table-empty-message">
                                Lade Dateien...
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Admin Content -->
        <?php if ($user['role'] === 'admin'): ?>
        <div id="admin-view" class="dashboard-card hidden">
            <div class="card-header">
                <h2>Benutzerverwaltung</h2>
                <button class="add-btn" id="add-user-btn">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="8.5" cy="7" r="4"></circle>
                        <line x1="20" y1="8" x2="20" y2="14"></line>
                        <line x1="23" y1="11" x2="17" y2="11"></line>
                    </svg>
                    Neuer Benutzer
                </button>
            </div>
            
            <div class="table-container">
                <table class="appointments-table" id="users-table">
                    <thead>
                        <tr>
                            <th>Benutzername</th>
                            <th>Rolle</th>
                            <th>Status</th>
                            <th>Letzter Login</th>
                            <th class="text-right">Aktionen</th>
                        </tr>
                    </thead>
                    <tbody id="users-tbody">
                        <tr>
                            <td colspan="5" class="table-empty-message">
                                Lade Benutzer...
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        <?php endif; ?>
    </div>

    <!-- Appointment Modal (Create / Edit) -->
    <div class="modal-overlay" id="appointment-modal">
        <div class="modal-card">
            <div class="modal-header">
                <h3 class="modal-title" id="modal-title">Termin erstellen</h3>
                <button class="close-btn" id="close-modal-btn">&times;</button>
            </div>
            <form id="appointment-form">
                <input type="hidden" id="appointment-id" name="id" value="">
                
                <div class="form-group">
                    <label for="title" class="form-label">Name des Termins</label>
                    <input type="text" id="title" name="title" class="form-input form-input-no-icon" required>
                </div>

                <div class="form-group">
                    <label class="form-label">Symbol</label>
                    <input type="hidden" id="appointment-icon" name="icon" value="">
                    <div class="emoji-picker" id="emoji-picker">
                        <button type="button" class="emoji-btn btn-none" data-emoji="" title="Kein Symbol">🚫</button>
                        <button type="button" class="emoji-btn" data-emoji="❤️" title="Herz">❤️</button>
                        <button type="button" class="emoji-btn" data-emoji="🏃‍♀️" title="Sportlerin">🏃‍♀️</button>
                        <button type="button" class="emoji-btn" data-emoji="💃" title="Tanzende Person">💃</button>
                        <button type="button" class="emoji-btn" data-emoji="🌴" title="Urlaubspalme">🌴</button>
                        <button type="button" class="emoji-btn" data-emoji="💻" title="Arbeitslaptop">💻</button>
                        <button type="button" class="emoji-btn" data-emoji="🩺" title="Stethoskop">🩺</button>
                        <button type="button" class="emoji-btn" data-emoji="🐱" title="Katze">🐱</button>
                        <button type="button" class="emoji-btn" data-emoji="🏠" title="Familie/Zuhause">🏠</button>
                        <button type="button" class="emoji-btn" data-emoji="🧑‍🤝‍🧑" title="Freunde">🧑‍🤝‍🧑</button>
                    </div>
                </div>

                <div class="form-group">
                    <label for="appointment_date" class="form-label">Datum</label>
                    <div class="input-wrapper">
                        <div class="input-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                        </div>
                        <input type="date" id="appointment_date" name="appointment_date" class="form-input" required>
                    </div>
                </div>

                <div class="form-group">
                    <label for="location" class="form-label">Ort</label>
                    <input type="text" id="location" name="location" class="form-input form-input-no-icon">
                </div>

                <div class="form-group">
                    <label for="notes" class="form-label">Notizen</label>
                    <textarea id="notes" name="notes" class="form-input"></textarea>
                </div>

                <div class="form-group">
                    <label class="form-label">Teilen mit (Lese- & Schreibrechte)</label>
                    <div class="custom-multiselect" id="appointment-sharing-select">
                        <div class="multiselect-trigger">
                            <span class="multiselect-placeholder">Niemandem freigegeben</span>
                            <span class="multiselect-arrow">▼</span>
                        </div>
                        <div class="multiselect-dropdown">
                            <div class="multiselect-search-container">
                                <input type="text" class="multiselect-search" placeholder="Benutzer suchen...">
                            </div>
                            <div class="multiselect-options">
                                <!-- Options will be populated here -->
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Files Section -->
                <div class="files-section" id="modal-files-section">
                    <div class="files-section-header">
                        <label class="form-label">Dateien</label>
                        <button type="button" class="btn-cancel btn-upload-file" id="btn-upload-appointment-file" disabled>+ Datei anhängen</button>
                    </div>
                    <div class="files-hint hidden" id="files-hint">
                        Speichere den Termin zuerst, um Dateien hochladen zu können.
                    </div>
                    <input type="file" id="appointment-file-input" class="file-input-hidden">
                    
                    <div id="appointment-files-list">
                        <!-- Files populated here -->
                    </div>
                </div>

                <!-- Edit History Section (Collapsible, hidden for new creations) -->
                <div class="history-section hidden" id="modal-history-section">
                    <details class="history-details" id="history-details">
                        <summary class="history-summary">Änderungshistorie</summary>
                        <div class="history-content" id="history-content">
                            <!-- Populated dynamically -->
                        </div>
                    </details>
                </div>

                <div class="modal-footer">
                    <button type="button" class="btn-delete hidden" id="delete-btn">Löschen</button>
                    <div class="modal-footer-actions">
                        <button type="button" class="btn-cancel" id="cancel-modal-btn">Abbrechen</button>
                        <button type="submit" class="btn-save" id="save-btn">Speichern</button>
                    </div>
                </div>
            </form>
        </div>
    </div>

    <!-- Custom Delete Confirmation Overlay -->
    <div class="confirm-overlay" id="confirm-overlay">
        <div class="confirm-card">
            <h3>Termin löschen?</h3>
            <p>Bist du sicher, dass du diesen Termin dauerhaft löschen möchtest?</p>
            <div class="confirm-actions">
                <button class="btn-confirm-cancel" id="confirm-cancel-btn">Abbrechen</button>
                <button class="btn-confirm-delete" id="confirm-delete-btn">Ja, löschen</button>
            </div>
        </div>
    </div>

    <!-- Add User Modal -->
    <div class="modal-overlay" id="add-user-modal">
        <div class="modal-card modal-card-sm">
            <div class="modal-header">
                <h3 class="modal-title">Benutzer hinzufügen</h3>
                <button class="close-btn" id="close-add-user-modal-btn">&times;</button>
            </div>
            
            <div class="alert alert-danger hidden" id="add-user-error-alert">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span id="add-user-error-message"></span>
            </div>

            <form id="add-user-form" autocomplete="off">
                <div class="form-group">
                    <label for="new-username" class="form-label">Benutzername</label>
                    <input type="text" id="new-username" name="username" class="form-input form-input-no-icon" required>
                </div>

                <div class="form-group">
                    <label for="new-role" class="form-label">Rolle</label>
                    <select id="new-role" name="role" class="form-input form-input-no-icon" required>
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
                
                <div class="files-hint" style="margin-top: 10px; margin-bottom: 0; display: block;">
                    Das Startpasswort wird automatisch auf <strong>Start123!</strong> gesetzt.
                </div>

                <div class="modal-footer modal-footer-compact">
                    <button type="button" class="btn-cancel" id="cancel-add-user-modal-btn">Abbrechen</button>
                    <button type="submit" class="btn-save" id="save-add-user-btn">Speichern</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Change Password Modal -->
    <div class="modal-overlay" id="change-password-modal">
        <div class="modal-card modal-card-sm">
            <div class="modal-header">
                <h3 class="modal-title">Passwort ändern</h3>
                <button class="close-btn" id="close-pwd-modal-btn">&times;</button>
            </div>
            
            <div class="alert alert-danger hidden" id="pwd-error-alert">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span id="pwd-error-message"></span>
            </div>

            <div class="alert alert-success hidden" id="pwd-success-alert">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <span>Passwort erfolgreich geändert! Du wirst jetzt abgemeldet...</span>
            </div>

            <form id="change-password-form" autocomplete="off">
                <div class="form-group">
                    <label for="current-password" class="form-label">Aktuelles Passwort</label>
                    <div class="input-wrapper">
                        <div class="input-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                        </div>
                        <input type="password" id="current-password" name="current_password" class="form-input" placeholder="••••••••" required>
                    </div>
                </div>

                <div class="form-group">
                    <label for="new-password" class="form-label">Neues Passwort</label>
                    <div class="input-wrapper">
                        <div class="input-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                        </div>
                        <input type="password" id="new-password" name="new_password" class="form-input" placeholder="••••••••" required>
                    </div>
                </div>

                <div class="form-group form-group-sm">
                    <label for="confirm-password" class="form-label">Passwort verifizieren</label>
                    <div class="input-wrapper">
                        <div class="input-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                        </div>
                        <input type="password" id="confirm-password" name="confirm_password" class="form-input" placeholder="••••••••" required>
                    </div>
                </div>

                <div class="pwd-requirements">
                    <div id="req-length" class="req-item">
                        <span class="req-dot"></span>
                        Mindestens 9 Zeichen
                    </div>
                    <div id="req-lowercase" class="req-item">
                        <span class="req-dot"></span>
                        Mindestens ein Kleinbuchstabe (a-z)
                    </div>
                    <div id="req-uppercase" class="req-item">
                        <span class="req-dot"></span>
                        Mindestens ein Großbuchstabe (A-Z)
                    </div>
                    <div id="req-number" class="req-item">
                        <span class="req-dot"></span>
                        Mindestens eine Zahl (0-9)
                    </div>
                    <div id="req-match" class="req-item">
                        <span class="req-dot"></span>
                        Passwörter stimmen überein
                    </div>
                </div>

                <div class="modal-footer modal-footer-compact">
                    <button type="button" class="btn-cancel" id="cancel-pwd-modal-btn">Abbrechen</button>
                    <button type="submit" class="btn-save" id="save-pwd-btn" disabled>Speichern</button>
                </div>
            </form>
        </div>
    </div>
    <!-- Global File Upload Modal -->
    <div class="modal-overlay" id="upload-file-modal">
        <div class="modal-card modal-card-md">
            <div class="modal-header">
                <h3 class="modal-title">Datei hochladen</h3>
                <button class="close-btn" id="close-upload-modal-btn">&times;</button>
            </div>
            <div class="alert alert-danger hidden" id="upload-file-error-alert" style="margin: 0 24px 16px 24px;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span id="upload-file-error-message"></span>
            </div>
            <form id="global-file-upload-form" autocomplete="off">
                <div class="form-group">
                    <label class="form-label">Datei auswählen</label>
                    <div class="custom-file-upload">
                        <button type="button" class="btn-cancel" id="btn-select-global-file">Datei auswählen</button>
                        <span id="global-file-name-display" class="file-name-display">Keine Datei ausgewählt</span>
                    </div>
                    <input type="file" id="global-upload-file-field" class="file-input-hidden" required>
                </div>

                <div class="form-group">
                    <label class="form-label" for="global-upload-appointment-field">Termin zuordnen (Optional)</label>
                    <select id="global-upload-appointment-field" class="form-input form-input-no-icon">
                        <option value="">Kein Termin zugeordnet</option>
                    </select>
                </div>

                <div class="form-group" id="file-sharing-group">
                    <label class="form-label">Freigeben für</label>
                    <div class="custom-multiselect" id="file-sharing-select">
                        <div class="multiselect-trigger">
                            <span class="multiselect-placeholder">Niemandem freigegeben</span>
                            <span class="multiselect-arrow">▼</span>
                        </div>
                        <div class="multiselect-dropdown">
                            <div class="multiselect-search-container">
                                <input type="text" class="multiselect-search" placeholder="Benutzer suchen...">
                            </div>
                            <div class="multiselect-options">
                                <!-- Options will be populated here -->
                            </div>
                        </div>
                    </div>
                </div>

                <div class="modal-footer modal-footer-compact">
                    <button type="button" class="btn-cancel" id="cancel-upload-modal-btn">Abbrechen</button>
                    <button type="submit" class="btn-save" id="save-upload-modal-btn">Hochladen</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Flatpickr Library -->
    <script src="https://cdn.jsdelivr.net/npm/flatpickr"></script>
    <script src="https://cdn.jsdelivr.net/npm/flatpickr/dist/l10n/de.js"></script>

    <!-- JavaScript Logic -->
    <script src="dashboard.js?v=<?php echo filemtime('dashboard.js'); ?>"></script>
</body>
</html>
