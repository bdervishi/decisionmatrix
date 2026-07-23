# Entscheidungsmatrix

Eine gewichtete Entscheidungsmatrix als eigenständige Web-App. Vergleiche mehrere
Optionen anhand gewichteter Kriterien und finde die beste Wahl — mit Live-Berechnung,
Rangliste und Animationen.

## Features

- **Sprich oder tippe deine Entscheidung** — ein Satz genügt, die App erzeugt
  automatisch Titel, Optionen und gewichtete Kriterien
  - **Spracheingabe** direkt im Browser (Web Speech API, `de-DE`), kein Key nötig
  - **KI-Vorschläge** via Claude (serverlose Funktion) für jedes Thema
  - **Lokaler Fallback** ohne KI, falls kein API-Key gesetzt ist
- **Optionen × Kriterien** frei bearbeitbar (hinzufügen, umbenennen, entfernen)
- **Gewichte pro Kriterium** (0–10) mit automatischer Prozent-Anzeige
- **Punkte pro Option** (0–10) je Kriterium
- **Gewichteter Gesamtscore**, normiert auf 100, live berechnet
- **Rangliste** mit animierten Balken und hochzählenden Werten (GSAP)
- **Empfehlung** — die beste Option wird hervorgehoben
- **Verlauf** — Entscheidungen speichern, später wieder öffnen oder löschen
  - **nach Kategorien gruppiert** (Technik, Reise, Kleidung … ), Kategorie pro Eintrag änderbar
  - **Suche & Kategorie-Filter** im Verlauf
- **Export** — aktuelle Entscheidung als **CSV** oder **PDF** (Druckdialog), Verlauf als CSV
- **Teilen per Link** — der Zustand steckt im URL-Hash (`#d=…`), rein clientseitig, kein Server
- **Light/Dark-Theme** mit Umschalter, folgt sonst dem System
- **Persistenz** — Stand und Verlauf werden lokal im Browser (localStorage) gespeichert

## Technik

- [Vite](https://vitejs.dev/) — Dev-Server & Build
- [GSAP](https://gsap.com/) — Animationen und Effekte
- [Anthropic SDK](https://github.com/anthropics/anthropic-sdk-typescript) — KI-Vorschläge (Claude), serverseitig
- Vanilla JavaScript, kein Framework nötig

## Entwicklung

```bash
npm install
npm run dev      # startet http://localhost:5173
```

> Hinweis: Im lokalen `vite dev` läuft die serverlose Funktion `/api/generate`
> nicht — die App fällt dann automatisch auf den lokalen Vorschlags-Modus zurück.
> Die KI-Vorschläge sind nach dem Deploy (z. B. Vercel) mit gesetztem Key aktiv.

## KI-Vorschläge (optional)

Die Vorschläge werden serverseitig über die Claude-API erzeugt — der API-Key
bleibt dabei im Backend und wird nie an den Browser gegeben.

Auf Vercel als **Environment-Variable** setzen:

```
ANTHROPIC_API_KEY = sk-ant-...
```

Ohne Key funktioniert die App weiterhin — mit dem einfacheren lokalen
Vorschlags-Modus.

## Build

```bash
npm run build    # erzeugt dist/
npm run preview  # Vorschau des Builds
```

## Bewertungslogik

Für jede Option:

```
Score = Σ(Gewichtᵢ × Punkteᵢ) / (Σ Gewichtᵢ × 10) × 100
```

So liegt jeder Score zwischen 0 und 100 und ist unabhängig von der Anzahl der
Kriterien vergleichbar.
