# Entscheidungsmatrix

Eine gewichtete Entscheidungsmatrix als eigenständige Web-App. Vergleiche mehrere
Optionen anhand gewichteter Kriterien und finde die beste Wahl — mit Live-Berechnung,
Rangliste und Animationen.

## Features

- **Optionen × Kriterien** frei bearbeitbar (hinzufügen, umbenennen, entfernen)
- **Gewichte pro Kriterium** (0–10) mit automatischer Prozent-Anzeige
- **Punkte pro Option** (0–10) je Kriterium
- **Gewichteter Gesamtscore**, normiert auf 100, live berechnet
- **Rangliste** mit animierten Balken und hochzählenden Werten (GSAP)
- **Empfehlung** — die beste Option wird hervorgehoben
- **Light/Dark-Theme** mit Umschalter, folgt sonst dem System
- **Persistenz** — der Stand wird lokal im Browser (localStorage) gespeichert

## Technik

- [Vite](https://vitejs.dev/) — Dev-Server & Build
- [GSAP](https://gsap.com/) — Animationen und Effekte
- Vanilla JavaScript, kein Framework nötig

## Entwicklung

```bash
npm install
npm run dev      # startet http://localhost:5173
```

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
