# Server-Dokumentation & Agenten-Leitfaden (AGENTS.md)

Diese Datei dient als zentraler Einstiegspunkt für alle zukünftigen KI-Agenten, die auf diesem Server arbeiten. Sie beschreibt die Serverarchitektur, den aktuellen Zustand und die Richtlinien für die Wartung.

> [!IMPORTANT]
> **Pflegepflicht für Agenten:** Jeder Agent, der Änderungen am Server oder an den Konfigurationen vornimmt, **muss** diese Datei (`AGENTS.md`) und die zugehörigen Dokumente/Skripte im Ordner `agent-workflow/` aktuell halten. Das Ziel ist eine effiziente und fehlerfreie Zusammenarbeit über verschiedene Agenten-Sitzungen hinweg.
>
> **Ablauf für Änderungen (Zwingend einzuhalten):**
> 
> 1. **Erstelle einen Implementierungsplan:** Dokumentiere jede geplante Änderung am Code, an der Datenbank oder an der Konfiguration im Detail in `implementation_plan.md`. Hole vor der Durchführung die explizite Freigabe des Benutzers ein.
> 2. **Führe die Änderungen durch:** Implementiere den freigegebenen Code und verifiziere die Anpassungen.
> 3. **Aktualisiere das Changelog:** Dokumentiere vor dem Commit alle Feature-Implementierungen auf Englisch in der [CHANGELOG.md](file:///home/tam137/git/skedulo/CHANGELOG.md). Neue Einträge gehören immer ganz oben hin und verwenden das Datum und die Uhrzeit im ISO-Stil (Format: `## [YYYY-MM-DD HH:mm]`) statt einer Versionsnummer als Identifikation.
> 4. **README.md prüfen & anpassen:** Prüfe direkt nach der Aktualisierung des Changelogs, ob das neue Feature Auswirkungen auf die Nutzer-Features hat, und passe die `README.md` im Hauptverzeichnis entsprechend an. 👉 **[Siehe Workflow: readme-manage](agent-workflow/readme-manage.md)**
> 5. **Committe und pushe die Änderungen:** Führe nach erfolgreichem Test einen Git-Commit durch und pushe diesen auf das Remote-Repository. Verfasse die Commit-Nachricht kurz, knapp und auf Englisch.
>    * *Achtung (Sicherheitsausschluss):* Checke **keine absoluten Pfade** (wie lokale Entwicklungsordner) oder **sensible Informationen** (API-Keys, Passwörter) ein. Verwende ausschließlich relative Pfade.
> 6. **Führe das Live-Deployment durch:** Übertrage die Änderungen zwingend auf den Live-Server. Befolge dazu die Anweisungen im Deployment-Workflow:
>    * 👉 **[Siehe Workflow: apache-php-deploy](agent-workflow/apache-php-deploy.md)**
>
> **Hinweis zu dieser Datei:** Speichere **keine** Aktualisierungshinweise (wie "Letzte Aktualisierung: ...") am Ende der Datei ab. Historien-Logs gehören ausschließlich in die Git-Commits.


> [!CAUTION]
> **Sicherheits- und Datenschutz-Richtlinie (Öffentlicher Server):**
> Da dieser Server und seine Webseiten komplett öffentlich über das Internet erreichbar sind, dürfen **keinerlei risikoreiche, private oder vertrauliche Informationen** (wie Passwörter, API-Keys, Datenbank-Logins oder private Anwendungsdaten) in den öffentlichen Webverzeichnissen abgelegt oder auf Testseiten angezeigt werden. Dies gilt insbesondere für Werkzeuge wie `phpinfo()`, welche detaillierte Serverkonfigurationen für jedermann einsehbar machen.

> [!NOTE]
> **Sprach- und Design-Stilrichtlinie:**
> Die Webschnittstellen auf diesem Server sind ausschließlich für den privaten Gebrauch bestimmt. Alle deutschsprachigen UI-Texte **müssen** einen persönlichen, informellen Stil pflegen und die Nutzer duzen (z. B. "Hallo, [Name]!", "Bitte gib deinen Namen ein", "Angemeldet bleiben").
> Der Source-Code selbst, die Kommentare sowie die Datenbankstrukturen und Schlüsselwörter müssen jedoch standardmäßig auf **Englisch** verfasst sein.

---

## 1. Server-Infrastruktur

> [!CAUTION]
> Alle Server-spezifischen Informationen (IP-Adressen, SSH-Zugang, Ports, Dienste, Administrationsbefehle) befinden sich aus Sicherheitsgründen **ausschließlich** im geschützten Workflow-Dokument und werden nicht in diesem Repository veröffentlicht.
> 👉 **[Siehe Workflow: Server-Infrastruktur](agent-workflow/server-infrastructure.md)**

---

## 2. Agenten-Workflows und gelernte Skills

Um wiederkehrende Aufgaben zu automatisieren und Fehler zu vermeiden, werden erlernte Abläufe im Ordner `agent-workflow/` abgelegt.

### Verfügbare Workflows/Skills:
* **[apache-php-deploy](agent-workflow/apache-php-deploy.md):** Skripte und Anleitung zur Verteilung von Webinhalten und zur Überprüfung des Webserver-Status.
* **[postgres-db-manage](agent-workflow/postgres-db-manage.md):** Anleitung zum Zugriff auf PostgreSQL-Instanzen, Anlegen von Datenbanken/Tabellen und Schema-Details.
* **[add-user](agent-workflow/add-user.md):** Anleitung zur CLI-Erstellung von Benutzerkonten für die Web-Authentifizierung.
* **[secure-pages](agent-workflow/secure-pages.md):** Richtlinie und Codeblock zur Absicherung neu erstellter PHP-Seiten.
* **[readme-manage](agent-workflow/readme-manage.md):** Richtlinie und Anleitung zur Strukturierung und kontinuierlichen Aktualisierung der README.md.
* **[server-infrastructure](agent-workflow/server-infrastructure.md):** Vertrauliche Server- und Verbindungsdaten (IP, SSH, Ports, Dienste).

---

## 3. Absicherung von Webseiten (Sicherheitsrichtlinie)

Aus Sicherheitsgründen müssen alle neu erstellten Seiten (PHP-Dateien) im Web-Root-Verzeichnis (siehe Workflow-Dokumentation) zwingend geschützt werden (ausgenommen `login.php` und `logout.php`).

Die detaillierten Implementierungsschritte, der standardisierte PHP-Codeblock sowie Hinweise zur Verifizierung sind im separaten Workflow-Dokument beschrieben:
👉 **[Siehe Workflow: Webseiten absichern (secure-pages.md)](agent-workflow/secure-pages.md)**

---

## 4. Code-Architektur: Trennung von Logik, Layout und Design (Separation of Concerns)

Für eine saubere Strukturierung und langfristige Wartbarkeit des Projekts gilt die strikte Richtlinie der Separation of Concerns (Trennung von Belangen). Neuer Code sowie Refaktorierungen müssen diese Trennung einhalten:

1. **JavaScript-Logik:** Gehört ausschließlich in separate `.js`-Dateien und darf nicht inline in PHP- oder HTML-Dateien eingebettet werden.
2. **Layout & Markup (HTML / PHP-Templates):** HTML und PHP-Strukturen verbleiben in den PHP-Dateien (z. B. `dashboard.php`). PHP sollte darin hauptsächlich für Templating-Logik, bedingte Renderings und die Einbindung der Backend-Sicherheitsprüfungen genutzt werden.
3. **Styling & Design (CSS):** Inline-CSS (mittels `style="..."` im HTML oder direkter DOM-Modifikation `.style` in JavaScript) ist verboten. Alle Styles müssen über semantische und wiederverwendbare Klassen in den modularisierten CSS-Dateien unter `src/css/` definiert werden. Dynamische Zustandsänderungen im UI müssen in JavaScript über `.classList.add()` / `.classList.remove()` anstatt direkter CSS-Zuweisung umgesetzt werden.

---

## 5. Etablierte Architekturprinzipien (Zwingend einzuhalten)

Um die Code-Qualität hochzuhalten, müssen künftige KI-Agenten folgende etablierte Prinzipien bei Modifikationen wahren:

### 1. Single Responsibility Principle (SRP)
Jedes Modul hat eine eindeutige, isolierte Aufgabe. Mische keine Zuständigkeiten:
- **`api.js`**: Hält alle asynchronen fetch-Requests an das Backend. Sie darf keine UI-Manipulationen durchführen.
- **`state.js`**: Verwaltet den Client-seitigen App-Zustand. Keine direkte DOM-Modifikation.
- **`utils.js`**: Reine Hilfsfunktionen (z. B. Formatierungen, Escaping) ohne Seiteneffekte.
- **`modules/`**: Domänenspezifische Logik (z. B. `appointments.js` für Termine, `files.js` für Uploads).

### 2. Modulares JavaScript (ES6-Module)
Der JavaScript-Code ist modular organisiert. Nutze ausschließlich native ES6 `import`/`export` Anweisungen. Globale Fenster-Variablen (`window.xyz`) sind verboten.

### 3. Event-Driven Architecture (Lose Kopplung)
Zur Kommunikation zwischen den JavaScript-Modulen werden benutzerdefinierte Events (`CustomEvent`) verwendet:
- Module feuern Events im globalen Kontext (z. B. `view-changed` bei Tab-Wechsel) ab.
- Andere Module registrieren Event-Listener, um darauf zu reagieren und ihre Daten zu aktualisieren. Dies minimiert direkte Import-Abhängigkeiten.

### 4. DRY (Don't Repeat Yourself) & Design Tokens
Nutze für Styling-Anpassungen die CSS-Variablen aus `variables.css` und vermeide das Duplizieren von CSS-Regeln. Etabliere bei Bedarf wiederverwendbare Hilfsklassen in den CSS-Dateien (z. B. `.font-medium`, `.cell-notes`).


