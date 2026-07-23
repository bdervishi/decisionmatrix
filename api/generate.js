import Anthropic from "@anthropic-ai/sdk";

/**
 * Vercel Serverless Function: /api/generate
 *
 * Nimmt einen gesprochenen/geschriebenen Satz entgegen und erzeugt daraus
 * per Claude eine Entscheidungsstruktur: Titel, Optionen und gewichtete
 * Kriterien. Der API-Key liegt serverseitig (ANTHROPIC_API_KEY) und wird
 * nie an den Browser gegeben.
 *
 * Ohne gesetzten Key antwortet die Funktion mit 503 { error: "no_key" },
 * damit der Client auf den lokalen Heuristik-Modus zurückfällt.
 */

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

const SCHEMA = {
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

const SYSTEM = `Du hilfst dabei, eine gewichtete Entscheidungsmatrix aufzubauen.
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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: "no_key" });
  }

  const body = typeof req.body === "string" ? safeParse(req.body) : req.body || {};
  const transcript = (body.transcript || "").toString().trim();
  if (!transcript) {
    return res.status(400).json({ error: "empty_transcript" });
  }
  if (transcript.length > 800) {
    return res.status(400).json({ error: "too_long" });
  }

  try {
    const client = new Anthropic();
    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 1024,
      output_config: {
        effort: "medium",
        format: { type: "json_schema", schema: SCHEMA },
      },
      system: SYSTEM,
      messages: [{ role: "user", content: transcript }],
    });

    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("");

    const data = JSON.parse(text);
    return res.status(200).json(sanitize(data));
  } catch (err) {
    const status = err?.status === 429 ? 429 : 502;
    return res.status(status).json({ error: "generation_failed" });
  }
}

function safeParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}

/** Grenzen absichern, damit die UI nie mit Extremwerten überflutet wird. */
function sanitize(data) {
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, Math.round(Number(n) || 0)));
  const options = (Array.isArray(data.options) ? data.options : [])
    .map((o) => String(o).slice(0, 80))
    .filter(Boolean)
    .slice(0, 6);
  const criteria = (Array.isArray(data.criteria) ? data.criteria : [])
    .map((c) => ({ name: String(c?.name || "").slice(0, 80), weight: clamp(c?.weight, 1, 5) }))
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
