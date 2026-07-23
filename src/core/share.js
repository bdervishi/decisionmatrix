/** Entscheidung als teilbaren Link kodieren/dekodieren. */
import { clamp } from "./util.js";
import { config } from "./config.js";

export function encodeState(s) {
  const json = JSON.stringify({ title: s.title, options: s.options, criteria: s.criteria });
  return btoa(unescape(encodeURIComponent(json)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function decodeState(str) {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const json = decodeURIComponent(escape(atob(b64)));
  const data = JSON.parse(json);
  if (!Array.isArray(data.options) || !Array.isArray(data.criteria)) throw new Error("bad");
  return data;
}

/** Rohdaten aus einem Link in einen vollständigen, bereinigten Zustand überführen. */
export function normalizeShared(data) {
  return {
    title: String(data.title || "Geteilte Entscheidung"),
    options: data.options.map((o) => String(o)),
    criteria: data.criteria.map((c) => ({
      name: String(c.name || ""),
      weight: clamp(c.weight, 0, 10),
      scores: (Array.isArray(c.scores) ? c.scores : []).map((s) => clamp(s, 0, 10)),
    })),
  };
}

/** Vollständigen Teilen-Link bauen. Basis: config.shareBaseUrl oder aktuelle Seite. */
export function buildShareUrl(state) {
  const base = config.shareBaseUrl || `${location.origin}${location.pathname}`;
  return `${base}#d=${encodeState(state)}`;
}
