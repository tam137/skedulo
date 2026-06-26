# Changelog

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
