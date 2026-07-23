/**
 * Direkter Aufruf der Anthropic-API aus dem Browser (BYO-Key-Pfad der Extension).
 *
 * Verwendet das offizielle SDK im Browser-Modus (`dangerouslyAllowBrowser: true`).
 * Das SDK setzt dann den Header `anthropic-dangerous-direct-browser-access: true`,
 * der CORS-Aufrufe gegen api.anthropic.com erlaubt.
 *
 * Sicherheitshinweis: Der Schlüssel liegt lokal in der Extension und wird direkt
 * zu Anthropic gesendet. Das ist bequem für den Einzelnutzer, aber weniger sicher
 * als das serverseitige Backend (dort verlässt der Key nie den Server).
 */
import Anthropic from "@anthropic-ai/sdk";
import { MODEL, SCHEMA, SYSTEM, sanitize } from "./prompt.js";

/**
 * Erzeugt Vorschläge direkt über Claude mit dem angegebenen API-Key.
 * Gibt `{ title, category, options, criteria }` zurück oder null bei Fehler,
 * damit der Aufrufer auf die lokale Heuristik zurückfallen kann.
 */
export async function generateWithKey(transcript, apiKey) {
  const text = (transcript || "").trim();
  if (!apiKey || !text) return null;
  try {
    const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      output_config: {
        effort: "medium",
        format: { type: "json_schema", schema: SCHEMA },
      },
      system: SYSTEM,
      messages: [{ role: "user", content: text }],
    });

    const out = response.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("");

    return sanitize(JSON.parse(out));
  } catch {
    return null;
  }
}
