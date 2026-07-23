/** Zustandsmodell und Bewertungslogik der Matrix (reine Funktionen). */

export const EXAMPLE = {
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

export const emptyState = () => ({ title: "Meine Entscheidung", options: [], criteria: [] });

export const totalWeight = (state) =>
  state.criteria.reduce((s, c) => s + (Number(c.weight) || 0), 0);

/** Gewichteter Score einer Option, normiert auf 0..100 (max je Kriterium = 10). */
export function optionScore(state, oi) {
  const tw = totalWeight(state);
  if (tw <= 0) return 0;
  let sum = 0;
  state.criteria.forEach((c) => {
    const w = Number(c.weight) || 0;
    let v = Number(c.scores[oi]);
    if (Number.isNaN(v)) v = 0;
    sum += w * v;
  });
  return (sum / (tw * 10)) * 100;
}

/** Rangliste als [{name, score}] absteigend. */
export function ranking(state) {
  return state.options
    .map((name, oi) => ({ name: name || `Option ${oi + 1}`, score: optionScore(state, oi) }))
    .sort((a, b) => b.score - a.score);
}
