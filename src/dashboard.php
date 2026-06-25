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
    $stmt = $pdo->prepare("SELECT id, username, is_active, created_at, last_login_at FROM accounts WHERE id = :id");
    $stmt->execute(['id' => $_SESSION['user_id']]);
    $user = $stmt->fetch();

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
    <link rel="stylesheet" href="styles.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/themes/dark.css">
</head>
<body>
    <!-- Drawer Backdrop -->
    <div class="drawer-backdrop" id="drawer-backdrop"></div>

    <!-- Sidebar Drawer (Account Details) -->
    <div class="sidebar-drawer" id="sidebar-drawer">
        <div class="user-profile" style="flex-direction: column; text-align: center; border-bottom: 1px solid var(--border-color); padding-bottom: 20px;">
            <div class="avatar">
                <?php echo htmlspecialchars($first_char); ?>
            </div>
            <div class="user-info" style="margin-top: 12px;">
                <h2 style="font-size: 1.2rem; color: #ffffff;">Hallo, <?php echo htmlspecialchars($user['username']); ?>!</h2>
                <div class="status-indicator" style="margin-top: 6px;">
                    <span class="status-dot"></span>
                    Konto aktiv
                </div>
            </div>
        </div>
        
        <div class="meta-grid" style="grid-template-columns: 1fr; gap: 12px;">
            <div class="meta-item" style="padding: 12px 16px;">
                <div class="meta-item-label">Letzter Login</div>
                <div class="meta-item-value" style="font-size: 0.95rem;">
                    <?php 
                    if ($user['last_login_at']) {
                        echo date('d.m.Y H:i', strtotime($user['last_login_at']));
                    } else {
                        echo 'Jetzt';
                    }
                    ?>
                </div>
            </div>
        </div>

        <div class="nav-menu" style="margin-top: 24px; display: flex; flex-direction: column; gap: 8px; border-bottom: 1px solid var(--border-color); padding-bottom: 24px;">
            <a href="#" class="nav-link active" id="nav-calendar" style="display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 8px; color: var(--text-primary); text-decoration: none; font-weight: 500; background: var(--bg-hover);">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                Kalender
            </a>
            <a href="#" class="nav-link" id="nav-files" style="display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 8px; color: var(--text-secondary); text-decoration: none; font-weight: 500;">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
                Dateiverwaltung
            </a>
        </div>

        <div style="margin-top: auto; padding-top: 20px; display: flex; flex-direction: column; gap: 12px;">
            <button id="change-pwd-btn" class="change-pwd-btn" style="width: 100%; justify-content: center; box-sizing: border-box;">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                Passwort ändern
            </button>
            <a href="logout.php" class="logout-btn" style="text-decoration: none; display: flex; width: 100%; justify-content: center; box-sizing: border-box;">
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
            <div style="display: flex; align-items: center; gap: 12px;">
                <div class="logo-icon" style="width: 40px; height: 40px; margin-bottom: 0; border-radius: 12px; box-shadow: none;">
                    <svg viewBox="0 0 24 24" style="width: 20px; height: 20px;">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                </div>
                <h1 style="font-size: 1.4rem;" id="main-title">Kalender</h1>
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
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; gap: 12px;">
                <h2 style="font-size: 1.5rem; font-weight: 600; color: #ffffff;">Terminkalender</h2>
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
                            <td colspan="4" style="text-align: center; color: var(--text-secondary); padding: 30px;">
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
                        <div class="table-container" style="border: none; border-radius: 0; margin-bottom: 0;">
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
                                        <td colspan="4" style="text-align: center; color: var(--text-secondary); padding: 30px;">
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
        <div id="files-view" class="dashboard-card" style="display: none;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; gap: 12px;">
                <h2 style="font-size: 1.5rem; font-weight: 600; color: #ffffff;">Alle Dateien</h2>
                <div>
                    <input type="file" id="global-file-input" style="display: none;">
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
                            <th style="text-align: right;">Aktionen</th>
                        </tr>
                    </thead>
                    <tbody id="files-tbody">
                        <tr>
                            <td colspan="6" style="text-align: center; color: var(--text-secondary); padding: 30px;">
                                Lade Dateien...
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
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
                    <input type="text" id="title" name="title" class="form-input" required style="padding-left: 16px;">
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
                    <input type="text" id="location" name="location" class="form-input" style="padding-left: 16px;">
                </div>

                <div class="form-group">
                    <label for="notes" class="form-label">Notizen</label>
                    <textarea id="notes" name="notes" class="form-input" style="padding-left: 16px; min-height: 80px; resize: vertical; padding-top: 10px;"></textarea>
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
                <div class="files-section" id="modal-files-section" style="margin-bottom: 24px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <label class="form-label" style="margin-bottom: 0;">Dateien</label>
                        <button type="button" class="btn-cancel" id="btn-upload-appointment-file" style="padding: 6px 12px; font-size: 0.85rem;" disabled>+ Datei anhängen</button>
                    </div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 12px; display: none;" id="files-hint">
                        Speichere den Termin zuerst, um Dateien hochladen zu können.
                    </div>
                    <input type="file" id="appointment-file-input" style="display: none;">
                    
                    <div id="appointment-files-list" style="display: flex; flex-direction: column; gap: 8px;">
                        <!-- Files populated here -->
                    </div>
                </div>

                <!-- Edit History Section (Collapsible, hidden for new creations) -->
                <div class="history-section" id="modal-history-section" style="display: none;">
                    <details class="history-details" id="history-details">
                        <summary class="history-summary">Änderungshistorie</summary>
                        <div class="history-content" id="history-content">
                            <!-- Populated dynamically -->
                        </div>
                    </details>
                </div>

                <div class="modal-footer">
                    <button type="button" class="btn-delete" id="delete-btn" style="display: none;">Löschen</button>
                    <div style="display: flex; gap: 12px; margin-left: auto;">
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

    <!-- Change Password Modal -->
    <div class="modal-overlay" id="change-password-modal">
        <div class="modal-card" style="max-width: 440px;">
            <div class="modal-header">
                <h3 class="modal-title">Passwort ändern</h3>
                <button class="close-btn" id="close-pwd-modal-btn">&times;</button>
            </div>
            
            <div class="alert alert-danger" id="pwd-error-alert" style="display: none; margin-bottom: 16px;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span id="pwd-error-message"></span>
            </div>

            <div class="alert alert-success" id="pwd-success-alert" style="display: none; margin-bottom: 16px;">
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

                <div class="form-group" style="margin-bottom: 16px;">
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

                <div class="modal-footer" style="margin-top: 0; padding-top: 16px;">
                    <button type="button" class="btn-cancel" id="cancel-pwd-modal-btn">Abbrechen</button>
                    <button type="submit" class="btn-save" id="save-pwd-btn" disabled style="opacity: 0.5; cursor: not-allowed;">Speichern</button>
                </div>
            </form>
        </div>
    <!-- Global File Upload Modal -->
      <div class="modal-overlay" id="upload-file-modal">
          <div class="modal-card" style="max-width: 460px;">
              <div class="modal-header">
                  <h3 class="modal-title">Datei hochladen</h3>
                  <button class="close-btn" id="close-upload-modal-btn">&times;</button>
              </div>
              <form id="global-file-upload-form" autocomplete="off">
                  <div class="form-group">
                      <label class="form-label" for="global-upload-file-field">Datei auswählen</label>
                      <input type="file" id="global-upload-file-field" class="form-input" style="padding-left: 16px;" required>
                  </div>

                  <div class="form-group">
                      <label class="form-label">Freigeben für (Zwingend erforderlich)</label>
                      <div class="custom-multiselect" id="file-sharing-select">
                          <div class="multiselect-trigger">
                              <span class="multiselect-placeholder">Bitte wähle mindestens einen Benutzer...</span>
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

                  <div class="modal-footer" style="padding-top: 16px;">
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
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            // Sidebar Elements
            const hamburgerBtn = document.getElementById('hamburger-btn');
            const sidebarDrawer = document.getElementById('sidebar-drawer');
            const drawerBackdrop = document.getElementById('drawer-backdrop');

            // Modal & Overlay Elements
            const appointmentModal = document.getElementById('appointment-modal');
            const confirmOverlay = document.getElementById('confirm-overlay');
            const appointmentForm = document.getElementById('appointment-form');
            const modalTitle = document.getElementById('modal-title');
            
            // Form Fields
            const appointmentIdInput = document.getElementById('appointment-id');
            const titleInput = document.getElementById('title');
            const dateInput = document.getElementById('appointment_date');
            const locationInput = document.getElementById('location');
            const notesInput = document.getElementById('notes');
            const appointmentIconInput = document.getElementById('appointment-icon');
            const emojiPicker = document.getElementById('emoji-picker');
            const emojiBtns = emojiPicker.querySelectorAll('.emoji-btn');
            
            // Buttons
            const addBtn = document.getElementById('add-appointment-btn');
            const closeModalBtn = document.getElementById('close-modal-btn');
            const cancelModalBtn = document.getElementById('cancel-modal-btn');
            const deleteBtn = document.getElementById('delete-btn');
            const confirmCancelBtn = document.getElementById('confirm-cancel-btn');
            const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
            const historySection = document.getElementById('modal-history-section');
            const historyContent = document.getElementById('history-content');
            const historyDetails = document.getElementById('history-details');

            // View Management
            const navCalendar = document.getElementById('nav-calendar');
            const navFiles = document.getElementById('nav-files');
            const calendarView = document.getElementById('calendar-view');
            const filesView = document.getElementById('files-view');
            const mainTitle = document.getElementById('main-title');

            // Files Elements
            const uploadGlobalBtn = document.getElementById('upload-global-file-btn');
            const globalFileInput = document.getElementById('global-file-input');
            const filesTbody = document.getElementById('files-tbody');
            
            const btnUploadAppointmentFile = document.getElementById('btn-upload-appointment-file');
            const appointmentFileInput = document.getElementById('appointment-file-input');
            const appointmentFilesList = document.getElementById('appointment-files-list');
            const filesHint = document.getElementById('files-hint');

            // Change Password Elements
            const changePwdBtn = document.getElementById('change-pwd-btn');
            const changePwdModal = document.getElementById('change-password-modal');
            const closePwdModalBtn = document.getElementById('close-pwd-modal-btn');
            const cancelPwdModalBtn = document.getElementById('cancel-pwd-modal-btn');
            const changePwdForm = document.getElementById('change-password-form');
            const currentPwdInput = document.getElementById('current-password');
            const newPwdInput = document.getElementById('new-password');
            const confirmPwdInput = document.getElementById('confirm-password');
            const reqLength = document.getElementById('req-length');
            const reqLowercase = document.getElementById('req-lowercase');
            const reqUppercase = document.getElementById('req-uppercase');
            const reqNumber = document.getElementById('req-number');
            const reqMatch = document.getElementById('req-match');
            const savePwdBtn = document.getElementById('save-pwd-btn');
            const pwdErrorAlert = document.getElementById('pwd-error-alert');
            const pwdErrorMessage = document.getElementById('pwd-error-message');
            const pwdSuccessAlert = document.getElementById('pwd-success-alert');

            // Initialize Flatpickr datepicker
            const fp = flatpickr(dateInput, {
                locale: "de",
                altInput: true,
                altFormat: "d.m.Y",
                dateFormat: "Y-m-d",
                disableMobile: true
            });

            let currentDeleteId = null;

            // Global Upload Modal Elements
            const uploadFileModal = document.getElementById('upload-file-modal');
            const closeUploadModalBtn = document.getElementById('close-upload-modal-btn');
            const cancelUploadModalBtn = document.getElementById('cancel-upload-modal-btn');
            const globalFileUploadForm = document.getElementById('global-file-upload-form');
            const globalUploadFileField = document.getElementById('global-upload-file-field');
            const saveUploadModalBtn = document.getElementById('save-upload-modal-btn');

            class CustomMultiSelect {
                constructor(elementId, placeholderText = 'Benutzer auswählen...') {
                    this.container = document.getElementById(elementId);
                    this.trigger = this.container.querySelector('.multiselect-trigger');
                    this.placeholder = this.trigger.querySelector('.multiselect-placeholder');
                    this.dropdown = this.container.querySelector('.multiselect-dropdown');
                    this.searchInput = this.container.querySelector('.multiselect-search');
                    this.optionsContainer = this.container.querySelector('.multiselect-options');
                    this.placeholderText = placeholderText;
                    this.users = []; // {id, username}
                    this.selectedIds = new Set();
                    
                    this.initEvents();
                }
                
                setUsers(users) {
                    this.users = users;
                    this.renderOptions();
                }
                
                initEvents() {
                    this.trigger.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.toggleDropdown();
                    });
                    
                    this.searchInput.addEventListener('click', (e) => {
                        e.stopPropagation();
                    });
                    
                    this.searchInput.addEventListener('input', () => {
                        this.filterOptions();
                    });
                    
                    document.addEventListener('click', () => {
                        this.closeDropdown();
                    });
                }
                
                toggleDropdown() {
                    document.querySelectorAll('.custom-multiselect').forEach(el => {
                        if (el !== this.container) {
                            el.classList.remove('active');
                        }
                    });
                    this.container.classList.toggle('active');
                    if (this.container.classList.contains('active')) {
                        this.searchInput.focus();
                        this.searchInput.value = '';
                        this.filterOptions();
                    }
                }
                
                closeDropdown() {
                    this.container.classList.remove('active');
                }
                
                renderOptions() {
                    this.optionsContainer.innerHTML = '';
                    this.users.forEach(user => {
                        const option = document.createElement('div');
                        option.className = 'multiselect-option';
                        option.dataset.id = user.id;
                        if (this.selectedIds.has(user.id)) {
                            option.classList.add('selected');
                        }
                        
                        option.innerHTML = `
                            <div class="multiselect-option-checkbox"></div>
                            <div class="multiselect-option-text">${escapeHtml(user.username)}</div>
                        `;
                        
                        option.addEventListener('click', (e) => {
                            e.stopPropagation();
                            this.toggleOption(user.id, option);
                        });
                        
                        this.optionsContainer.appendChild(option);
                    });
                    
                    this.updateTrigger();
                }
                
                toggleOption(id, optionElement) {
                    if (this.selectedIds.has(id)) {
                        this.selectedIds.delete(id);
                        optionElement.classList.remove('selected');
                    } else {
                        this.selectedIds.add(id);
                        optionElement.classList.add('selected');
                    }
                    this.updateTrigger();
                    this.triggerEvent();
                }
                
                getSelected() {
                    return Array.from(this.selectedIds);
                }
                
                setSelected(ids) {
                    this.selectedIds = new Set(ids.map(Number));
                    this.updateOptionsUI();
                    this.updateTrigger();
                }
                
                clear() {
                    this.selectedIds.clear();
                    this.updateOptionsUI();
                    this.updateTrigger();
                }
                
                updateOptionsUI() {
                    const options = this.optionsContainer.querySelectorAll('.multiselect-option');
                    options.forEach(opt => {
                        const id = Number(opt.dataset.id);
                        if (this.selectedIds.has(id)) {
                            opt.classList.add('selected');
                        } else {
                            opt.classList.remove('selected');
                        }
                    });
                }
                
                updateTrigger() {
                    const existingTags = this.trigger.querySelector('.multiselect-tags');
                    if (existingTags) {
                        existingTags.remove();
                    }
                    
                    if (this.selectedIds.size === 0) {
                        this.placeholder.style.display = 'block';
                        this.placeholder.textContent = this.placeholderText;
                    } else {
                        this.placeholder.style.display = 'none';
                        const tagsContainer = document.createElement('div');
                        tagsContainer.className = 'multiselect-tags';
                        
                        this.users.forEach(user => {
                            if (this.selectedIds.has(user.id)) {
                                const tag = document.createElement('span');
                                tag.className = 'multiselect-tag';
                                tag.textContent = user.username;
                                
                                const removeBtn = document.createElement('span');
                                removeBtn.className = 'multiselect-tag-remove';
                                removeBtn.innerHTML = '&times;';
                                removeBtn.addEventListener('click', (e) => {
                                    e.stopPropagation();
                                    this.selectedIds.delete(user.id);
                                    this.updateOptionsUI();
                                    this.updateTrigger();
                                    this.triggerEvent();
                                });
                                
                                tag.appendChild(removeBtn);
                                tagsContainer.appendChild(tag);
                            }
                        });
                        
                        this.trigger.insertBefore(tagsContainer, this.trigger.querySelector('.multiselect-arrow'));
                    }
                }
                
                filterOptions() {
                    const query = this.searchInput.value.toLowerCase().trim();
                    const options = this.optionsContainer.querySelectorAll('.multiselect-option');
                    options.forEach(opt => {
                        const username = opt.querySelector('.multiselect-option-text').textContent.toLowerCase();
                        if (username.includes(query)) {
                            opt.style.display = 'flex';
                        } else {
                            opt.style.display = 'none';
                        }
                    });
                }
                
                triggerEvent() {
                    const event = new CustomEvent('change', { detail: this.getSelected() });
                    this.container.dispatchEvent(event);
                }
            }

            let userList = [];
            let appointmentSharingSelect = null;
            let fileSharingSelect = null;

            function fetchUsers() {
                fetch('appointments_api.php?action=users')
                    .then(res => res.json())
                    .then(data => {
                        if (data && data.success) {
                            userList = data.users;
                            appointmentSharingSelect = new CustomMultiSelect('appointment-sharing-select', 'Niemandem freigegeben');
                            appointmentSharingSelect.setUsers(userList);
                            
                            fileSharingSelect = new CustomMultiSelect('file-sharing-select', 'Bitte wähle mindestens einen Benutzer...');
                            fileSharingSelect.setUsers(userList);
                        }
                    })
                    .catch(err => console.error('Error fetching users:', err));
            }
            
            fetchUsers();

            // --- Toggle Sidebar ---
            function openSidebar() {
                hamburgerBtn.classList.add('active');
                sidebarDrawer.classList.add('active');
                drawerBackdrop.classList.add('active');
            }

            function closeSidebar() {
                hamburgerBtn.classList.remove('active');
                sidebarDrawer.classList.remove('active');
                drawerBackdrop.classList.remove('active');
            }

            hamburgerBtn.addEventListener('click', () => {
                if (sidebarDrawer.classList.contains('active')) {
                    closeSidebar();
                } else {
                    openSidebar();
                }
            });

            drawerBackdrop.addEventListener('click', closeSidebar);

            // --- Change Password Modal Functions ---
            function openPwdModal() {
                closeSidebar();
                changePwdForm.reset();
                pwdErrorAlert.style.display = 'none';
                pwdSuccessAlert.style.display = 'none';
                changePwdForm.style.display = 'block';
                validatePassword();
                changePwdModal.classList.add('active');
            }

            function closePwdModal() {
                changePwdModal.classList.remove('active');
                changePwdForm.reset();
            }

            function validatePassword() {
                const pwd = newPwdInput.value;
                const confirmPwd = confirmPwdInput.value;

                const isLengthValid = pwd.length >= 9;
                const isLowercaseValid = /[a-z]/.test(pwd);
                const isUppercaseValid = /[A-Z]/.test(pwd);
                const isNumberValid = /\d/.test(pwd);
                const isMatchValid = pwd !== '' && pwd === confirmPwd;

                function updateReqUI(element, isValid) {
                    const dot = element.querySelector('.req-dot');
                    if (isValid) {
                        element.style.color = 'var(--success)';
                        if (dot) {
                            dot.style.backgroundColor = 'var(--success)';
                            dot.style.boxShadow = '0 0 6px var(--success)';
                        }
                    } else {
                        element.style.color = 'var(--text-secondary)';
                        if (dot) {
                            dot.style.backgroundColor = 'var(--text-secondary)';
                            dot.style.boxShadow = 'none';
                        }
                    }
                }

                updateReqUI(reqLength, isLengthValid);
                updateReqUI(reqLowercase, isLowercaseValid);
                updateReqUI(reqUppercase, isUppercaseValid);
                updateReqUI(reqNumber, isNumberValid);
                updateReqUI(reqMatch, isMatchValid);

                const allValid = isLengthValid && isLowercaseValid && isUppercaseValid && isNumberValid && isMatchValid;
                savePwdBtn.disabled = !allValid;
                savePwdBtn.style.opacity = allValid ? '1' : '0.5';
                savePwdBtn.style.cursor = allValid ? 'pointer' : 'not-allowed';
            }

            changePwdBtn.addEventListener('click', openPwdModal);
            closePwdModalBtn.addEventListener('click', closePwdModal);
            cancelPwdModalBtn.addEventListener('click', closePwdModal);
            newPwdInput.addEventListener('input', validatePassword);
            confirmPwdInput.addEventListener('input', validatePassword);

            // --- AJAX: Load & Render Appointments ---
            function loadAppointments() {
                fetch('appointments_api.php?action=list')
                    .then(response => {
                        if (response.status === 401) {
                            window.location.href = 'login.php';
                            return;
                        }
                        return response.json();
                    })
                    .then(data => {
                        if (!data || !data.success) {
                            alert(data?.error || 'Fehler beim Laden der Termine.');
                            return;
                        }
                        renderTable(data.upcoming, 'upcoming-tbody', 'Lade Termine...', 'Keine anstehenden Termine vorhanden.');
                        renderTable(data.past, 'past-tbody', 'Lade Termine...', 'Keine vergangenen Termine vorhanden.');
                    })
                    .catch(err => {
                        console.error('Error loading appointments:', err);
                    });
            }

            function renderTable(appointments, tbodyId, loadingText, emptyText) {
                const tbody = document.getElementById(tbodyId);
                tbody.innerHTML = '';

                if (appointments.length === 0) {
                    tbody.innerHTML = `<tr>
                        <td colspan="4" style="text-align: center; color: var(--text-secondary); padding: 30px;">
                            ${emptyText}
                        </td>
                    </tr>`;
                    return;
                }

                appointments.forEach(apt => {
                    const tr = document.createElement('tr');
                    tr.dataset.id = apt.id;
                    
                    const dateHtml = formatAppointmentDate(apt.appointment_date);
                    const iconPrefix = apt.icon ? apt.icon + ' ' : '';
                    const titleEscaped = iconPrefix + escapeHtml(apt.title);
                    const locationEscaped = escapeHtml(apt.location || '-');
                    const notesEscaped = escapeHtml(apt.notes || '-');

                    const fileCount = parseInt(apt.file_count || 0, 10);
                    const fileIndicatorHtml = fileCount > 0 ? ` <span class="file-indicator" title="${fileCount} Datei${fileCount > 1 ? 'en' : ''} angehängt">📎</span>` : '';

                    tr.innerHTML = `
                        <td class="cell-date" data-label="Datum">${dateHtml}${fileIndicatorHtml}</td>
                        <td class="cell-title" data-label="Name">${titleEscaped}</td>
                        <td data-label="Ort">${locationEscaped}</td>
                        <td data-label="Notizen" style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${notesEscaped}</td>
                    `;

                    tr.addEventListener('click', () => openEditModal(apt.id));
                    tbody.appendChild(tr);
                });
            }

            // Helpers for formatting
            function formatAppointmentDate(dateString) {
                const d = new Date(dateString.replace(' ', 'T'));
                if (isNaN(d.getTime())) return escapeHtml(dateString);
                
                const weekday = d.toLocaleDateString('de-DE', { weekday: 'short' });
                const dateStr = d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
                
                return `<span class="weekday-tag">${weekday}</span>${dateStr}`;
            }

            function formatDateOnly(dateString) {
                if (!dateString) return '';
                const d = new Date(dateString.replace(' ', 'T'));
                if (isNaN(d.getTime())) return dateString;
                return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
            }

            function formatDateSimple(dateString) {
                if (!dateString) return '';
                const d = new Date(dateString.replace(' ', 'T'));
                if (isNaN(d.getTime())) return dateString;
                const dateStr = d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
                const timeStr = d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
                return `${dateStr} um ${timeStr} Uhr`;
            }

            function escapeHtml(str) {
                if (!str) return '';
                return str
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")
                    .replace(/"/g, "&quot;")
                    .replace(/'/g, "&#039;");
            }

            // --- Form Helpers ---
            function openCreateModal() {
                appointmentForm.reset();
                appointmentIdInput.value = '';
                modalTitle.textContent = 'Termin erstellen';
                deleteBtn.style.display = 'none';
                historySection.style.display = 'none';
                historyContent.innerHTML = '';
                
                // Clear sharing selection
                if (appointmentSharingSelect) {
                    appointmentSharingSelect.clear();
                }

                // Reset emoji picker to none
                appointmentIconInput.value = '';
                emojiBtns.forEach(btn => {
                    if (btn.dataset.emoji === '') {
                        btn.classList.add('active');
                    } else {
                        btn.classList.remove('active');
                    }
                });
                
                // Files Section
                btnUploadAppointmentFile.disabled = true;
                btnUploadAppointmentFile.style.opacity = '0.5';
                btnUploadAppointmentFile.style.cursor = 'not-allowed';
                filesHint.style.display = 'block';
                appointmentFilesList.innerHTML = '';
                
                // Pre-fill date to today (Berlin local)
                const now = new Date();
                const yyyy = now.getFullYear();
                const mm = String(now.getMonth() + 1).padStart(2, '0');
                const dd = String(now.getDate()).padStart(2, '0');
                fp.setDate(`${yyyy}-${mm}-${dd}`);

                appointmentModal.classList.add('active');
            }

            function openEditModal(id) {
                fetch(`appointments_api.php?action=get&id=${id}`)
                    .then(response => response.json())
                    .then(data => {
                        if (!data || !data.success) {
                            alert(data?.error || 'Fehler beim Laden des Termins.');
                            return;
                        }

                        const apt = data.appointment;
                        appointmentIdInput.value = apt.id;
                        titleInput.value = apt.title;
                        locationInput.value = apt.location || '';
                        notesInput.value = apt.notes || '';

                        // Set sharing permissions
                        if (appointmentSharingSelect) {
                            appointmentSharingSelect.setSelected(data.allowed_users || []);
                        }

                        // Set emoji picker value and active button styling
                        const currentIcon = apt.icon || '';
                        appointmentIconInput.value = currentIcon;
                        emojiBtns.forEach(btn => {
                            if (btn.dataset.emoji === currentIcon) {
                                btn.classList.add('active');
                            } else {
                                btn.classList.remove('active');
                            }
                        });

                        // Files section
                        btnUploadAppointmentFile.disabled = false;
                        btnUploadAppointmentFile.style.opacity = '1';
                        btnUploadAppointmentFile.style.cursor = 'pointer';
                        filesHint.style.display = 'none';
                        renderAppointmentFiles(data.files || [], apt.id);

                        // Format timestamp to datetime-local
                        const d = new Date(apt.appointment_date.replace(' ', 'T'));
                        const yyyy = d.getFullYear();
                        const mm = String(d.getMonth() + 1).padStart(2, '0');
                        const dd = String(d.getDate()).padStart(2, '0');
                        fp.setDate(`${yyyy}-${mm}-${dd}`);

                        // Build history items array
                        const historyItems = [];
                        if (data.history && data.history.length > 0) {
                            data.history.forEach(log => {
                                historyItems.push(log);
                            });
                        }
                        
                        // Push virtual creation log at the bottom of the list
                        historyItems.push({
                            changed_at: apt.created_at,
                            changer_name: apt.creator_name,
                            is_creation: true
                        });

                        // History render
                        historyContent.innerHTML = '';
                        historySection.style.display = 'block';
                        historyDetails.removeAttribute('open'); // Collapsed by default
                        
                        historyItems.forEach(log => {
                            const item = document.createElement('div');
                            item.className = 'history-item';
                            
                            const timeStr = formatDateSimple(log.changed_at);
                            const userStr = escapeHtml(log.changer_name);
                            
                            let changesHtml = '';
                            if (log.is_creation) {
                                changesHtml = `<div class="history-change-line" style="color: var(--accent-blue); font-weight: 500;">Termin erstellt</div>`;
                            } else {
                                changesHtml = formatChanges(log.changes);
                            }

                            item.innerHTML = `
                                <div class="history-meta">
                                    <span>${timeStr}</span>
                                    <span>von <strong>${userStr}</strong></span>
                                </div>
                                <div class="history-changes">
                                    ${changesHtml}
                                </div>
                            `;
                            historyContent.appendChild(item);
                        });

                        modalTitle.textContent = 'Termin bearbeiten';
                        deleteBtn.style.display = 'block';
                        appointmentModal.classList.add('active');
                    })
                    .catch(err => {
                        console.error('Error fetching appointment details:', err);
                        alert('Systemfehler beim Abrufen der Details.');
                    });
            }

            function formatChanges(changes) {
                const labels = {
                    title: 'Name',
                    location: 'Ort',
                    appointment_date: 'Datum',
                    notes: 'Notizen',
                    icon: 'Symbol'
                };
                let html = '';
                for (const field in changes) {
                    const fieldLabel = labels[field] || field;
                    let oldVal = changes[field]['old'] || 'Keine';
                    let newVal = changes[field]['new'] || 'Keine';
                    
                    if (field === 'appointment_date') {
                        oldVal = formatDateOnly(oldVal);
                        newVal = formatDateOnly(newVal);
                    }
                    
                    html += `<div class="history-change-line">
                        <strong>${fieldLabel}:</strong> 
                        <span style="text-decoration: line-through; opacity: 0.6;">${escapeHtml(oldVal)}</span> 
                        <span class="change-arrow">➔</span> 
                        <span style="color: var(--success); font-weight: 500;">${escapeHtml(newVal)}</span>
                    </div>`;
                }
                return html;
            }

            function closeModal() {
                appointmentModal.classList.remove('active');
                appointmentForm.reset();
            }

            // --- Delete Confirmation Overlay toggles ---
            function showConfirmOverlay(id) {
                currentDeleteId = id;
                confirmOverlay.classList.add('active');
            }

            function hideConfirmOverlay() {
                currentDeleteId = null;
                confirmOverlay.classList.remove('active');
            }

            // Event Listeners for UI
            addBtn.addEventListener('click', openCreateModal);
            closeModalBtn.addEventListener('click', closeModal);
            cancelModalBtn.addEventListener('click', closeModal);
            
            // Emoji Selection Handler
            emojiBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    emojiBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    appointmentIconInput.value = btn.dataset.emoji;
                });
            });
            
            deleteBtn.addEventListener('click', () => {
                const id = appointmentIdInput.value;
                if (id) {
                    showConfirmOverlay(id);
                }
            });

            confirmCancelBtn.addEventListener('click', hideConfirmOverlay);

            // Close modal on escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    closeModal();
                    hideConfirmOverlay();
                    closeSidebar();
                    closePwdModal();
                    if (typeof closeUploadModal === 'function') {
                        closeUploadModal();
                    }
                }
            });

            // --- Submit Form (Create / Update) ---
            appointmentForm.addEventListener('submit', (e) => {
                e.preventDefault();
                
                const id = appointmentIdInput.value;
                const isEdit = id !== '';
                const payload = {
                    action: isEdit ? 'update' : 'create',
                    id: isEdit ? intval(id) : null,
                    title: titleInput.value,
                    appointment_date: dateInput.value,
                    location: locationInput.value,
                    notes: notesInput.value,
                    icon: appointmentIconInput.value,
                    allowed_users: appointmentSharingSelect ? appointmentSharingSelect.getSelected() : []
                };

                function intval(val) {
                    const parsed = parseInt(val, 10);
                    return isNaN(parsed) ? 0 : parsed;
                }

                fetch('appointments_api.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })
                .then(response => response.json())
                .then(data => {
                    if (data && data.success) {
                        closeModal();
                        loadAppointments();
                    } else {
                        alert(data?.error || 'Fehler beim Speichern des Termins.');
                    }
                })
                .catch(err => {
                    console.error('Error saving appointment:', err);
                    alert('Systemfehler beim Speichern.');
                });
            });

            // --- Confirm Delete Action ---
            confirmDeleteBtn.addEventListener('click', () => {
                if (!currentDeleteId) return;

                fetch('appointments_api.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'delete',
                        id: parseInt(currentDeleteId, 10)
                    })
                })
                .then(response => response.json())
                .then(data => {
                    if (data && data.success) {
                        hideConfirmOverlay();
                        closeModal();
                        loadAppointments();
                    } else {
                        alert(data?.error || 'Fehler beim Löschen des Termins.');
                    }
                })
                .catch(err => {
                    console.error('Error deleting appointment:', err);
                    alert('Systemfehler beim Löschen.');
                });
            });

            // --- Submit Password Change ---
            changePwdForm.addEventListener('submit', (e) => {
                e.preventDefault();
                
                const payload = {
                    current_password: currentPwdInput.value,
                    new_password: newPwdInput.value,
                    confirm_password: confirmPwdInput.value
                };

                fetch('change_password_api.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })
                .then(response => {
                    return response.json().then(data => ({
                        ok: response.ok,
                        data: data
                    }));
                })
                .then(({ ok, data }) => {
                    if (ok && data && data.success) {
                        pwdErrorAlert.style.display = 'none';
                        pwdSuccessAlert.style.display = 'flex';
                        changePwdForm.style.display = 'none';
                        
                        // Redirect after 2 seconds
                        setTimeout(() => {
                            window.location.href = 'login.php?password_changed=1';
                        }, 2000);
                    } else {
                        pwdErrorMessage.textContent = data?.error || 'Fehler beim Ändern des Passworts.';
                        pwdErrorAlert.style.display = 'flex';
                    }
                })
                .catch(err => {
                    console.error('Error changing password:', err);
                    pwdErrorMessage.textContent = 'Systemfehler beim Speichern des Passworts.';
                    pwdErrorAlert.style.display = 'flex';
                });
            });

            // Initial load of table data
            loadAppointments();

            // --- FILE MANAGEMENT LOGIC ---

            // Navigation toggles
            navCalendar.addEventListener('click', (e) => {
                e.preventDefault();
                navCalendar.classList.add('active');
                navCalendar.style.background = 'var(--bg-hover)';
                navCalendar.style.color = 'var(--text-primary)';
                navFiles.classList.remove('active');
                navFiles.style.background = 'transparent';
                navFiles.style.color = 'var(--text-secondary)';
                
                filesView.style.display = 'none';
                calendarView.style.display = 'block';
                mainTitle.textContent = 'Kalender';
                closeSidebar();
                loadAppointments();
            });

            navFiles.addEventListener('click', (e) => {
                e.preventDefault();
                navFiles.classList.add('active');
                navFiles.style.background = 'var(--bg-hover)';
                navFiles.style.color = 'var(--text-primary)';
                navCalendar.classList.remove('active');
                navCalendar.style.background = 'transparent';
                navCalendar.style.color = 'var(--text-secondary)';
                
                calendarView.style.display = 'none';
                filesView.style.display = 'block';
                mainTitle.textContent = 'Dateien';
                closeSidebar();
                loadGlobalFiles();
            });

            function formatBytes(bytes, decimals = 2) {
                if (!+bytes) return '0 Bytes';
                const k = 1024;
                const dm = decimals < 0 ? 0 : decimals;
                const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
                const i = Math.floor(Math.log(bytes) / Math.log(k));
                return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
            }

            // Global Files Load
            function loadGlobalFiles() {
                fetch('files_api.php?action=list')
                    .then(res => res.json())
                    .then(data => {
                        if (data && data.success) {
                            renderGlobalFiles(data.files);
                        } else {
                            filesTbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:red;">Fehler beim Laden.</td></tr>`;
                        }
                    })
                    .catch(err => console.error(err));
            }

            function renderGlobalFiles(files) {
                filesTbody.innerHTML = '';
                if (files.length === 0) {
                    filesTbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-secondary); padding: 30px;">Keine Dateien vorhanden.</td></tr>`;
                    return;
                }
                
                files.forEach(f => {
                    const tr = document.createElement('tr');
                    const isViewable = f.mime_type === 'application/pdf' || f.mime_type.startsWith('image/') || f.mime_type.startsWith('video/');
                    const actionsHtml = `
                        <div style="display: flex; gap: 8px; justify-content: flex-end;">
                            ${isViewable ? `<a href="files_api.php?action=view&id=${f.id}" target="_blank" class="action-icon" title="Ansehen" style="color: var(--accent-blue); text-decoration: none;">👁️</a>` : ''}
                            <a href="files_api.php?action=download&id=${f.id}" class="action-icon" title="Herunterladen" style="color: var(--text-primary); text-decoration: none;">⬇️</a>
                            <button onclick="deleteFile(${f.id}, null)" class="action-icon" title="Löschen" style="color: var(--error); background: none; border: none; cursor: pointer;">🗑️</button>
                        </div>
                    `;
                    tr.innerHTML = `
                        <td data-label="Dateiname">${escapeHtml(f.original_filename)}</td>
                        <td data-label="Termin">${f.appointment_title ? escapeHtml(f.appointment_title) : '-'}</td>
                        <td data-label="Größe">${formatBytes(f.file_size)}</td>
                        <td data-label="Von">${escapeHtml(f.uploader_name)}</td>
                        <td data-label="Datum">${formatDateOnly(f.uploaded_at)}</td>
                        <td data-label="Aktionen">${actionsHtml}</td>
                    `;
                    filesTbody.appendChild(tr);
                });
            }

            function renderAppointmentFiles(files, appointmentId) {
                appointmentFilesList.innerHTML = '';
                if (files.length === 0) {
                    appointmentFilesList.innerHTML = `<span style="color: var(--text-secondary); font-size: 0.9rem;">Keine Dateien angehängt.</span>`;
                    return;
                }
                
                files.forEach(f => {
                    const div = document.createElement('div');
                    div.style.display = 'flex';
                    div.style.justifyContent = 'space-between';
                    div.style.alignItems = 'center';
                    div.style.padding = '8px 12px';
                    div.style.background = 'var(--bg-secondary)';
                    div.style.borderRadius = '6px';
                    div.style.border = '1px solid var(--border-color)';
                    
                    const isViewable = f.mime_type === 'application/pdf' || f.mime_type.startsWith('image/') || f.mime_type.startsWith('video/');
                    
                    div.innerHTML = `
                        <div style="display: flex; flex-direction: column; overflow: hidden;">
                            <span style="font-weight: 500; font-size: 0.95rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${escapeHtml(f.original_filename)}">${escapeHtml(f.original_filename)}</span>
                            <span style="font-size: 0.8rem; color: var(--text-secondary);">${formatBytes(f.file_size)} • ${escapeHtml(f.uploader_name)}</span>
                        </div>
                        <div style="display: flex; gap: 12px; align-items: center; padding-left: 12px; flex-shrink: 0;">
                            ${isViewable ? `<a href="files_api.php?action=view&id=${f.id}" target="_blank" title="Ansehen" style="text-decoration: none;">👁️</a>` : ''}
                            <a href="files_api.php?action=download&id=${f.id}" title="Herunterladen" style="text-decoration: none;">⬇️</a>
                            <button type="button" onclick="deleteFile(${f.id}, ${appointmentId})" title="Löschen" style="background: none; border: none; cursor: pointer;">🗑️</button>
                        </div>
                    `;
                    appointmentFilesList.appendChild(div);
                });
            }

            window.deleteFile = function(fileId, appointmentId) {
                if (!confirm('Möchtest du diese Datei wirklich löschen?')) return;
                
                fetch('files_api.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'delete', id: fileId })
                })
                .then(res => res.json())
                .then(data => {
                    if (data && data.success) {
                        if (appointmentId) {
                            openEditModal(appointmentId); // Refresh modal
                        } else {
                            loadGlobalFiles(); // Refresh list
                        }
                    } else {
                        alert(data?.error || 'Fehler beim Löschen.');
                    }
                })
                .catch(err => console.error(err));
            };

            function openUploadModal() {
                globalFileUploadForm.reset();
                if (fileSharingSelect) {
                    fileSharingSelect.clear();
                }
                uploadFileModal.classList.add('active');
            }

            function closeUploadModal() {
                uploadFileModal.classList.remove('active');
                globalFileUploadForm.reset();
            }

            uploadGlobalBtn.addEventListener('click', openUploadModal);
            closeUploadModalBtn.addEventListener('click', closeUploadModal);
            cancelUploadModalBtn.addEventListener('click', closeUploadModal);

            globalFileUploadForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const allowed = fileSharingSelect.getSelected();
                if (allowed.length === 0) {
                    alert('Bitte wähle mindestens einen Benutzer aus, mit dem diese Datei geteilt werden soll.');
                    return;
                }
                handleFileUpload(globalUploadFileField, null, allowed);
            });

            function handleFileUpload(fileInput, appointmentId = null, allowedUsers = []) {
                const file = fileInput.files[0];
                if (!file) return;
                
                // Limit 1 GB
                if (file.size > 1073741824) {
                    alert('Die Datei ist zu groß. (Max. 1 GB)');
                    fileInput.value = '';
                    return;
                }

                const formData = new FormData();
                formData.append('action', 'upload');
                formData.append('file', file);
                if (appointmentId) {
                    formData.append('appointment_id', appointmentId);
                } else {
                    formData.append('allowed_users', JSON.stringify(allowedUsers));
                }

                // Show uploading state
                let originalBtnText = '';
                let btnToRestore = null;
                
                if (appointmentId) {
                    originalBtnText = btnUploadAppointmentFile.textContent;
                    btnUploadAppointmentFile.textContent = 'Lädt...';
                    btnUploadAppointmentFile.disabled = true;
                    btnToRestore = btnUploadAppointmentFile;
                } else {
                    originalBtnText = saveUploadModalBtn.textContent;
                    saveUploadModalBtn.textContent = 'Lädt...';
                    saveUploadModalBtn.disabled = true;
                    btnToRestore = saveUploadModalBtn;
                }

                fetch('files_api.php', {
                    method: 'POST',
                    body: formData
                })
                .then(res => res.json())
                .then(data => {
                    fileInput.value = '';
                    if (btnToRestore) {
                        btnToRestore.textContent = originalBtnText;
                        btnToRestore.disabled = false;
                    }

                    if (data && data.success) {
                        if (appointmentId) {
                            openEditModal(appointmentId); // Refresh modal to show new file
                        } else {
                            closeUploadModal();
                            loadGlobalFiles(); // Refresh list
                        }
                    } else {
                        alert(data?.error || 'Fehler beim Upload.');
                    }
                })
                .catch(err => {
                    fileInput.value = '';
                    if (btnToRestore) {
                        btnToRestore.textContent = originalBtnText;
                        btnToRestore.disabled = false;
                    }
                    console.error('Upload Error:', err);
                    alert('Systemfehler beim Upload.');
                });
            }

            btnUploadAppointmentFile.addEventListener('click', () => {
                if (!btnUploadAppointmentFile.disabled) {
                    appointmentFileInput.click();
                }
            });
            appointmentFileInput.addEventListener('change', () => {
                const appId = appointmentIdInput.value;
                if (appId) handleFileUpload(appointmentFileInput, appId);
            });

        });
    </script>
</body>
</html>

