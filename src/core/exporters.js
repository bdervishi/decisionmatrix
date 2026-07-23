/** CSV-Export (reine String-Erzeugung, kein DOM). */
import { formatDate } from "./util.js";
import { ranking } from "./matrix.js";

function csvCell(v) {
  const s = String(v ?? "");
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function csvRow(cells) {
  return cells.map(csvCell).join(";");
}

/** Aktuelle Matrix als CSV: Kriterien × Optionen + Rangliste. */
export function decisionCsv(state) {
  const rows = [];
  rows.push(csvRow(["Entscheidung", state.title || "Meine Entscheidung"]));
  rows.push("");
  rows.push(csvRow(["Kriterium", "Gewicht", ...state.options]));
  state.criteria.forEach((c) => {
    rows.push(csvRow([c.name, c.weight, ...state.options.map((_, oi) => c.scores[oi] ?? "")]));
  });
  rows.push("");
  rows.push(csvRow(["Ergebnis (0–100)", ""]));
  ranking(state).forEach((r, i) => {
    rows.push(csvRow([`${i + 1}. ${r.name}`, r.score.toFixed(1)]));
  });
  return rows.join("\n");
}

/** Kompletten Verlauf als CSV. */
export function historyCsv(history) {
  const rows = [csvRow(["Datum", "Kategorie", "Titel", "Gewinner", "Score", "Optionen"])];
  history.forEach((h) => {
    rows.push(
      csvRow([
        formatDate(h.date),
        h.category || "Sonstiges",
        h.title,
        h.winner,
        h.winnerScore.toFixed(1),
        h.optionCount,
      ])
    );
  });
  return rows.join("\n");
}
