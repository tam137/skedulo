# Skedulo – Terminkalender & Dateiverwaltung

Willkommen bei **Skedulo**! Diese Webanwendung bietet dir eine einfache und übersichtliche Plattform, um deine Termine zu koordinieren, sie mit anderen Nutzern zu teilen und relevante Dateien direkt mit deinen Terminen oder global zu verwalten.

---

## 🚀 Installation & Einrichtung

1. Klone das Repository.
2. Kopiere die Datei `config.example.php` und benenne sie in `config.php` um.
3. Trage deine Datenbank-Zugangsdaten in der neuen `config.php` ein.
4. Stelle sicher, dass die `config.php` für dein Backend (z. B. im übergeordneten Verzeichnis deines Web-Roots wie `/var/www/config.php`) sicher abgelegt ist.
5. Die App steht unter der **Apache 2.0 Lizenz**.

---

## Kernfunktionen für Nutzer

### 📅 Terminkalender
* **Termine erstellen, bearbeiten & löschen:** Plane deine Tage ganz einfach. Du kannst einen Titel, das Datum, den Ort und ausführliche Notizen angeben.
* **Persönliche Icons (Emojis):** Verleihe deinen Terminen eine persönliche Note, indem du ein passendes Emoji (z. B. 🌴 für Urlaub oder 💻 für Arbeit) auswählst.
* **Vergangene Termine:** Behalte den Überblick über vergangene Ereignisse in einem einklappbaren Archiv.
* **Kalender abonnieren (Outlook/ICS):** Du kannst deine Termine über einen sicheren Link ganz einfach in Outlook, Apple Kalender oder Google Kalender abonnieren (Nur-Lese-Zugriff).

### 🤝 Teilen & Freigabe von Terminen
* **Zusammenarbeit:** Teile deine Termine mit anderen registrierten Nutzern. Du kannst entscheiden, wer Lese- oder Schreibrechte für deine Termine erhält.

### 📁 Dateiverwaltung & Anhänge
* **Terminspezifische Dateien:** Lade Dokumente, Bilder oder andere Dateien direkt in einen Termin hoch, damit du am Tag des Termins alles Wichtige sofort griffbereit hast.
* **Globaler Datei-Upload:** Nutze den Dateimanager, um Dateien unabhängig von Terminen hochzuladen.
* **Dateifreigabe:** Gib deine hochgeladenen Dateien für bestimmte Nutzer frei, damit auch sie darauf zugreifen können.
* **Eigener Dateiordner & Duplikatschutz:** Deine Dateien werden sicher in deinem persönlichen Benutzerverzeichnis gespeichert. Skedulo warnt dich und verhindert den Upload, wenn eine Datei mit demselben Namen bereits von dir hochgeladen wurde.

### 🔒 Kontosicherheit & Profil
* **Passwort ändern:** Aktualisiere dein Passwort jederzeit über dein Profil. Eine integrierte Anforderungsliste hilft dir dabei, ein sicheres Passwort zu wählen.
* **Remember-Me Option:** Bleibe auf deinem Gerät sicher angemeldet, ohne dich jedes Mal neu einloggen zu müssen.

### 🛡️ Administration (Nur für Admins)
* **Benutzerverwaltung:** Admins haben Zugriff auf ein dediziertes Administrations-Panel.
* **Nutzerkontrolle:** Erstelle neue Benutzer, deaktiviere bestehende oder setze Passwörter bei Bedarf auf den Standardwert zurück.
* **Aktivitäts-Status:** Behalte den letzten Login aller Nutzer im Blick.
