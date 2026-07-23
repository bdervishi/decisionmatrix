/** Kleine, framework-unabhängige Helfer. */

export const clone = (o) => JSON.parse(JSON.stringify(o));

/** Zahl auf [lo, hi] begrenzen; ungültige Eingaben werden zu 0. */
export function clamp(v, lo, hi) {
  let n = Number(v);
  if (Number.isNaN(n)) n = 0;
  return Math.max(lo, Math.min(hi, n));
}

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));
}

export function slugify(s) {
  return (
    (s || "entscheidung")
      .toLowerCase()
      .replace(/[äöü]/g, (m) => ({ ä: "ae", ö: "oe", ü: "ue" }[m]))
      .replace(/ß/g, "ss")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50) || "entscheidung"
  );
}

export function formatDate(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return "";
  return d.toLocaleDateString("de-CH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Datei-Download im Browser (funktioniert auch auf Extension-Seiten). */
export function downloadFile(filename, content, mime) {
  const blob = new Blob(["﻿" + content], { type: mime + ";charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
