# Implementierungsplan: Cache-Busting für JavaScript via .htaccess

## Ziel
Sicherstellen, dass Browser die nativen ES6-Modul-Importe (`appointments.js`, etc.) nicht dauerhaft cachen, sondern stets die aktuelle Version vom Server laden. Das löst den Fehler des vorherigen Cache-Busting-Versuchs, der aufgrund nativer ES-Module fehlschlug.

## Geplante Änderungen

1. **`src/.htaccess` erweitern:**
   - Hinzufügen von Apache-Headern speziell für JavaScript-Dateien (`\.(js)$`).
   - Setzen der HTTP-Header `Cache-Control "no-cache, must-revalidate"`.
   - Dies zwingt den Browser dazu, vor der Verwendung des Caches kurz beim Server anzufragen (z. B. via ETags/Last-Modified), ob die Datei modifiziert wurde. Dadurch werden veraltete JS-Dateien aus dem Browser-Cache ignoriert, wenn sich der Code geändert hat.

2. **`src/dashboard.php` bereinigen:**
   - Entfernen des nun obsoleten PHP-basierten Cache-Busters (`?v=<?php echo filemtime(...); ?>`) in den Script-Tags für `flatpickr.js` und `main.js`.
   - Dies hält den HTML-Quellcode sauber, da die `.htaccess` das Caching nun serverseitig und vor allem auch für dynamische ES6-Imports löst.

3. **Dokumentation:**
   - Eintragen der Änderungen in die `CHANGELOG.md` unter dem aktuellen Datum.

## Tests & Verifizierung
Da der Live-Server nicht von mir berührt wird, verifizieren wir den Syntax und die korrekte Struktur im lokalen Repository. Die Tests (`run-tests.sh`) werden ausgeführt, um sicherzustellen, dass die App weiterhin lokal fehlerfrei funktioniert.
