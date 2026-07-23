import gsap from "gsap";
import "./style.css";

/* ------------------------------------------------------------------ *
 *  Gewichtete Entscheidungsmatrix
 *  Reine Client-App: Zustand in localStorage, Animationen via GSAP.
 * ------------------------------------------------------------------ */

const KEY = "decisionmatrix_state_v1";
const THEME_KEY = "decisionmatrix_theme";

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
      <p class="lead">Lege deine Optionen und Kriterien fest, gib jedem Kriterium ein Gewicht und
        bewerte jede Option von&nbsp;0–10. Die Matrix rechnet die gewichtete Gesamtpunktzahl
        live aus und markiert die beste Wahl. Klicke auf die Überschrift, um sie umzubenennen.</p>
    </header>

    <div class="toolbar">
      <button class="primary" id="addOpt">+ Option</button>
      <button id="addCrit">+ Kriterium</button>
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

    <footer>Alles wird lokal in deinem Browser gespeichert · Namen &amp; Titel per Klick anpassbar</footer>
  </div>
`;

const headRow = document.getElementById("headRow");
const body = document.getElementById("body");
const results = document.getElementById("results");
const titleField = document.getElementById("titleField");

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
  saveState();
  render();
});
document.getElementById("clearAll").addEventListener("click", () => {
  state = { title: "Meine Entscheidung", options: [], criteria: [] };
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

/* ---------------- Erst-Render + Intro-Animation ------------------- */

render();

if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
  intro
    .from(".topbar", { y: -14, opacity: 0, duration: 0.5 })
    .from(".eyebrow", { y: 12, opacity: 0, duration: 0.4 }, "-=0.2")
    .from("h1", { y: 18, opacity: 0, duration: 0.55 }, "-=0.25")
    .from(".lead", { y: 14, opacity: 0, duration: 0.45 }, "-=0.35")
    .from(".toolbar button", { y: 12, opacity: 0, duration: 0.35, stagger: 0.05 }, "-=0.25")
    .from("#matrixCard", { y: 22, opacity: 0, duration: 0.5 }, "-=0.15")
    .from("#resultCard", { y: 22, opacity: 0, duration: 0.5 }, "-=0.35");
}
