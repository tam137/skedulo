# Implementierungsplan: Korrektur Spalte "Geteilt mit"

## Ziel
Korrektur der Anzeige in der Spalte "Geteilt mit" in den Termin-Tabellen:
- Wenn der angemeldete Benutzer **Ersteller** des Termins ist, soll in der Spalte "Geteilt mit" die Liste der Benutzer angezeigt werden, mit denen der Termin geteilt wurde (`shared_with`).
- Wenn der angemeldete Benutzer **nicht** der Ersteller des Termins ist (sondern der Termin mit ihm geteilt wurde), soll in der Spalte der Name des Erstellers (`creator_name`) angezeigt werden.

## Geplante Änderungen

1. **`src/js/modules/appointments.js` anpassen:**
   - In `renderTable()` die Variable `sharedWith` abhängig davon bestimmen, ob `parseInt(apt.created_by, 10) === state.currentUserId` ist.
   - Wenn ja: `apt.shared_with || '-'`
   - Wenn nein: `apt.creator_name || '-'`

2. **`tests/e2e/sharing.spec.js` anpassen:**
   - Auf Zeile 55 den E2E-Test so anpassen, dass für den eingeloggten Empfänger `user_b` der Erstellername `user_a` in der Spalte "Geteilt mit" erwartet wird.

3. **Dokumentation:**
   - Changelog-Eintrag in `CHANGELOG.md` hinzufügen.
