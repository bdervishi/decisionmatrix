# Entscheidungsmatrix — Browser-Extension (MV3)

Chrome/Edge-Extension (Manifest V3), die dieselbe Kern-Logik (`../src/core`) und
die volle Matrix-UI (`../src/main.js`) der Web-App wiederverwendet.

## Oberflächen

- **Side Panel** — die vollständige Entscheidungsmatrix (Klick auf „Im Seitenpanel öffnen“ im Popup)
- **Popup** — Schnellstart: Side Panel öffnen, letzte Entscheidungen, Einstellungen
- **Options** — Backend-URL (KI) und Share-Basis-URL
- **Kontextmenü** — markierten Text als Entscheidung ins Side Panel übernehmen

## Bauen

Vom Projekt-Root:

```bash
npm install
npm run build:ext     # baut nach extension/dist/
# npm run dev:ext      # Watch-Build während der Entwicklung
```

## Laden (Chrome / Edge)

1. `chrome://extensions` (bzw. `edge://extensions`) öffnen
2. **Entwicklermodus** aktivieren
3. **Entpackte Erweiterung laden** → Ordner **`extension/dist`** wählen
4. Symbol anklicken → **Im Seitenpanel öffnen**

Nach Code-Änderungen `npm run build:ext` erneut ausführen und die Erweiterung
in der Liste **neu laden**.

## KI-Vorschläge konfigurieren

Ohne Konfiguration läuft die Extension mit dem **lokalen Vorschlags-Modus** (ohne KI).
Für Claude-Vorschläge in den **Einstellungen** hinterlegen:

- **KI-Backend-URL** — Endpoint der gehosteten Vorschlagsfunktion, z. B.
  `https://<deployment>/api/generate` (der API-Key bleibt serverseitig).
  Die Funktion sendet CORS-Header, sodass der Aufruf aus der Extension ohne
  zusätzliche Host-Berechtigungen funktioniert.
- **Share-Basis-URL** — öffentliche Web-App für Teilen-Links, z. B.
  `https://<deployment>/`. Ohne Angabe zeigen Links auf die interne
  Extension-Seite und lassen sich nicht extern öffnen.
- **Eigener Anthropic API-Key (Alternative)** — nur nötig, wenn du **kein**
  Backend nutzt. Dann ruft die Extension Claude direkt auf (offizielles SDK im
  Browser-Modus). Der Key bleibt lokal, wird aber direkt an Anthropic gesendet —
  bequemer, aber weniger sicher als das Backend (dort verlässt der Key nie den
  Server). Ist eine Backend-URL gesetzt, wird sie bevorzugt und der Key ignoriert.

Reihenfolge der Vorschlagsquelle: **Backend-URL → eigener Key → lokale Heuristik.**

## Speicherung

Aktuell nutzt die Extension denselben `localStorage`-basierten Storage-Adapter wie
die Web-App. Side Panel, Popup und Options teilen sich dieselbe Extension-Origin
und damit denselben Speicher (Zustand + Verlauf gelten überall). Eine geräte-
übergreifende Synchronisation via `chrome.storage.sync` ist als spätere Erweiterung
vorgesehen (siehe `docs/browser-extension.md`).

## Cross-Browser

Firefox und Safari sind Folge-Phasen (siehe `docs/browser-extension.md`, Abschnitt 4/5).
