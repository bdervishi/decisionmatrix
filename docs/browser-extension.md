# Browser-Extension — Konzept & Plan

Ziel: Die Entscheidungsmatrix zusätzlich als **Browser-Erweiterung** anbieten —
für **Chrome, Edge, Firefox und Safari** (und Chromium-Derivate wie Brave/Opera/Vivaldi).
Die Web-App bleibt bestehen; die Extension teilt sich denselben Kern-Code.

---

## 1. Warum es gut passt

Die App ist bereits eine self-contained Vanilla-JS-Anwendung ohne Framework, mit
lokalem State (localStorage) und optionalem KI-Backend. Damit ist sie fast ideal
für eine **Manifest-V3**-Extension:

- Kein externes Script, kein `eval` → erfüllt die strenge MV3-Content-Security-Policy.
- Der Client bündelt nur GSAP + eigenen Code (das Anthropic-SDK läuft **serverseitig**,
  nicht im Client) → kleines, CSP-konformes Bundle.
- Zustand liegt lokal → passt zu `chrome.storage`.

---

## 2. Konzept

### 2.1 Oberfläche (welcher Extension-Surface?)

Die Matrix ist relativ groß, ein winziges Popup wäre zu eng. Empfehlung:

| Surface | Rolle | Browser |
|---|---|---|
| **Side Panel** (primär) | Persistentes Werkzeug neben der Seite | Chrome, Edge (`sidePanel`), Firefox (`sidebar_action`) |
| **Vollseite (Tab)** | Große Ansicht / Fallback | alle (eigene `index.html` via `tabs.create`) |
| **Popup** (kompakt) | Schnellzugriff: „Neue Entscheidung“, letzte 3 aus dem Verlauf | alle |
| **Options-Seite** | Einstellungen (Backend-URL, eigener API-Key, Share-Basis-URL) | alle |
| **Kontextmenü** | „Markierten Text als Entscheidung öffnen“ | alle (`contextMenus`) |

> Safari kennt keine `sidePanel`-API → dort Popup + Vollseite. Firefox nutzt
> `sidebar_action` statt `sidePanel`. Diese Unterschiede kapselt das Build-Tool (siehe 3.1).

### 2.2 KI-Vorschläge in der Extension

In einer Extension gibt es kein mitgeliefertes Backend. Drei Wege, wie schon in der Web-App
als abgestuftes Fallback:

1. **Gehostetes Backend (Standard).** Die Extension ruft die deployte Vercel-Funktion
   `https://<deployment>/api/generate` per `fetch` auf (via `host_permissions`).
   Der API-Key bleibt serverseitig. Voraussetzung: CORS für die Extension-Origin freigeben.
2. **Eigener API-Key (optional).** Nutzer hinterlegt seinen Anthropic-Key in den Einstellungen
   (`chrome.storage.local`); die Extension ruft die Anthropic-API direkt aus dem Service-Worker
   mit Header `anthropic-dangerous-direct-browser-access: true`. Kein eigenes Backend nötig.
3. **Lokale Heuristik (offline).** Kein Key, keine Server — der bereits vorhandene
   Keyword-Modus. Funktioniert immer.

### 2.3 Spracheingabe

Web Speech API (`SpeechRecognition`) ist **nicht überall verfügbar**:

| Browser | SpeechRecognition | Konsequenz |
|---|---|---|
| Chrome / Edge | ✅ (Google-Dienst) | volle Sprachfunktion; Mikrofon-Berechtigung nötig |
| Safari (macOS) | ✅ (webkit) | funktioniert |
| Firefox | ❌ | Mikrofon-Button ausblenden, Texteingabe bleibt (schon implementiert) |

Der bestehende Code degradiert bereits sauber, wenn `SpeechRecognition` fehlt.

### 2.4 Zustand & Verlauf

- Abstrakte **Storage-Schicht**: nutzt `chrome.storage.local` in der Extension,
  `localStorage` in der Web-App (Feature-Detection).
- Optional `chrome.storage.sync`, damit der **Verlauf geräteübergreifend** synchron ist.

### 2.5 Teilen per Link

Extension-Seiten haben `chrome-extension://…`-URLs — die kann niemand extern öffnen.
Daher zeigen **Share-Links weiterhin auf die gehostete Web-App**
(`https://<deployment>/#d=…`). Die Basis-URL ist in den Einstellungen konfigurierbar.

---

## 3. Technische Architektur

### 3.1 Build-Tool: WXT (empfohlen)

[WXT](https://wxt.dev) ist ein Vite-basiertes Framework speziell für **plattformübergreifende**
Extensions:

- MV3, **Chrome / Edge / Firefox / Safari** aus einer Codebasis.
- Erzeugt pro Ziel das passende Manifest (löst `sidePanel` vs. `sidebar_action`,
  `browser_specific_settings.gecko.id` für Firefox, Safari-Konverter etc.).
- Nutzt intern Vite → GSAP-Bundle und unser Code bleiben unverändert nutzbar.
- Alternative: `@crxjs/vite-plugin` (näher an Vite, aber Safari/Firefox mehr Handarbeit).

### 3.2 Code-Aufteilung (Refactoring der App)

Kern-Logik framework-agnostisch als importierbare Module herauslösen, von **Web-App und
Extension gemeinsam** genutzt:

```
src/core/
  matrix.js        # Score-Berechnung, State-Modell
  history.js       # Verlauf + Kategorien
  categorize.js    # Keyword-Klassifikator
  suggest.js       # generate() + lokale Heuristik  (Backend-URL injizierbar)
  exporters.js     # CSV / Print-PDF
  share.js         # encode/decode Zustand
  storage.js       # Adapter: chrome.storage | localStorage
src/ui/            # DOM-Rendering (heute in main.js)
```

- Web-App: `index.html` → `src/ui` + `src/core` (wie heute, deployt auf Vercel).
- Extension (WXT): `entrypoints/sidepanel`, `entrypoints/popup`, `entrypoints/options`,
  `entrypoints/background` → importieren dieselben `src/core`-Module.

### 3.3 Berechtigungen (minimal halten)

| Permission | Wofür |
|---|---|
| `storage` | Zustand & Verlauf |
| `sidePanel` (Chrome/Edge) | Seitenleiste |
| `contextMenus` | „Markierten Text als Entscheidung“ |
| `host_permissions` | nur die Backend-Domain (bei gehostetem Backend) |
| Mikrofon | via `getUserMedia` / optionale Berechtigung, nur bei Sprachnutzung |

Kein `tabs`-Vollzugriff, kein `<all_urls>` — datensparsam, erleichtert die Store-Freigabe.

---

## 4. Cross-Browser-Besonderheiten

| Browser | Store | Besonderheit |
|---|---|---|
| **Chrome** | Chrome Web Store | Referenz-Ziel (MV3, `sidePanel`) |
| **Edge** | Microsoft Edge Add-ons | Chromium — gleicher Build; eigene Store-Einreichung |
| **Firefox** | addons.mozilla.org (AMO) | `sidebar_action` statt `sidePanel`; `gecko.id` nötig; kein SpeechRecognition |
| **Safari** | App Store | **Xcode-Wrapper** via `xcrun safari-web-extension-converter`; **Apple Developer Account (99 $/Jahr)**; Notarisierung |
| Brave/Opera/Vivaldi | — | Chrome-Build funktioniert direkt |

Safari ist der aufwendigste Kanal (nativer App-Wrapper + Apple-Konto).

---

## 5. Umsetzungsplan (Phasen)

| Phase | Inhalt | Aufwand (grob) |
|---|---|---|
| **0 — Entscheidungen** | Surface (Side Panel + Vollseite), Build-Tool (WXT), Backend-Strategie bestätigen | 0.5 Tag |
| **1 — Refactoring** | Kern in `src/core` extrahieren, Storage-Adapter, konfigurierbare Backend-/Share-URL. Web-App weiter grün. | 1–2 Tage |
| **2 — Extension-Grundgerüst** | WXT-Setup, Side-Panel + Popup + Options + Background, Kern wiederverwenden, Icons | 2–3 Tage |
| **3 — Backend & Keys** | CORS für Extension-Origin **oder** BYO-Key-Pfad (Anthropic direkt) + Heuristik-Fallback | 1 Tag |
| **4 — Chrome/Edge/Firefox** | Manifest-Diffs, Sprach-Fallback testen, `gecko.id`, QA in allen dreien | 1–2 Tage |
| **5 — Safari** | Xcode-Konvertierung, Signieren/Notarisieren, Test | 1–2 Tage (+ Apple-Konto) |
| **6 — Store-Assets** | Icons, Screenshots, Beschreibungen, **Datenschutzerklärung** (wegen Mikrofon/Netz) | 1 Tag |
| **7 — Veröffentlichung & CI** | Einreichung je Store; GitHub-Action baut alle Ziele & zippt Artefakte | 1–2 Tage |

**Grobschätzung:** ~1,5–2,5 Wochen fokussierte Arbeit, plus Store-Review-Zeiten
(Chrome/Edge Tage, Firefox Tage, Safari App-Review länger).

---

## 6. Risiken & offene Punkte

- **Safari-Aufwand** — nativer Wrapper + kostenpflichtiges Apple-Konto. Optional zuerst
  Chrome/Edge/Firefox liefern, Safari als zweite Welle.
- **Sprache in Firefox** — kein SpeechRecognition; nur Texteingabe (akzeptiert, degradiert sauber).
- **Backend-Abhängigkeit** — bei gehostetem Backend muss Vercel laufen + CORS erlauben.
  BYO-Key vermeidet das, verlagert aber den Key-Besitz zum Nutzer.
- **Store-Reviews** — Mikrofon- und Netzwerknutzung erfordern klare Begründung +
  Datenschutzerklärung; Berechtigungen minimal halten.
- **Sync-Quota** — `chrome.storage.sync` ist klein (~100 KB); großer Verlauf ggf. nur
  `local`, Sync optional/gekürzt.

---

## 7. Empfohlene erste Schritte

1. **Phase 1** umsetzen (Kern-Refactoring + Storage-Adapter) — bringt schon der Web-App
   sauberere Struktur und ist die Basis für die Extension.
2. **MVP-Extension** für **Chrome/Edge** (Side Panel + lokale Heuristik + optional BYO-Key),
   ohne Store-Einreichung lokal testbar (`Entpackte Erweiterung laden`).
3. Danach **Firefox**, dann **Safari** und die Store-Veröffentlichungen.

> Dieses Dokument ist das Konzept/der Plan. Auf Wunsch setze ich mit Phase 1 (Refactoring)
> und einem lauffähigen Chrome/Edge-MVP fort.

---

## 8. Umsetzungsstatus

- **Phase 1 — Kern-Refactoring: erledigt.** Die framework-unabhängige Logik liegt jetzt in
  `src/core/`:
  - `config.js` — Backend-URL & Share-Basis-URL (von der Extension überschreibbar), Storage-Keys
  - `storage.js` — Adapter (localStorage, Memory-Fallback; vorbereitet für `chrome.storage`)
  - `matrix.js` — Zustandsmodell, Scoring, Rangliste, Beispiel
  - `categorize.js` — Kategorien + Keyword-Klassifikator
  - `suggest.js` — Backend-Aufruf (injizierbare URL) + lokale Heuristik + Kategorie-Wahl
  - `share.js` — Zustand ⇄ Link, Share-URL-Bau
  - `exporters.js` — CSV-Erzeugung
  - `history.js` — Eintrag bauen, filtern, gruppieren
  - `util.js` — clamp/clone/escapeHtml/slugify/formatDate/downloadFile

  `main.js` ist nun reine UI-/Orchestrierungs-Schicht und importiert diese Module.
  Verhaltensparität der Web-App per End-to-End-Test bestätigt.

- **Phase 2 — Chrome/Edge-MVP: erledigt.** Unter `extension/` liegt eine lauffähige
  MV3-Extension (schlankes Vite-Setup statt WXT für den MVP — WXT bleibt der Weg für
  die Firefox/Safari-Erweiterung in Phase 4/5). Enthalten:
  - **Side Panel** mit der vollständigen Matrix-UI (`../src/main.js` wiederverwendet)
  - **Popup** (Schnellstart: Side Panel öffnen, letzte Entscheidungen, Einstellungen)
  - **Options** (Backend-URL + Share-Basis-URL, im geteilten Extension-Storage)
  - **Background-Worker** + **Kontextmenü** („markierten Text als Entscheidung“)
  - Icons (16/32/48/128), statisches Manifest, CSP-konformer Build (keine Inline-Skripte)
  - Backend um **CORS** ergänzt, sodass die Extension die gehostete Funktion ohne breite
    Host-Berechtigungen aufrufen kann
  - Storage-Adapter aus Phase 1 wiederverwendet (localStorage, geteilt über die
    Extension-Seiten). Als entpackte Erweiterung getestet: alle Seiten rendern fehlerfrei.
  - Bauen & Laden: `npm run build:ext` → `extension/dist` als „Entpackte Erweiterung laden“
    (siehe `extension/README.md`).

- **Phase 3 — BYO-Key-Pfad: erledigt.** Alternative zum gehosteten Backend: die Extension
  kann Claude direkt aufrufen.
  - Gemeinsames Prompt-/Schema-Modul `src/core/prompt.js` (DRY) — von der serverlosen
    Funktion **und** dem Client geteilt.
  - `src/core/anthropicClient.js` — direkter Aufruf über das offizielle SDK im Browser-Modus
    (`dangerouslyAllowBrowser: true`; das SDK setzt den CORS-Header
    `anthropic-dangerous-direct-browser-access`).
  - Pluggbarer Vorschlags-Anbieter (`config.suggestProvider`) + `getSuggestion()`:
    Reihenfolge **Backend-URL → eigener Key → lokale Heuristik**.
  - Options-Seite um ein API-Key-Feld (Passwort) mit Sicherheitshinweis erweitert.
  - Web-App unberührt (importiert das SDK nicht); Extension bündelt es nur für diesen Pfad.
    Builds grün, Extension neu geladen und getestet — Wiring (Node-Test) + Rendering ok.

- **Nächster Schritt:** Phase 4 (Firefox via WXT, `gecko.id`, Sprach-Fallback) und Phase 5
  (Safari via Xcode-Wrapper). Optional `chrome.storage.sync` für geräteübergreifenden Verlauf.
