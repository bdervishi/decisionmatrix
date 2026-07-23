# Datenschutzerklärung — Entscheidungsmatrix

_Stand: bitte Datum eintragen · Kontakt: `<Kontakt-E-Mail eintragen>`_

Die Entscheidungsmatrix ist so gebaut, dass deine Daten standardmäßig **lokal**
bleiben. Diese Erklärung beschreibt, welche Daten wann verarbeitet werden.

## Was lokal bleibt

- **Deine Entscheidungen** (Titel, Optionen, Kriterien, Gewichte, Punkte) und der
  **Verlauf** werden ausschließlich **lokal in deinem Browser** gespeichert
  (localStorage bzw. Extension-Storage). Sie werden **nicht** an uns oder Dritte
  übertragen.
- **Einstellungen** (Backend-URL, Share-Basis-URL, ggf. dein API-Key) werden ebenfalls
  nur lokal gespeichert.

## Spracheingabe (optional)

Der Mikrofon-Button nutzt die **Web-Speech-Schnittstelle deines Browsers**. Die
Audio-Verarbeitung erfolgt durch den Browser bzw. das Betriebssystem (in einigen
Browsern über einen Cloud-Dienst des Browser-Herstellers). Die App **speichert keine
Audiodaten** und leitet sie nicht an eigene Server weiter. In Browsern ohne
Spracherkennung (z. B. Firefox) ist die Funktion deaktiviert.

## KI-Vorschläge (optional, standardmäßig aus)

Nur wenn du es konfigurierst, wird der **von dir eingegebene/gesprochene Satz** zur
Erzeugung von Vorschlägen übermittelt:

- **Eigenes Backend:** Der Satz geht an die von dir angegebene Backend-URL (deine eigene
  Bereitstellung), die den Anbieter (Anthropic) aufruft. Der API-Key bleibt dort
  serverseitig.
- **Eigener API-Key (nur Extension):** Der Satz und dein API-Key werden **direkt an
  Anthropic** gesendet.

Übertragen wird nur der Satz (und daraus abgeleitete Optionstexte) — **nicht** dein
Verlauf. Ohne Konfiguration werden **keine** Daten gesendet; dann arbeitet der lokale
Vorschlags-Modus vollständig offline. Für die Verarbeitung durch Anthropic gilt deren
Datenschutzerklärung (anthropic.com).

## Teilen per Link

Teilen-Links kodieren die Entscheidung im **URL-Fragment** (`#d=…`). Das Fragment wird
technisch **nicht an einen Server gesendet**; das Teilen erfolgt dadurch, dass **du** den
Link kopierst und weitergibst.

## Keine Tracker

Die App/Extension enthält **keine Analyse-, Tracking- oder Werbe-Dienste** und sammelt
keine Nutzungsstatistiken.

## Berechtigungen (Extension)

- **storage** — Entscheidungen, Verlauf und Einstellungen lokal speichern
- **sidePanel** (Chrome/Edge) / Sidebar (Firefox) — das Werkzeug anzeigen
- **contextMenus** — markierten Text als Entscheidung öffnen

## Änderungen

Wesentliche Änderungen dieser Erklärung werden im Repository und in der
Store-Beschreibung veröffentlicht.
