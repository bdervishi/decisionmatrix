import gsap from "gsap";
import "./style.css";

/* ------------------------------------------------------------------ *
 *  Gewichtete Entscheidungsmatrix
 *  Reine Client-App: Zustand in localStorage, Animationen via GSAP.
 * ------------------------------------------------------------------ */

const KEY = "decisionmatrix_state_v1";
const THEME_KEY = "decisionmatrix_theme";
const HISTORY_KEY = "decisionmatrix_history_v1";

const CATEGORIES = [
  "Kleidung",
  "Reise",
  "Technik",
  "Finanzen",
  "Karriere",
  "Wohnen",
  "Gesundheit",
  "Essen",
  "Freizeit",
  "Sonstiges",
];

// Lokaler Keyword-Klassifikator (Fallback, wenn keine KI-Kategorie vorliegt).
const CATEGORY_KEYWORDS = [
  ["Kleidung", ["outfit", "kleid", "anzieh", "anzug", "hose", "schuh", "jacke", "hemd", "mode", "tragen", "pullover", "krawatte"]],
  ["Reise", ["ferien", "urlaub", "reise", "flug", "hotel", "trip", "ausland", "wochenendtrip", "städtereise", "reisen", "fliegen"]],
  ["Technik", ["laptop", "macbook", "thinkpad", "handy", "smartphone", "iphone", "pc", "computer", "kamera", "kopfhörer", "tablet", "software", "gerät", "monitor", "konsole"]],
  ["Finanzen", ["sparen", "investier", "aktie", "kredit", "geld", "versicherung", "konto", "budget", "hypothek", "anlage", "etf", "kryptowährung", "bitcoin"]],
  ["Karriere", ["job", "stelle", "arbeit", "bewerbung", "studium", "ausbildung", "kündig", "beruf", "karriere", "gehalt", "praktikum", "arbeitgeber"]],
  ["Wohnen", ["wohnung", "umzug", "umziehen", "miete", "haus", "wohnort", "wg", "möbel", "renovier"]],
  ["Gesundheit", ["arzt", "sport", "ernährung", "diät", "fitness", "gesundheit", "therapie", "training", "abnehmen", "workout"]],
  ["Essen", ["restaurant", "kochen", "rezept", "mittagessen", "abendessen", "pizza", "essen gehen", "lokal", "menü"]],
  ["Freizeit", ["film", "serie", "buch", "spiel", "konzert", "hobby", "ausgehen", "kino", "festival", "party"]],
];

function categorize(text) {
  const t = (text || "").toLowerCase();
  for (const [cat, words] of CATEGORY_KEYWORDS) {
    if (words.some((w) => t.includes(w))) return cat;
  }
  return "Sonstiges";
}

const EXAMPLE = {
  title: "Welches Outfit ziehe ich an?",
  options: ["Outfit A — Business", "Outfit B — Smart Casual", "Outfit C — Casual"],
  criteria: [
    { name: "Anlass-Tauglichkeit", weight: 5, scores: [9, 7, 3] },
    { name: "Komfort", weight: 4, scores: [4, 7, 9] },
    { name: "Wetter-Tauglichkeit", weight: 3, scores: [6, 7, 8] },
    { name: "Stil / Ausstrahlung", weight: 4, scores: [8, 8, 5] },
    { name: "Preis / Aufwand", weight: 2, scores: [5, 7, 9] },
  ],
};

const clone = (o) => JSON.parse(JSON.stringify(o));
const clampNum = (v, lo, hi) => {
  let n = Number(v);
  if (Number.isNaN(n)) n = 0;
  return Math.max(lo, Math.min(hi, n));
};

function loadState() {
  try {
    const s = localStorage.getItem(KEY);
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}
function saveState() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* Speicher nicht verfügbar — App läuft trotzdem in-memory weiter. */
  }
}

let state = loadState() || clone(EXAMPLE);
if (!state.title) state.title = EXAMPLE.title;

/* ---------------------------- Shell ------------------------------- */

const app = document.getElementById("app");
app.innerHTML = `
  <div class="wrap">
    <div class="topbar">
      <div class="brand">
        <div class="brand-mark">◈</div>
        <span class="brand-name">Entscheidungsmatrix</span>
      </div>
      <button class="theme-toggle" id="themeToggle" aria-label="Farbschema wechseln">◐</button>
    </div>

    <header>
      <p class="eyebrow">Gewichtete Entscheidung</p>
      <h1 id="titleField" contenteditable="true" spellcheck="false"></h1>
      <p class="lead">Sprich oder tippe einen Satz zu deiner Entscheidung — die App schlägt
        automatisch Optionen und gewichtete Kriterien vor. Danach bewertest du jede Option
        von&nbsp;0–10, und die Matrix rechnet die beste Wahl live aus.</p>
    </header>

    <section class="ask card" id="askCard">
      <div class="ask-body">
        <label class="ask-label" for="askInput">Deine Entscheidung in einem Satz</label>
        <div class="ask-row">
          <button class="mic" id="micBtn" type="button" aria-label="Spracheingabe starten" title="Sprechen">
            <span class="mic-glyph">🎤</span>
          </button>
          <input type="text" id="askInput" autocomplete="off"
            placeholder="z. B. „Soll ich Outfit A, B oder C anziehen?“" />
          <button class="primary" id="genBtn" type="button">Vorschläge</button>
        </div>
        <div class="ask-status" id="askStatus" role="status" aria-live="polite"></div>
      </div>
    </section>

    <div class="toolbar">
      <button class="primary" id="addOpt">+ Option</button>
      <button id="addCrit">+ Kriterium</button>
      <button id="saveHist">★ Im Verlauf speichern</button>
      <button class="ghost" id="loadExample">Beispiel laden</button>
      <button class="ghost" id="clearAll">Leeren</button>
    </div>

    <div class="card" id="matrixCard">
      <div class="card-head">
        <h2>Matrix</h2>
        <span class="hint">Gewicht = Wichtigkeit · Punkte 0–10 je Option</span>
      </div>
      <div class="scroll">
        <table id="matrix">
          <thead><tr id="headRow"></tr></thead>
          <tbody id="body"></tbody>
        </table>
      </div>
    </div>

    <div class="card" id="resultCard">
      <div class="card-head">
        <h2>Ergebnis</h2>
        <span class="hint">Gewichteter Schnitt, normiert auf 100</span>
      </div>
      <div class="results" id="results"></div>
    </div>

    <div class="card" id="historyCard">
      <div class="card-head">
        <h2>Verlauf</h2>
        <span class="hint" id="histHint">Deine gespeicherten Entscheidungen</span>
      </div>
      <div class="history" id="historyList"></div>
    </div>

    <footer>Alles wird lokal in deinem Browser gespeichert · Namen &amp; Titel per Klick anpassbar</footer>
  </div>
`;

const headRow = document.getElementById("headRow");
const body = document.getElementById("body");
const results = document.getElementById("results");
const titleField = document.getElementById("titleField");
const askInput = document.getElementById("askInput");
const genBtn = document.getElementById("genBtn");
const micBtn = document.getElementById("micBtn");
const askStatus = document.getElementById("askStatus");
const historyList = document.getElementById("historyList");

/* ---------------------------- Theme ------------------------------- */

function applyTheme(mode) {
  if (mode === "light" || mode === "dark") {
    document.documentElement.setAttribute("data-theme", mode);
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
}
(function initTheme() {
  let saved = null;
  try {
    saved = localStorage.getItem(THEME_KEY);
  } catch {
    /* ignore */
  }
  if (saved) applyTheme(saved);
})();
document.getElementById("themeToggle").addEventListener("click", () => {
  const isDark =
    document.documentElement.getAttribute("data-theme") === "dark" ||
    (!document.documentElement.getAttribute("data-theme") &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  const next = isDark ? "light" : "dark";
  applyTheme(next);
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch {
    /* ignore */
  }
});

/* -------------------------- Berechnung ---------------------------- */

const totalWeight = () =>
  state.criteria.reduce((s, c) => s + (Number(c.weight) || 0), 0);

function optionScore(oi) {
  const tw = totalWeight();
  if (tw <= 0) return 0;
  let sum = 0;
  state.criteria.forEach((c) => {
    const w = Number(c.weight) || 0;
    let v = Number(c.scores[oi]);
    if (Number.isNaN(v)) v = 0;
    sum += w * v;
  });
  return (sum / (tw * 10)) * 100; // 0..100, max je Kriterium = 10
}

/* ---------------------------- Render ------------------------------ */

function render() {
  titleField.textContent = state.title;

  // --- Kopfzeile
  headRow.innerHTML = "";
  const thCrit = document.createElement("th");
  thCrit.textContent = "Kriterium";
  thCrit.style.minWidth = "190px";
  headRow.appendChild(thCrit);

  const thW = document.createElement("th");
  thW.className = "num";
  thW.textContent = "Gewicht";
  thW.style.minWidth = "92px";
  headRow.appendChild(thW);

  state.options.forEach((name, oi) => {
    const th = document.createElement("th");
    th.className = "opt-col";
    const wrap = document.createElement("div");
    wrap.className = "name-wrap";
    wrap.style.justifyContent = "center";
    const inp = document.createElement("input");
    inp.type = "text";
    inp.className = "plain";
    inp.value = name;
    inp.style.textAlign = "center";
    inp.setAttribute("aria-label", `Name der Option ${oi + 1}`);
    inp.addEventListener("input", () => {
      state.options[oi] = inp.value;
      saveState();
      renderResults();
    });
    const del = document.createElement("button");
    del.className = "del";
    del.innerHTML = "&times;";
    del.title = "Option entfernen";
    del.setAttribute("aria-label", "Option entfernen");
    del.addEventListener("click", () => removeOption(oi));
    wrap.append(inp, del);
    th.appendChild(wrap);
    headRow.appendChild(th);
  });

  // --- Zeilen
  body.innerHTML = "";
  const tw = totalWeight();

  state.criteria.forEach((c, ci) => {
    const tr = document.createElement("tr");

    const tdName = document.createElement("td");
    const nameWrap = document.createElement("div");
    nameWrap.className = "name-wrap";
    const nameInp = document.createElement("input");
    nameInp.type = "text";
    nameInp.className = "plain";
    nameInp.value = c.name;
    nameInp.setAttribute("aria-label", `Kriterium ${ci + 1}`);
    nameInp.addEventListener("input", () => {
      c.name = nameInp.value;
      saveState();
    });
    const delC = document.createElement("button");
    delC.className = "del";
    delC.innerHTML = "&times;";
    delC.title = "Kriterium entfernen";
    delC.setAttribute("aria-label", "Kriterium entfernen");
    delC.addEventListener("click", () => removeCriterion(ci));
    nameWrap.append(nameInp, delC);
    tdName.appendChild(nameWrap);
    tr.appendChild(tdName);

    const tdW = document.createElement("td");
    tdW.className = "num";
    const wc = document.createElement("div");
    wc.className = "wcell";
    const wInp = document.createElement("input");
    wInp.className = "weight";
    wInp.type = "number";
    wInp.min = "0";
    wInp.max = "10";
    wInp.step = "1";
    wInp.value = c.weight;
    wInp.setAttribute("aria-label", `Gewicht für ${c.name}`);
    wInp.addEventListener("input", () => {
      c.weight = clampNum(wInp.value, 0, 10);
      saveState();
      render();
    });
    const pct = document.createElement("div");
    pct.className = "wpct";
    pct.textContent = tw > 0 ? `${Math.round(((Number(c.weight) || 0) / tw) * 100)}%` : "–";
    wc.append(wInp, pct);
    tdW.appendChild(wc);
    tr.appendChild(tdW);

    state.options.forEach((_, oi) => {
      const td = document.createElement("td");
      td.className = "num";
      const s = document.createElement("input");
      s.className = "score";
      s.type = "number";
      s.min = "0";
      s.max = "10";
      s.step = "1";
      s.value = c.scores[oi] == null ? "" : c.scores[oi];
      s.setAttribute("aria-label", `${c.name} – Punkte für ${state.options[oi]}`);
      s.addEventListener("input", () => {
        c.scores[oi] = s.value === "" ? 0 : clampNum(s.value, 0, 10);
        saveState();
        renderResults();
      });
      td.appendChild(s);
      tr.appendChild(td);
    });

    body.appendChild(tr);
  });

  if (state.criteria.length === 0 || state.options.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 2 + state.options.length || 3;
    td.className = "empty";
    td.textContent = "Füge mindestens eine Option und ein Kriterium hinzu.";
    tr.appendChild(td);
    body.appendChild(tr);
  }

  renderResults();
}

function renderResults(animate = true) {
  results.innerHTML = "";

  if (state.options.length === 0 || state.criteria.length === 0 || totalWeight() <= 0) {
    const e = document.createElement("div");
    e.className = "empty";
    e.style.padding = "0";
    e.textContent =
      "Sobald Optionen, Kriterien und Gewichte gesetzt sind, erscheint hier die Rangliste.";
    results.appendChild(e);
    return;
  }

  const rows = state.options.map((name, oi) => ({
    name: name || `Option ${oi + 1}`,
    score: optionScore(oi),
  }));
  const ranked = rows.slice().sort((a, b) => b.score - a.score);
  const best = ranked.length ? ranked[0].score : 0;

  ranked.forEach((r, i) => {
    const row = document.createElement("div");
    row.className = "res-row" + (r.score === best && best > 0 ? " win" : "");

    const name = document.createElement("div");
    name.className = "res-name";
    const rank = document.createElement("span");
    rank.className = "res-rank";
    rank.textContent = `${i + 1}.`;
    name.append(rank, document.createTextNode(r.name));

    const track = document.createElement("div");
    track.className = "bar-track";
    const fill = document.createElement("div");
    fill.className = "bar-fill";
    track.appendChild(fill);

    const val = document.createElement("div");
    val.className = "score-val";
    val.innerHTML = `<span data-count="${r.score.toFixed(1)}">0.0</span>/100`;

    row.append(name, track, val);
    results.appendChild(row);

    // --- GSAP: Balken- und Zahl-Animation
    const targetW = `${r.score}%`;
    if (animate) {
      gsap.to(fill, { width: targetW, duration: 0.8, ease: "power3.out", delay: i * 0.06 });
      const counter = { v: 0 };
      const label = val.querySelector("span");
      gsap.to(counter, {
        v: r.score,
        duration: 0.8,
        ease: "power2.out",
        delay: i * 0.06,
        onUpdate: () => {
          label.textContent = counter.v.toFixed(1);
        },
      });
    } else {
      fill.style.width = targetW;
      val.querySelector("span").textContent = r.score.toFixed(1);
    }
  });

  // Gewinnerzeile kurz hervorheben
  if (animate) {
    const winner = results.querySelector(".res-row.win");
    if (winner) {
      gsap.fromTo(
        winner,
        { scale: 0.99 },
        { scale: 1, duration: 0.5, ease: "back.out(2)", delay: 0.2 }
      );
    }
  }
}

/* ------------------------- Mutationen ----------------------------- */

function addOption() {
  state.options.push(`Option ${state.options.length + 1}`);
  state.criteria.forEach((c) => c.scores.push(5));
  saveState();
  render();
}
function removeOption(oi) {
  state.options.splice(oi, 1);
  state.criteria.forEach((c) => c.scores.splice(oi, 1));
  saveState();
  render();
}
function addCriterion() {
  state.criteria.push({
    name: "Neues Kriterium",
    weight: 3,
    scores: state.options.map(() => 5),
  });
  saveState();
  render();
}
function removeCriterion(ci) {
  state.criteria.splice(ci, 1);
  saveState();
  render();
}

/* --------------------------- Events ------------------------------- */

document.getElementById("addOpt").addEventListener("click", addOption);
document.getElementById("addCrit").addEventListener("click", addCriterion);
document.getElementById("loadExample").addEventListener("click", () => {
  state = clone(EXAMPLE);
  suggestedCategory = null;
  saveState();
  render();
});
document.getElementById("clearAll").addEventListener("click", () => {
  state = { title: "Meine Entscheidung", options: [], criteria: [] };
  suggestedCategory = null;
  saveState();
  render();
});

function commitTitle() {
  const t = titleField.textContent.trim();
  state.title = t || "Meine Entscheidung";
  saveState();
}
titleField.addEventListener("blur", commitTitle);
titleField.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    titleField.blur();
  }
});

/* ---------------- Verlauf (History) ------------------------------ */

let history = loadHistory();
let suggestedCategory = null; // Kategorie aus letzter Generierung (KI oder Heuristik)

function loadHistory() {
  try {
    const s = localStorage.getItem(HISTORY_KEY);
    const arr = s ? JSON.parse(s) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
function persistHistory() {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {
    /* Speicher voll/gesperrt – Verlauf bleibt in-memory */
  }
}

// Rangliste der aktuellen Matrix als [{name, score}] absteigend.
function currentRanking() {
  return state.options
    .map((name, oi) => ({ name: name || `Option ${oi + 1}`, score: optionScore(oi) }))
    .sort((a, b) => b.score - a.score);
}

function formatDate(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return "";
  return d.toLocaleDateString("de-CH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function saveCurrentToHistory() {
  if (state.options.length === 0 || state.criteria.length === 0 || totalWeight() <= 0) {
    setStatus("Erst Optionen, Kriterien und Gewichte setzen, dann speichern.", "warn");
    return;
  }
  const ranking = currentRanking();
  const winner = ranking[0];
  const category =
    suggestedCategory && CATEGORIES.includes(suggestedCategory)
      ? suggestedCategory
      : categorize(`${state.title} ${state.options.join(" ")}`);
  const entry = {
    id: "h_" + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36),
    date: new Date().toISOString(),
    title: state.title || "Meine Entscheidung",
    category,
    winner: winner ? winner.name : "",
    winnerScore: winner ? winner.score : 0,
    optionCount: state.options.length,
    // Vollständiger Snapshot zum Wiederherstellen
    snapshot: clone({ title: state.title, options: state.options, criteria: state.criteria }),
  };
  history.unshift(entry);
  if (history.length > 50) history = history.slice(0, 50);
  persistHistory();
  renderHistory();
  setStatus("Im Verlauf gespeichert.", "ok");
  const first = historyList.querySelector(".hist-item");
  if (first && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    gsap.from(first, { height: 0, opacity: 0, duration: 0.4, ease: "power2.out" });
  }
}

function restoreFromHistory(id) {
  const entry = history.find((h) => h.id === id);
  if (!entry) return;
  state = clone(entry.snapshot);
  if (!state.title) state.title = "Meine Entscheidung";
  saveState();
  render();
  setStatus(`„${entry.title}“ geöffnet.`, "ok");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteFromHistory(id) {
  history = history.filter((h) => h.id !== id);
  persistHistory();
  renderHistory();
}

function recategorize(id, category) {
  const entry = history.find((h) => h.id === id);
  if (!entry || !CATEGORIES.includes(category)) return;
  entry.category = category;
  persistHistory();
  renderHistory();
}

function buildHistItem(h) {
  const item = document.createElement("div");
  item.className = "hist-item";

  const main = document.createElement("div");
  main.className = "hist-main";
  const t = document.createElement("div");
  t.className = "hist-title";
  t.textContent = h.title;
  const meta = document.createElement("div");
  meta.className = "hist-meta";
  meta.textContent = `${formatDate(h.date)} · ${h.optionCount} Optionen`;
  main.append(t, meta);

  const win = document.createElement("div");
  win.className = "hist-win";
  win.innerHTML = `<span class="hist-win-name">★ ${escapeHtml(h.winner)}</span><span class="hist-win-score">${h.winnerScore.toFixed(0)}<span>/100</span></span>`;

  const actions = document.createElement("div");
  actions.className = "hist-actions";

  const cat = document.createElement("select");
  cat.className = "hist-cat";
  cat.title = "Kategorie ändern";
  cat.setAttribute("aria-label", "Kategorie ändern");
  CATEGORIES.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    if (c === h.category) opt.selected = true;
    cat.appendChild(opt);
  });
  cat.addEventListener("change", () => recategorize(h.id, cat.value));

  const open = document.createElement("button");
  open.className = "hist-open";
  open.textContent = "Öffnen";
  open.addEventListener("click", () => restoreFromHistory(h.id));
  const del = document.createElement("button");
  del.className = "del";
  del.innerHTML = "&times;";
  del.title = "Aus Verlauf entfernen";
  del.setAttribute("aria-label", "Aus Verlauf entfernen");
  del.addEventListener("click", () => deleteFromHistory(h.id));
  actions.append(cat, open, del);

  item.append(main, win, actions);
  return item;
}

function renderHistory() {
  historyList.innerHTML = "";
  if (history.length === 0) {
    const e = document.createElement("div");
    e.className = "empty";
    e.textContent =
      "Noch keine gespeicherten Entscheidungen. Mit „★ Im Verlauf speichern“ hältst du den aktuellen Stand fest.";
    historyList.appendChild(e);
    return;
  }

  // Nach Kategorie gruppieren; Gruppen-Reihenfolge = zuletzt genutzte zuerst
  // (history ist bereits neueste-zuerst sortiert).
  const groups = new Map();
  history.forEach((h) => {
    const cat = CATEGORIES.includes(h.category) ? h.category : "Sonstiges";
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat).push(h);
  });

  for (const [cat, entries] of groups) {
    const header = document.createElement("div");
    header.className = "hist-group";
    header.innerHTML = `<span class="hist-group-name">${escapeHtml(cat)}</span><span class="hist-group-count">${entries.length}</span>`;
    historyList.appendChild(header);
    entries.forEach((h) => historyList.appendChild(buildHistItem(h)));
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));
}

document.getElementById("saveHist").addEventListener("click", saveCurrentToHistory);

/* ---------------- Sprache → Vorschläge --------------------------- */

function setStatus(msg, kind = "") {
  askStatus.textContent = msg || "";
  askStatus.className = "ask-status" + (kind ? " " + kind : "");
}

// Aus einer generierten Struktur den App-Zustand bauen (Punkte neutral = 5).
function applySuggestion(data) {
  const options = (data.options || []).map((o) => String(o)).filter(Boolean);
  const criteria = (data.criteria || [])
    .map((c) => ({
      name: String(c.name || "").trim(),
      weight: clampNum(c.weight, 0, 10),
      scores: options.map(() => 5),
    }))
    .filter((c) => c.name);

  if (options.length === 0 || criteria.length === 0) {
    setStatus("Konnte daraus keine Matrix ableiten – bitte konkreter formulieren.", "warn");
    return false;
  }
  state = { title: String(data.title || "Meine Entscheidung"), options, criteria };
  saveState();
  render();
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    gsap.from("#matrixCard, #resultCard", {
      y: 16,
      opacity: 0,
      duration: 0.5,
      stagger: 0.08,
      ease: "power3.out",
    });
  }
  return true;
}

/**
 * Lokaler Fallback ohne KI: erkennt Optionen im Satz ("A oder B", "A, B, C",
 * "A vs. B", "A / B") und schlägt generische, breit anwendbare Kriterien vor.
 */
function localHeuristic(text) {
  const raw = text.trim();
  let core = raw
    // Satz-Einleitung entfernen: "<Verb> ich …", "was ist besser", "welche …"
    .replace(/^\s*(\p{L}+\s+ich|was\s+ist\s+besser|welche[srn]?)\b[:,]?/iu, "")
    .replace(/[?.!]+\s*$/, "")
    .trim();

  let options = [];
  const orMatch = core.split(/\s+(?:oder|vs\.?|versus)\s+|(?:\s*[,/]\s*)|\s+\/\s+/i);
  if (orMatch.length >= 2) {
    options = orMatch.map((s) => s.trim()).filter(Boolean);
  }
  // "zwischen X und Y"
  const between = core.match(/zwischen\s+(.+?)\s+und\s+(.+)/i);
  if (options.length < 2 && between) {
    options = [between[1].trim(), between[2].trim()];
  }
  options = options
    .map((o) =>
      o
        .replace(/^(nach|in|im|zu|zum|zur|auf|für|bei|mit)\s+/i, "") // Präposition vorne
        .replace(/^(der|die|das|den|dem|ein(e|en|em|er|es)?)\s+/i, "") // Artikel vorne
        .replace(/\s+(kaufen|nehmen|wählen|machen|buchen|mieten|holen|fahren|gehen)$/i, "") // Verb hinten
        .trim()
    )
    .filter((o) => o.length > 0 && o.length < 60)
    .slice(0, 5);
  if (options.length < 2) options = ["Option A", "Option B", "Option C"];

  const criteria = [
    { name: "Nutzen", weight: 5 },
    { name: "Kosten / Aufwand", weight: 4 },
    { name: "Risiko", weight: 3 },
    { name: "Zeit", weight: 3 },
    { name: "Bauchgefühl", weight: 2 },
  ];

  return {
    title: raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : "Meine Entscheidung",
    options,
    criteria,
  };
}

async function generate(text) {
  const transcript = (text || "").trim();
  if (!transcript) {
    setStatus("Sag oder schreib zuerst einen Satz.", "warn");
    askInput.focus();
    return;
  }
  genBtn.disabled = true;
  micBtn.disabled = true;
  setStatus("Erzeuge Vorschläge …", "busy");

  let data = null;
  try {
    const resp = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript }),
    });
    if (resp.ok) {
      data = await resp.json();
    }
  } catch {
    /* Netzwerk/kein Backend → Fallback unten */
  }

  let usedAi = true;
  if (!data || !Array.isArray(data.options) || data.options.length === 0) {
    usedAi = false;
    data = localHeuristic(transcript);
  }

  // Kategorie merken: KI-Wert bevorzugen, sonst lokal klassifizieren.
  suggestedCategory =
    data.category && CATEGORIES.includes(data.category)
      ? data.category
      : categorize(`${transcript} ${(data.options || []).join(" ")}`);

  const ok = applySuggestion(data);
  genBtn.disabled = false;
  micBtn.disabled = false;
  if (ok) {
    setStatus(usedAi ? "Von Claude erzeugt – jetzt Punkte 0–10 vergeben." : "Ohne KI erzeugt – Vorschläge sind einfach gehalten.", usedAi ? "ok" : "warn");
  }
}

genBtn.addEventListener("click", () => generate(askInput.value));
askInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    generate(askInput.value);
  }
});

/* ---- Spracheingabe (Web Speech API) ---- */
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
  const recog = new SpeechRecognition();
  recog.lang = "de-DE";
  recog.interimResults = true;
  recog.continuous = false;
  let listening = false;

  micBtn.addEventListener("click", () => {
    if (listening) {
      recog.stop();
      return;
    }
    try {
      recog.start();
    } catch {
      /* start() wirft, wenn bereits aktiv – ignorieren */
    }
  });

  recog.addEventListener("start", () => {
    listening = true;
    micBtn.classList.add("listening");
    setStatus("Ich höre zu … sprich jetzt.", "busy");
  });
  recog.addEventListener("result", (e) => {
    let text = "";
    for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
    askInput.value = text.trim();
  });
  recog.addEventListener("error", (e) => {
    listening = false;
    micBtn.classList.remove("listening");
    if (e.error === "not-allowed" || e.error === "service-not-allowed") {
      setStatus("Mikrofon-Zugriff wurde blockiert – bitte tippen.", "warn");
    } else if (e.error !== "aborted") {
      setStatus("Spracheingabe nicht möglich – bitte tippen.", "warn");
    }
  });
  recog.addEventListener("end", () => {
    listening = false;
    micBtn.classList.remove("listening");
    if (askInput.value.trim()) {
      setStatus("Erkannt – tippe zum Korrigieren oder erzeuge Vorschläge.", "");
      generate(askInput.value);
    } else if (askStatus.classList.contains("busy")) {
      setStatus("Nichts erkannt – bitte erneut versuchen oder tippen.", "warn");
    }
  });
} else {
  // Browser ohne Spracherkennung: Mikrofon-Button ausblenden, Texteingabe bleibt.
  micBtn.style.display = "none";
  askInput.placeholder = "Tippe deine Entscheidung, z. B. „Laptop A oder B?“";
}

/* ---------------- Erst-Render + Intro-Animation ------------------- */

render();
renderHistory();

if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
  intro
    .from(".topbar", { y: -14, opacity: 0, duration: 0.5 })
    .from(".eyebrow", { y: 12, opacity: 0, duration: 0.4 }, "-=0.2")
    .from("h1", { y: 18, opacity: 0, duration: 0.55 }, "-=0.25")
    .from(".lead", { y: 14, opacity: 0, duration: 0.45 }, "-=0.35")
    .from("#askCard", { y: 16, opacity: 0, duration: 0.5 }, "-=0.2")
    .from(".toolbar button", { y: 12, opacity: 0, duration: 0.35, stagger: 0.05 }, "-=0.25")
    .from("#matrixCard", { y: 22, opacity: 0, duration: 0.5 }, "-=0.15")
    .from("#resultCard", { y: 22, opacity: 0, duration: 0.5 }, "-=0.35")
    .from("#historyCard", { y: 22, opacity: 0, duration: 0.5 }, "-=0.4");
}
