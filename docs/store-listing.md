# Store-Listing — Texte & Metadaten

Vorlagen für Chrome Web Store, Microsoft Edge Add-ons und Firefox AMO.
`<deployment>` etc. vor der Einreichung ersetzen.

## Metadaten

- **Name:** Entscheidungsmatrix
- **Kategorie:** Produktivität
- **Sprachen:** Deutsch (primär); Englisch optional ergänzen
- **Website / Support-URL:** `<Repo- oder Landingpage-URL>`
- **Datenschutzerklärung-URL:** `<URL zu docs/privacy.md bzw. gehosteter Fassung>`

## Kurzbeschreibung (DE, ≤132 Zeichen)

> Vergleiche Optionen anhand gewichteter Kriterien. Mit Sprach-/KI-Vorschlägen,
> Verlauf, Kategorien, Export und Teilen.

## Kurzbeschreibung (EN, ≤132 Zeichen)

> Compare options by weighted criteria. Voice/AI suggestions, history, categories,
> CSV/PDF export and share links.

## Ausführliche Beschreibung (DE)

> **Triff bessere Entscheidungen — strukturiert statt aus dem Bauch.**
>
> Die Entscheidungsmatrix hilft dir, Optionen anhand gewichteter Kriterien zu
> vergleichen und die beste Wahl sichtbar zu machen.
>
> • **Sprich oder tippe einen Satz** — die App schlägt automatisch Titel, Optionen und
>   gewichtete Kriterien vor (KI oder lokaler Modus).
> • **Gewichte & Punkte** — jedes Kriterium gewichten, jede Option von 0–10 bewerten;
>   der gewichtete Score wird live berechnet und die Empfehlung hervorgehoben.
> • **Verlauf mit Kategorien** — Entscheidungen speichern, durchsuchen, filtern und
>   wieder öffnen.
> • **Export** — als CSV oder PDF.
> • **Teilen** — per Link, ganz ohne Server.
> • **Privat** — alles bleibt lokal im Browser. KI-Vorschläge sind optional und
>   standardmäßig aus.
>
> Als Seitenpanel (Chrome/Edge) bzw. Sidebar (Firefox) immer griffbereit.

## Ausführliche Beschreibung (EN)

> **Make better decisions — structured, not from the gut.**
>
> Decision Matrix helps you compare options against weighted criteria and see the best
> choice at a glance.
>
> • **Speak or type one sentence** — it suggests a title, options and weighted criteria
>   automatically (AI or local mode).
> • **Weights & scores** — weight each criterion, rate each option 0–10; the weighted
>   score updates live and the recommendation is highlighted.
> • **History with categories** — save, search, filter and reopen decisions.
> • **Export** — as CSV or PDF.
> • **Share** — via link, no server involved.
> • **Private** — everything stays local in your browser. AI suggestions are optional
>   and off by default.

## Berechtigungsbegründung (für die Store-Prüfung)

- **storage** — Entscheidungen, Verlauf und Einstellungen lokal speichern.
- **sidePanel** (Chrome/Edge) — die Matrix im Seitenpanel anzeigen.
- **contextMenus** — „markierten Text als Entscheidung öffnen“.
- **Netzwerk/Host** — Es sind **keine** Host-Berechtigungen deklariert. KI-Vorschläge
  laufen optional über eine vom Nutzer konfigurierte Backend-URL (mit CORS) oder den
  eigenen API-Key; ohne Konfiguration bleibt alles offline.

## Screenshots

Unter `extension/store-assets/` liegen Vorlagen (1280×800). Empfohlen:
1. Hero + Spracheingabe + Matrix
2. Ergebnis-Rangliste mit Empfehlung
3. Verlauf mit Kategorien
