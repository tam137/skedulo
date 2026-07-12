# Changelog

## [2026-07-12 11:25]
- Added AJAX symbol filter to the calendar dashboard:
  - Designed responsive filter layout: horizontal emoji button bar on desktop, automatic select dropdown menu on mobile screens (< 768px).
  - Maintained local caches for both upcoming (`cachedAppointments`) and past (`cachedPastAppointments`) appointments to enable instantaneous filtering.
  - Implemented dynamic frontend filter logic synchronizing active selection between desktop and mobile controls.
  - Allowed toggle behavior where clicking an already active symbol on desktop resets the filter.

## [2026-07-11 18:43]
- Restricted editing of appointment sharing permissions and deletion of appointments to their creator:
  - Passed the logged-in user's ID from PHP to the HTML body tag using a data attribute.
  - Implemented `setDisabled(disabled)` state in `CustomMultiSelect` to dynamically toggle input availability, styling the trigger, and hiding tag removal button when disabled.
  - Disabled the "Teilen mit" select box and hid the "Löschen" button in the edit modal if the current user is not the appointment's creator.
  - Added backend security validation in `appointments_api.php` to reject unauthorized changes to sharing permissions and unauthorized deletions by non-creators.

## [2026-06-26 20:29]
- Added tab persistence to the dashboard:
  - Stored the active view state (Calendar, Files, or Admin Area) in the browser's `sessionStorage`.
  - Refactored the dashboard navigation to use a unified `switchView` helper function.
  - Automatically restored the user's previously active tab on page reload (F5) or initial page load, with safety checks to ensure non-admin users cannot access the Admin Area.

## [2026-06-26 18:43]
- Made file rows in the file management area clickable, allowing users to open the file edit dialog by clicking anywhere on the row.

## [2026-06-26 18:41]
- Added ability to change file associations and visibility:
  - Users can now edit an uploaded file to change its associated appointment or explicit user permissions via the new "Bearbeiten" (✏️) button.
  - Appointments listed in the "Termin zuordnen" dropdown now only show upcoming appointments and appointments from the past 30 days (configurable via `past_appointments_days_limit` in `config.php`).
  - When assigning a file to an appointment, any previously set explicit user permissions are wiped, making the file strictly bound to the appointment's visibility.

## [2026-06-26 18:34]
- Added brand-aligned favicons to the web application:
  - Created `src/favicon.svg` with a white padlock matching the main logo on a modern HSL diagonal gradient background.
  - Generated high-quality `src/favicon.png` and a multi-resolution `src/favicon.ico` (16x16, 32x32, 48x48, 256x256) via Pillow.
  - Linked the SVG and PNG favicons in `src/login.php` and `src/dashboard.php`.

## [2026-06-26 11:48]
- Prepared repository for Open Source release:
  - Added `config.php` to `.gitignore` to prevent accidental credential commits.
  - Added "Installation & Einrichtung" section to `README.md`.
  - Updated `agent-workflow/readme-manage.md` to mandate the Installation section.

## [2026-06-26 11:45]
- Removed "Konto aktiv" (account status) and "Letzter Login" (last login timestamp) information from the sidebar drawer (hamburger menu).

## [2026-06-26 11:37]
- Fixed critical security vulnerability (RCE) by strictly validating uploaded file extensions via a blacklist and blocking system files (e.g. `.htaccess`).
- Reintroduced random hashing to physical file names on the server to prevent predictable file paths.
- Preserved the true original filename in the database (including spaces) to improve UX during file downloads.
- Fixed a file migration bug where physical files and the database could get out of sync upon a failure. Created `src/secure_existing_files.php` and secured all existing uploads on the live server.

## [2026-06-26 11:24]
- Stored user-uploaded files in user-specific subdirectories under `/var/www/html/uploads/[username]/`.
- Prevented users from uploading duplicate files. Returns an error message if a file with the same name already exists in their subdirectory.
- Added visual error alert inside the global upload modal for file upload errors.
- Created and executed a database and filesystem migration script (`src/migrate_files.php`) to move existing uploaded files into their respective user subfolders and update the database accordingly.

## [2026-06-26 11:05]
- Styled user management action buttons (Passwort zurücksetzen, Deaktivieren/Aktivieren) to align with the application design theme by making the button CSS classes global and adding a `.btn-sm` helper class.

## [2026-06-26 11:00]
- Fixed issue where the Admin Area button was hidden for admin users due to missing 'role' column in user SELECT query.

## [2026-06-26 10:52]
- Added Admin Area for managing users.
  - Visible only to users with the 'admin' role.
  - View all users with their roles, statuses, and last login times.
  - Add new users directly from the UI with a default password 'Start123!'.
  - Deactivate/Reactivate users.
  - Reset a user's password to the default.

## [2026-06-26 10:30]
- Added Outlook Calendar (ICS) feed feature:
  - Users can subscribe to their calendar via a secure token.
  - Generates `.ics` format output for the past year and all future appointments.
  - Auto-generates tokens for existing and new users upon login.
  - Added "Outlook Feed Link kopieren" button to the sidebar.

## [2026-06-25 12:36]
- Added changelog guideline to AGENTS.md.
- Created and initialized CHANGELOG.md.

## [2026-06-25 12:32]
- Improved file upload dialog: added custom styling, optional appointment link, and dynamic file sharing.

## [2026-06-25 12:17]
- Documented Code Architecture guidelines (Separation of Concerns) in AGENTS.md.

## [2026-06-25 12:13]
- Refactored dashboard.php to separate HTML layout, JS logic, and CSS styling.

## [2026-06-25 12:04]
- Fixed dashboard issue: closed password modal div to fix the global file upload button.
