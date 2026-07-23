/** Kategorien und lokaler Keyword-Klassifikator. */

export const CATEGORIES = [
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

export function categorize(text) {
  const t = (text || "").toLowerCase();
  for (const [cat, words] of CATEGORY_KEYWORDS) {
    if (words.some((w) => t.includes(w))) return cat;
  }
  return "Sonstiges";
}
