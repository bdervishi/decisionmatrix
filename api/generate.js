import Anthropic from "@anthropic-ai/sdk";
import { MODEL, SCHEMA, SYSTEM, sanitize } from "../src/core/prompt.js";

/**
 * Vercel Serverless Function: /api/generate
 *
 * Nimmt einen gesprochenen/geschriebenen Satz entgegen und erzeugt daraus
 * per Claude eine Entscheidungsstruktur: Titel, Kategorie, Optionen und
 * gewichtete Kriterien. Der API-Key liegt serverseitig (ANTHROPIC_API_KEY)
 * und wird nie an den Browser gegeben.
 *
 * Prompt, Schema und Bereinigung sind in ../src/core/prompt.js gebündelt und
 * werden mit dem direkten Client-Aufruf der Extension geteilt.
 *
 * Ohne gesetzten Key antwortet die Funktion mit 503 { error: "no_key" },
 * damit der Client auf den lokalen Heuristik-Modus zurückfällt.
 */
export default async function handler(req, res) {
  // CORS: erlaubt Aufrufe aus der Browser-Extension (andere Origin).
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Max-Age", "86400");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
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
      model: MODEL,
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

    return res.status(200).json(sanitize(JSON.parse(text)));
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
