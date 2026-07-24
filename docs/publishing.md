# Veröffentlichung — Checkliste

Vorbereitung und Schritte zur Einreichung in den drei Chromium-/Firefox-Stores.
Safari ist bewusst ausgeklammert (siehe `browser-extension.md`).

## 0. Vorher

- [ ] `version` in `extension/manifest.js` erhöhen (Semantic Versioning).
- [ ] `docs/privacy.md` mit Datum + Kontakt füllen und **öffentlich hosten**
      (z. B. GitHub-Raw-URL oder Landingpage) → URL notieren.
- [ ] Store-Texte aus `docs/store-listing.md` finalisieren.
- [ ] Screenshots prüfen: `extension/store-assets/*.png` (1280×800).
- [ ] KI-Backend deployen (Vercel) **oder** in der Beschreibung klarstellen, dass
      KI-Vorschläge optional sind (Backend-URL/eigener Key) und die Extension sonst
      lokal arbeitet.

## 1. Pakete bauen

**Automatisch (CI):** Der Workflow `.github/workflows/build-extension.yml` baut die Pakete
bei **jedem Push** und stellt sie unter dem Actions-Run als **Artefakt „extension-zips“**
zum Download bereit. Bei einem **Version-Tag** (`git tag v1.0.1 && git push --tags`) werden
sie zusätzlich an ein **GitHub-Release** gehängt.

**Manuell (lokal):**

```bash
npm run pack:all
# → extension/decisionmatrix-chrome.zip
# → extension/decisionmatrix-firefox.zip
```

Die Zips enthalten den Inhalt von `dist` bzw. `dist-firefox` (Manifest auf oberster Ebene).

> **Voll-Automatik bis in die Stores** ist zusätzlich möglich — siehe unten.

## Automatisches Publizieren (CI)

Der Workflow `.github/workflows/publish-extension.yml` lädt bei einem **Version-Tag**
automatisch in die Stores hoch. Jeder Store-Schritt läuft nur, wenn seine Secrets gesetzt
sind (fehlt ein Store, wird er übersprungen).

**Auslösen:**

```bash
# Version in extension/manifest.js erhöhen, committen, dann:
git tag v1.0.1
git push origin v1.0.1
```

### Einmalige Voraussetzungen (pro Store)

- **Chrome:** Das Item **einmal manuell** im [Developer Dashboard](https://chrome.google.com/webstore/devconsole)
  anlegen (Zip hochladen, Listing/Screenshots/Datenschutz-URL ausfüllen). Danach kennst du
  die **Item-ID** — ab dann übernimmt die CI die Updates.
- **Firefox:** Entwickler-Vereinbarung auf [AMO](https://addons.mozilla.org/developers/)
  akzeptieren und das Listing (Screenshots, Beschreibung, Datenschutz) anlegen. AMO verlangt
  bei gebündeltem Code ggf. den **Quellcode** — Repo-Link oder Source-Zip bereithalten.

### Benötigte GitHub-Secrets

`Settings → Secrets and variables → Actions → New repository secret`

| Secret | Store | Woher |
|---|---|---|
| `CHROME_EXTENSION_ID` | Chrome | Item-ID aus dem Developer Dashboard |
| `CHROME_CLIENT_ID` | Chrome | Google Cloud → Projekt → **Chrome Web Store API** aktivieren → OAuth-Client (Typ „Desktop“) |
| `CHROME_CLIENT_SECRET` | Chrome | derselbe OAuth-Client |
| `CHROME_REFRESH_TOKEN` | Chrome | einmalig via OAuth-Flow erzeugen (z. B. `npx chrome-webstore-upload-keys`) |
| `AMO_JWT_ISSUER` | Firefox | AMO → **Manage API Keys** → JWT issuer |
| `AMO_JWT_SECRET` | Firefox | AMO → **Manage API Keys** → JWT secret |

> **Chrome-Refresh-Token** (Kurzfassung): OAuth-Client anlegen, mit `client_id`/`client_secret`
> den Consent-Flow für den Scope `https://www.googleapis.com/auth/chromewebstore` durchlaufen
> und den erhaltenen `code` gegen ein `refresh_token` tauschen. Das Helfer-Tool
> `npx chrome-webstore-upload-keys` führt durch diesen Ablauf.

### Ablauf

1. Secrets hinterlegen (nur die Stores, die du willst).
2. Erstes Release je Store **einmal manuell** (Listing anlegen).
3. Ab dann: `git tag vX.Y.Z && git push --tags` → CI baut & lädt hoch; die
   Store-**Review** läuft danach wie gewohnt (nicht überspringbar).

**Edge** lässt sich analog ergänzen (nutzt das Chrome-Zip, eigene Publish-API/Action) —
auf Wunsch baue ich den Schritt dazu.

## 2. Chrome Web Store

- [ ] Entwicklerkonto anlegen (einmalige Gebühr).
- [ ] Neues Item → `decisionmatrix-chrome.zip` hochladen.
- [ ] Beschreibung (DE/EN), Kategorie **Produktivität**, Screenshots, Icon (128).
- [ ] Datenschutz-Tab: Datenschutz-URL, Datennutzung deklarieren
      (lokale Speicherung; optionaler Versand des eingegebenen Satzes bei KI-Nutzung).
- [ ] Berechtigungen begründen (siehe `store-listing.md`).
- [ ] Einreichen → Review abwarten.

## 3. Microsoft Edge Add-ons

- [ ] Partner-Center-Konto (Edge) anlegen.
- [ ] Neues Add-on → **dasselbe** `decisionmatrix-chrome.zip` (Chromium-Build) hochladen.
- [ ] Listing, Screenshots, Datenschutz-URL analog Chrome.
- [ ] Einreichen → Review.

## 4. Firefox AMO (addons.mozilla.org)

- [ ] Firefox-Konto / AMO-Entwicklerkonto anlegen.
- [ ] „Submit a New Add-on“ → `decisionmatrix-firefox.zip` hochladen.
- [ ] `web-ext lint` sollte 0 Fehler zeigen (nur `innerHTML`-Warnungen — unkritisch,
      Inhalt ist escaped/statisch).
- [ ] `browser_specific_settings.gecko.id` ist gesetzt (`entscheidungsmatrix@decisionmatrix.app`).
- [ ] Listing, Screenshots, Datenschutz-URL.
- [ ] Distribution: „On this site (AMO)“ für die öffentliche Listung.
- [ ] Einreichen → Review.

Optional statt manuellem Zip:
```bash
npx web-ext build --source-dir extension/dist-firefox --artifacts-dir extension
npx web-ext sign  --source-dir extension/dist-firefox --api-key <JWT-issuer> --api-secret <JWT-secret>
```

## 5. Nach der Freigabe

- [ ] Store-Links in `README.md` ergänzen.
- [ ] Bei Updates: Version erhöhen, `pack:all`, erneut hochladen.

## Bekannte Hinweise

- **Firefox** hat keine Web-Speech-Erkennung → Mikrofon-Button ausgeblendet (Text bleibt).
- **Teilen-Links** funktionieren extern nur mit gesetzter **Share-Basis-URL** (öffentliche
  Web-App); sonst zeigen sie auf die interne Extension-Seite.
- Es sind **keine** Host-Berechtigungen deklariert; die KI-Backend-Domain wird per CORS
  erreicht.
