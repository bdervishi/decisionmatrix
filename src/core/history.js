/** Verlaufs-Logik (reine Funktionen): Eintrag bauen, filtern, gruppieren. */
import { clone } from "./util.js";
import { CATEGORIES } from "./categorize.js";

export const HISTORY_LIMIT = 50;

/** Neuen Verlaufs-Eintrag aus Zustand + Rangliste + Kategorie erzeugen. */
export function makeHistoryEntry(state, rankingList, category) {
  const winner = rankingList[0];
  return {
    id: "h_" + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36),
    date: new Date().toISOString(),
    title: state.title || "Meine Entscheidung",
    category,
    winner: winner ? winner.name : "",
    winnerScore: winner ? winner.score : 0,
    optionCount: state.options.length,
    snapshot: clone({ title: state.title, options: state.options, criteria: state.criteria }),
  };
}

/** Verlauf nach Suchtext und Kategorie filtern. */
export function filterHistory(history, query, category) {
  return history.filter((h) => {
    if (category && (h.category || "Sonstiges") !== category) return false;
    if (query) {
      const hay = `${h.title} ${h.winner} ${h.category}`.toLowerCase();
      if (!hay.includes(query)) return false;
    }
    return true;
  });
}

/** Nach Kategorie gruppieren; Gruppen-Reihenfolge = Reihenfolge des ersten Auftretens. */
export function groupByCategory(list) {
  const groups = new Map();
  list.forEach((h) => {
    const cat = CATEGORIES.includes(h.category) ? h.category : "Sonstiges";
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat).push(h);
  });
  return groups;
}
