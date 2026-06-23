# Server-Dokumentation & Agenten-Leitfaden (AGENTS.md)

Diese Datei dient als zentraler Einstiegspunkt für zukünftige KI-Agenten, die auf diesem Server arbeiten. Sie beschreibt die Serverarchitektur, den aktuellen Zustand und die Richtlinien für die Wartung.

> [!IMPORTANT]
> **Pflegepflicht für Agenten:** Jeder Agent, der Änderungen am Server oder an den Konfigurationen vornimmt, **muss** diese Datei (`AGENTS.md`) und die zugehörigen Dokumente/Skripte im Ordner `agent-workflow/` aktuell halten. Das Ziel ist eine effiziente und fehlerfreie Zusammenarbeit über verschiedene Agenten-Sitzungen hinweg.
>
> **Verpflichtender Implementierungsplan (Planning Mode):** Jede Änderung am Code, an der Datenbank oder an der Konfiguration – unabhängig davon, wie klein sie ist – **muss zwingend** vor der Durchführung in einem detaillierten Implementierungsplan (`implementation_plan.md`) dokumentiert und vom Benutzer explizit freigegeben werden.
>
> **Automatisches Committen und Pushen:** Jede vorgenommene Änderung (Code, Konfiguration, Dokumentation) **muss selbstständig** per Git committet und auf das Remote-Repository gepusht werden. Die Commit-Nachricht (Commit Message) soll kurz und knapp und auf **Englisch** verfasst sein.
> * **Sicherheitsausschluss:** Es dürfen **keine absoluten Pfade** (wie lokale Entwicklungsordner `/home/<user>/...`) oder **sensible Informationen** (wie API-Keys, Passwörter) in Git eingecheckt werden. Links in der Dokumentation müssen stets relativ sein. Sensible Dateien müssen in die `.gitignore` aufgenommen werden. Bei Unsicherheit vor dem Commit den Benutzer fragen!


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
* **[server-infrastructure](agent-workflow/server-infrastructure.md):** Vertrauliche Server- und Verbindungsdaten (IP, SSH, Ports, Dienste).

---

## 3. Absicherung von Webseiten (Sicherheitsrichtlinie)

Aus Sicherheitsgründen müssen alle neu erstellten Seiten (PHP-Dateien) im Web-Root-Verzeichnis (siehe Workflow-Dokumentation) zwingend geschützt werden (ausgenommen `login.php` und `logout.php`).

Die detaillierten Implementierungsschritte, der standardisierte PHP-Codeblock sowie Hinweise zur Verifizierung sind im separaten Workflow-Dokument beschrieben:
👉 **[Siehe Workflow: Webseiten absichern (secure-pages.md)](agent-workflow/secure-pages.md)**

---

*Letzte Aktualisierung: 2026-06-23 von Antigravity-Agent (Sensible Server-Daten in agent-workflow/ ausgelagert, Open-Source-Bereitschaft vorbereitet).*

