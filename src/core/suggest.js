/** KI-Vorschläge (Backend) und lokaler Heuristik-Fallback. */
import { config } from "./config.js";
import { CATEGORIES, categorize } from "./categorize.js";

/**
 * Ruft die Vorschlagsfunktion des Backends auf. Gibt die geparste Antwort
 * zurück oder null (Netzwerkfehler / kein Backend / Nicht-OK-Status).
 * Die `backendUrl` ist injizierbar, damit die Extension einen absoluten
 * Endpoint setzen kann.
 */
export async function requestSuggestion(transcript, backendUrl = config.backendUrl) {
  if (!backendUrl) return null; // kein Backend konfiguriert → direkt Fallback
  try {
    const resp = await fetch(backendUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript }),
    });
    if (resp.ok) return await resp.json();
  } catch {
    /* Netzwerk/kein Backend → Aufrufer nutzt Fallback */
  }
  return null;
}

/**
 * Lokaler Fallback ohne KI: erkennt Optionen im Satz ("A oder B", "A, B, C",
 * "A vs. B", "A / B", "zwischen X und Y") und schlägt generische Kriterien vor.
 */
export function localHeuristic(text) {
  const raw = text.trim();
  const core = raw
    .replace(/^\s*(\p{L}+\s+ich|was\s+ist\s+besser|welche[srn]?)\b[:,]?/iu, "")
    .replace(/[?.!]+\s*$/, "")
    .trim();

  let options = [];
  const orMatch = core.split(/\s+(?:oder|vs\.?|versus)\s+|(?:\s*[,/]\s*)|\s+\/\s+/i);
  if (orMatch.length >= 2) {
    options = orMatch.map((s) => s.trim()).filter(Boolean);
  }
  const between = core.match(/zwischen\s+(.+?)\s+und\s+(.+)/i);
  if (options.length < 2 && between) {
    options = [between[1].trim(), between[2].trim()];
  }
  options = options
    .map((o) =>
      o
        .replace(/^(nach|in|im|zu|zum|zur|auf|für|bei|mit)\s+/i, "")
        .replace(/^(der|die|das|den|dem|ein(e|en|em|er|es)?)\s+/i, "")
        .replace(/\s+(kaufen|nehmen|wählen|machen|buchen|mieten|holen|fahren|gehen)$/i, "")
        .trim()
    )
    .filter((o) => o.length > 0 && o.length < 60)
    .slice(0, 5);
  if (options.length < 2) options = ["Option A", "Option B", "Option C"];

  const criteria = [
    { name: "Nutzen", weight: 5 },
    { name: "Kosten / Aufwand", weight: 4 },
    { name: "Risiko", weight: 3 },
    { name: "Zeit", weight: 3 },
    { name: "Bauchgefühl", weight: 2 },
  ];

  return {
    title: raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : "Meine Entscheidung",
    options,
    criteria,
  };
}

/** Kategorie bestimmen: KI-Wert bevorzugen, sonst lokal klassifizieren. */
export function pickCategory(data, transcript) {
  return data.category && CATEGORIES.includes(data.category)
    ? data.category
    : categorize(`${transcript} ${(data.options || []).join(" ")}`);
}
