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

```bash
npm run pack:all
# → extension/decisionmatrix-chrome.zip
# → extension/decisionmatrix-firefox.zip
```

Die Zips enthalten den Inhalt von `dist` bzw. `dist-firefox` (Manifest auf oberster Ebene).

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
