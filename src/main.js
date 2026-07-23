import gsap from "gsap";
import "./style.css";

import { STORAGE_KEYS } from "./core/config.js";
import { clone, clamp, escapeHtml, slugify, formatDate, downloadFile } from "./core/util.js";
import { storage } from "./core/storage.js";
import { EXAMPLE, emptyState, totalWeight, optionScore, ranking } from "./core/matrix.js";
import { CATEGORIES, categorize } from "./core/categorize.js";
import { getSuggestion, localHeuristic, pickCategory } from "./core/suggest.js";
import { decodeState, normalizeShared, buildShareUrl } from "./core/share.js";
import { decisionCsv, historyCsv } from "./core/exporters.js";
import {
  HISTORY_LIMIT,
  makeHistoryEntry,
  filterHistory,
  groupByCategory,
} from "./core/history.js";

/* ------------------------------------------------------------------ *
 *  Gewichtete Entscheidungsmatrix — UI-Schicht.
 *  Die gesamte Logik liegt in ./core/*, hier nur DOM, Events, Animation.
 * ------------------------------------------------------------------ */

let state = storage.loadJSON(STORAGE_KEYS.state) || clone(EXAMPLE);
if (!state.title) state.title = EXAMPLE.title;

function saveState() {
  storage.saveJSON(STORAGE_KEYS.state, state);
}

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
      <span class="tb-sep" aria-hidden="true"></span>
      <button id="shareBtn">🔗 Teilen</button>
      <button id="csvBtn">CSV</button>
      <button id="pdfBtn">PDF</button>
      <span class="tb-sep" aria-hidden="true"></span>
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
      <div class="hist-controls">
        <input type="search" id="histSearch" autocomplete="off" placeholder="Verlauf durchsuchen …" />
        <select id="histFilter" aria-label="Nach Kategorie filtern">
          <option value="">Alle Kategorien</option>
        </select>
        <button class="ghost" id="histCsv">Verlauf als CSV</button>
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
const histSearch = document.getElementById("histSearch");
const histFilter = document.getElementById("histFilter");

CATEGORIES.forEach((c) => {
  const opt = document.createElement("option");
  opt.value = c;
  opt.textContent = c;
  histFilter.appendChild(opt);
});

/* ---------------------------- Theme ------------------------------- */

function applyTheme(mode) {
  if (mode === "light" || mode === "dark") {
    document.documentElement.setAttribute("data-theme", mode);
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
}
(function initTheme() {
  const saved = storage.loadString(STORAGE_KEYS.theme);
  if (saved) applyTheme(saved);
})();
document.getElementById("themeToggle").addEventListener("click", () => {
  const isDark =
    document.documentElement.getAttribute("data-theme") === "dark" ||
    (!document.documentElement.getAttribute("data-theme") &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  const next = isDark ? "light" : "dark";
  applyTheme(next);
  storage.saveString(STORAGE_KEYS.theme, next);
});

/* ---------------------------- Render ------------------------------ */

function render() {
  titleField.textContent = state.title;

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

  body.innerHTML = "";
  const tw = totalWeight(state);

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
      c.weight = clamp(wInp.value, 0, 10);
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
        c.scores[oi] = s.value === "" ? 0 : clamp(s.value, 0, 10);
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

  if (state.options.length === 0 || state.criteria.length === 0 || totalWeight(state) <= 0) {
    const e = document.createElement("div");
    e.className = "empty";
    e.style.padding = "0";
    e.textContent =
      "Sobald Optionen, Kriterien und Gewichte gesetzt sind, erscheint hier die Rangliste.";
    results.appendChild(e);
    return;
  }

  const ranked = ranking(state);
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

document.getElementById("addOpt").addEventListener("click", addOption);
document.getElementById("addCrit").addEventListener("click", addCriterion);
document.getElementById("loadExample").addEventListener("click", () => {
  state = clone(EXAMPLE);
  suggestedCategory = null;
  saveState();
  render();
});
document.getElementById("clearAll").addEventListener("click", () => {
  state = emptyState();
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

let history = storage.loadJSON(STORAGE_KEYS.history, []);
if (!Array.isArray(history)) history = [];
let suggestedCategory = null;
let histQuery = "";
let histCatFilter = "";

function persistHistory() {
  storage.saveJSON(STORAGE_KEYS.history, history);
}

function saveCurrentToHistory() {
  if (state.options.length === 0 || state.criteria.length === 0 || totalWeight(state) <= 0) {
    setStatus("Erst Optionen, Kriterien und Gewichte setzen, dann speichern.", "warn");
    return;
  }
  const category =
    suggestedCategory && CATEGORIES.includes(suggestedCategory)
      ? suggestedCategory
      : categorize(`${state.title} ${state.options.join(" ")}`);
  const entry = makeHistoryEntry(state, ranking(state), category);
  history.unshift(entry);
  if (history.length > HISTORY_LIMIT) history = history.slice(0, HISTORY_LIMIT);
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

  const filtered = filterHistory(history, histQuery, histCatFilter);
  if (filtered.length === 0) {
    const e = document.createElement("div");
    e.className = "empty";
    e.textContent = "Keine Einträge passen zu Suche/Filter.";
    historyList.appendChild(e);
    return;
  }

  for (const [cat, entries] of groupByCategory(filtered)) {
    const header = document.createElement("div");
    header.className = "hist-group";
    header.innerHTML = `<span class="hist-group-name">${escapeHtml(cat)}</span><span class="hist-group-count">${entries.length}</span>`;
    historyList.appendChild(header);
    entries.forEach((h) => historyList.appendChild(buildHistItem(h)));
  }
}

document.getElementById("saveHist").addEventListener("click", saveCurrentToHistory);

histSearch.addEventListener("input", () => {
  histQuery = histSearch.value.trim().toLowerCase();
  renderHistory();
});
histFilter.addEventListener("change", () => {
  histCatFilter = histFilter.value;
  renderHistory();
});

/* ---------------- Export (CSV / PDF) ----------------------------- */

document.getElementById("csvBtn").addEventListener("click", () => {
  if (state.options.length === 0 || state.criteria.length === 0) {
    setStatus("Nichts zu exportieren – erst Optionen und Kriterien anlegen.", "warn");
    return;
  }
  downloadFile(`${slugify(state.title)}.csv`, decisionCsv(state), "text/csv");
});

document.getElementById("histCsv").addEventListener("click", () => {
  if (history.length === 0) {
    setStatus("Der Verlauf ist noch leer.", "warn");
    return;
  }
  downloadFile("entscheidungs-verlauf.csv", historyCsv(history), "text/csv");
});

document.getElementById("pdfBtn").addEventListener("click", () => {
  if (state.options.length === 0 || state.criteria.length === 0) {
    setStatus("Nichts zu exportieren – erst Optionen und Kriterien anlegen.", "warn");
    return;
  }
  window.print();
});

/* ---------------- Teilen per Link -------------------------------- */

function shareLink() {
  if (state.options.length === 0 || state.criteria.length === 0) {
    setStatus("Nichts zu teilen – erst eine Entscheidung anlegen.", "warn");
    return;
  }
  const url = buildShareUrl(state);
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard
      .writeText(url)
      .then(() => setStatus("Link kopiert – zum Teilen einfügen.", "ok"))
      .catch(() => window.prompt("Zum Teilen kopieren:", url));
  } else {
    window.prompt("Zum Teilen kopieren:", url);
  }
}

document.getElementById("shareBtn").addEventListener("click", shareLink);

// Beim Laden: geteilte Entscheidung aus dem URL-Hash übernehmen (falls vorhanden).
function loadSharedFromHash() {
  const m = location.hash.match(/[#&]d=([^&]+)/);
  if (!m) return false;
  try {
    state = normalizeShared(decodeState(m[1]));
    saveState();
    window.history.replaceState(null, "", location.pathname + location.search);
    setStatus("Geteilte Entscheidung geladen.", "ok");
    return true;
  } catch {
    return false;
  }
}

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
      weight: clamp(c.weight, 0, 10),
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

  let data = await getSuggestion(transcript);

  let usedAi = true;
  if (!data || !Array.isArray(data.options) || data.options.length === 0) {
    usedAi = false;
    data = localHeuristic(transcript);
  }

  suggestedCategory = pickCategory(data, transcript);

  const ok = applySuggestion(data);
  genBtn.disabled = false;
  micBtn.disabled = false;
  if (ok) {
    setStatus(
      usedAi
        ? "Von Claude erzeugt – jetzt Punkte 0–10 vergeben."
        : "Ohne KI erzeugt – Vorschläge sind einfach gehalten.",
      usedAi ? "ok" : "warn"
    );
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
  micBtn.style.display = "none";
  askInput.placeholder = "Tippe deine Entscheidung, z. B. „Laptop A oder B?“";
}

/* ---------------- Erst-Render + Intro-Animation ------------------- */

loadSharedFromHash(); // geteilte Entscheidung ggf. übernehmen (vor dem Render)
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
