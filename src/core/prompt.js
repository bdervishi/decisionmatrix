/**
 * Gemeinsamer Prompt, JSON-Schema und Bereinigung für die KI-Vorschläge.
 * Wird sowohl von der serverlosen Funktion (api/generate.js) als auch vom
 * direkten Client-Aufruf in der Extension (anthropicClient.js) verwendet.
 */
import { CATEGORIES } from "./categorize.js";

export const MODEL = "claude-opus-4-8";

export const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: {
      type: "string",
      description: "Kurzer Titel der Entscheidung, als Frage oder Aussage.",
    },
    category: {
      type: "string",
      enum: CATEGORIES,
      description: "Passende Kategorie der Entscheidung.",
    },
    options: {
      type: "array",
      description: "Die zu vergleichenden Optionen (konkret, unterscheidbar).",
      items: { type: "string" },
    },
    criteria: {
      type: "array",
      description: "Bewertungskriterien mit Wichtigkeits-Gewicht.",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string", description: "Name des Kriteriums." },
          weight: {
            type: "integer",
            description: "Wichtigkeit von 1 (gering) bis 5 (sehr wichtig).",
          },
        },
        required: ["name", "weight"],
      },
    },
  },
  required: ["title", "category", "options", "criteria"],
};

export const SYSTEM = `Du hilfst dabei, eine gewichtete Entscheidungsmatrix aufzubauen.
Der Nutzer beschreibt in einem Satz eine Entscheidung, die er treffen will.

Erzeuge daraus:
- title: eine kurze, treffende Überschrift der Entscheidung.
- category: die am besten passende Kategorie aus der vorgegebenen Liste.
- options: 2 bis 5 konkrete, klar unterscheidbare Optionen. Wenn der Satz
  Optionen nennt (z. B. "A oder B"), übernimm sie. Wenn nicht, schlage sinnvolle,
  realistische Optionen für dieses Thema vor.
- criteria: 3 bis 6 relevante Bewertungskriterien mit einem Gewicht von 1 bis 5,
  das die typische Wichtigkeit widerspiegelt (5 = sehr wichtig).

Antworte in derselben Sprache wie der Nutzer (Standard: Deutsch).
Halte Namen kurz und prägnant. Erfinde keine überflüssigen Kriterien.`;

/** Grenzen absichern, damit die UI nie mit Extremwerten überflutet wird. */
export function sanitize(data) {
  const clampInt = (n, lo, hi) => Math.max(lo, Math.min(hi, Math.round(Number(n) || 0)));
  const options = (Array.isArray(data.options) ? data.options : [])
    .map((o) => String(o).slice(0, 80))
    .filter(Boolean)
    .slice(0, 6);
  const criteria = (Array.isArray(data.criteria) ? data.criteria : [])
    .map((c) => ({ name: String(c?.name || "").slice(0, 80), weight: clampInt(c?.weight, 1, 5) }))
    .filter((c) => c.name)
    .slice(0, 8);
  const category = CATEGORIES.includes(data.category) ? data.category : "Sonstiges";
  return {
    title: String(data.title || "Meine Entscheidung").slice(0, 120),
    category,
    options,
    criteria,
  };
}
