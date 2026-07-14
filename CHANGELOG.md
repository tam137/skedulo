# Changelog

## [2026-07-14 13:07]
- Refactored responsive table styling to eliminate all `!important` overrides:
  - Moved table-specific mobile media queries from `base.css` to the end of `tables.css` to leverage CSS cascade loading order.
  - Removed all `!important` declarations from responsive styles for table cells and column wrapper definitions.
  - Added specific `.appointments-table td.cell-notes { max-width: none; }` override on mobile viewports to prevent desktop max-width constraints.

## [2026-07-14 12:30]
- Resolved horizontal scrollbar issues and improved mobile layout responsiveness:
  - Modified `.cell-notes` in `tables.css` to wrap dynamically using `white-space: pre-wrap` and `word-break: break-word` instead of truncating with ellipsis.
  - Hidden the entire `thead` element on mobile viewports in `base.css` to prevent browser anonymous table layout overflow issues.
  - Enabled flex-wrap on `.actions-flex-container` and forced `.btn` inside it to take 100% width on mobile viewports (<=768px), making user admin actions stack vertically and fit within narrow viewports.
  - Added new E2E test suite `tests/e2e/responsive.spec.js` to assert table header hiding, notes wrapping, and admin button stacking on mobile viewports.

## [2026-07-13 08:55]
- Fixed mobile CSS override issues for dashboard container and modals:
  - Moved `.dashboard-container` and `.dashboard-card` mobile media query overrides from `base.css` to the end of `layout.css` to prevent them from being overridden by standard desktop styles in `layout.css`.
  - Moved `.modal-overlay` and `.modal-card` mobile media query overrides from `tables.css` to the end of `modals.css` to prevent them from being overridden by standard desktop styles in `modals.css`.

## [2026-07-13 06:33]
- Optimized layout spacing and label alignment on mobile screens:
  - Reduced outer `.dashboard-container` padding on mobile (max-width: 768px) from 12px to 8px.
  - Reduced dashboard card padding on mobile from 20px to 12px.
  - Reduced table row padding on mobile from 16px 20px to 12px 10px.
  - Stacked labels and values vertically (e.g. "Ort: Erfurt") on small screens (max-width: 480px) to prevent horizontal scrolling and increase readability.
  - Reduced login card padding on mobile (max-width: 480px) from 40px to 20px and login wrapper padding from 20px to 12px.
  - Reduced modal overlay padding on mobile from 20px to 8px and modal card padding on mobile from 20px to 16px.

## [2026-07-12 16:36]
- Added 24h format and 15-minute increments for start times and validation for multi-day duration:
  - Replaced Flatpickr time picker with a custom HTML dropdown picker (two separate columns for hours and minutes in 15-minute increments), allowing the user to either select from lists or type/edit the time directly in the text input. Added auto-formatting and normalization on blur.
  - Added real-time frontend and backend validation for multi-day appointments, requiring a duration of at least 2 days and displaying a custom warning hint in case of an invalid value.

## [2026-07-12 16:29]
- Extended appointment input with start times, duration in hours, and multi-day support:
  - Added "Termintyp" selector (Ganztägig, Mit Uhrzeit, Mehrtägig) to the appointment modal in `dashboard.php`.
  - Added new database columns `all_day`, `duration_hours`, and `duration_days` to `appointments` table and updated local test schema.
  - Implemented conditional inputs (Startzeit, Dauer in Stunden/Tagen) toggled by the Termintyp selector.
  - Integrated start_time, duration_hours, and duration_days fields in `appointments_api.php` for create, update, list, and get actions, including history logs comparisons.
  - Updated calendar ICS export in `calendar_feed.php` to format all-day, multi-day, and time-based events with proper timezone conversion and end dates.
  - Added date formatting helpers in `utils.js` to display time-based appointments ('Di 25.08.2026, 14:30 (2,5 Std.)') and multi-day appointments ('Di 25.08.2026 bis Do 27.08.2026 (3 Tage)') on the dashboard.

## [2026-07-12 13:14]
- Expanded E2E test suite with security and audit log coverages:
  - Added XSS escaping verification tests for appointment title/description rendering.
  - Added E2E tests for the appointment change history audit log collapsible inside the edit modal.
  - Added E2E tests for cross-user isolated file storage, verifying different users can upload files with the same name without overwriting.
  - Added E2E tests verifying user last login timestamps are recorded and displayed correctly in the admin panel user table.

## [2026-07-12 12:59]
- Expanded E2E test suite and resolved backend update actions:
  - Added new test suite `tests/e2e/calendar.spec.js` covering iCalendar (`calendar_feed.php`) feed format, token authentication, and empty token validations.
  - Added test cases verifying file-to-appointment association updates and unlinking.
  - Added test cases verifying file download security boundaries, confirming unauthorized download requests return HTTP 403.
  - Fixed action mapping inside `files_api.php` by correctly routing `action=save` to the backend `update` action.

## [2026-07-12 12:35]
- Implemented E2E test suite and resolved third-party CDN dependencies:
  - Vendored Flatpickr assets locally (`css/flatpickr.min.css`, `css/flatpickr-dark.css`, `js/vendor/flatpickr.js`, `js/vendor/flatpickr-de.js`) to remove dependency on external CDNs.
  - Setup Playwright testing suite covering auth, appointments, file manager, sharing permission boundaries, and admin operations.
  - Fixed database session cookie lockout during local HTTP testing inside `auth_helper.php`.
  - Fixed API parameter mismatches: mapped `action=save` to `create`/`update` in `appointments_api.php`, allowed delete actions to fallback to `$_GET['id']`, and enabled `admin_api.php` to support standard FormData POST payloads.
  - Fixed database column naming differences between files query output and frontend rendering expectations (`original_name`, `creator_name`, `created_by`).

## [2026-07-12 12:00]
- Aligned frontend with Separation of Concerns guidelines by removing all inline CSS:
  - Created modular classes (`.font-medium`, `.cell-notes`, `.current-account-label`, `.empty-list-text`, `.form-hint`) in CSS modules.
  - Replaced all inline `style="..."` attributes in `dashboard.php` with modular utility/subclasses.
  - Cleaned up dynamic inline style modifications in JavaScript files (`admin.js`, `appointments.js`, `files.js`, `CustomMultiSelect.js`).

## [2026-07-12 11:51]
- Refactored remaining monolithic JavaScript into decoupled ES6 modules (Phase 2):
  - Extracted shared application state into `src/js/state.js`.
  - Extracted all AJAX backend API requests into `src/js/api.js`.
  - Grouped and isolated view-specific logic into dedicated modules under `src/js/modules/` (`navigation.js`, `appointments.js`, `files.js`, `admin.js`).
  - Re-wired `main.js` as an orchestrator native entry point using decoupled event-driven patterns.

## [2026-07-12 11:39]
- Refactored frontend assets into modular ES6 Javascript and dedicated CSS files (Phase 1):
  - Split `styles.css` into specific modular files (`variables.css`, `base.css`, `layout.css`, `forms.css`, `login.css`, `modals.css`, `tables.css`, `files.css`, `calendar.css`, `multiselect.css`).
  - Added a dynamic PHP CSS loader in `dashboard.php` and `login.php` to prevent browser caching issues.
  - Extracted utility functions into `src/js/utils.js` and `CustomMultiSelect` class into `src/js/components/CustomMultiSelect.js`.
  - Converted the main frontend script to an ES6 module (`<script type="module" src="js/main.js">`).
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
