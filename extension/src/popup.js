/** Popup: Schnellstart — Side Panel öffnen, letzte Entscheidungen, Einstellungen. */
import "./popup.css";
import { storage } from "../../src/core/storage.js";
import { STORAGE_KEYS } from "../../src/core/config.js";
import { formatDate } from "../../src/core/util.js";

const api = globalThis.browser || globalThis.chrome;

async function openSidePanel() {
  try {
    if (api.sidePanel && api.sidePanel.open) {
      // Chrome / Edge
      const win = await api.windows.getCurrent();
      await api.sidePanel.open({ windowId: win.id });
    } else if (api.sidebarAction && api.sidebarAction.open) {
      // Firefox
      await api.sidebarAction.open();
    } else {
      throw new Error("keine Side-Panel-API");
    }
    window.close();
  } catch {
    // Fallback: Vollseite im Tab öffnen.
    api.tabs.create({ url: api.runtime.getURL("sidepanel.html") });
    window.close();
  }
}

document.getElementById("openPanel").addEventListener("click", openSidePanel);
document.getElementById("openOptions").addEventListener("click", () => {
  api.runtime.openOptionsPage();
  window.close();
});

// Letzte Entscheidungen aus dem geteilten Extension-Storage anzeigen.
const recent = document.getElementById("recent");
const history = storage.loadJSON(STORAGE_KEYS.history, []);
const list = Array.isArray(history) ? history.slice(0, 3) : [];

if (list.length === 0) {
  const e = document.createElement("div");
  e.className = "pop-empty";
  e.textContent = "Noch keine gespeicherten Entscheidungen.";
  recent.appendChild(e);
} else {
  list.forEach((h) => {
    const b = document.createElement("button");
    b.className = "pop-item";
    b.innerHTML = `${escapeText(h.title)}<br><small>${escapeText(h.category || "")} · ${formatDate(h.date)}</small>`;
    b.addEventListener("click", openSidePanel);
    recent.appendChild(b);
  });
}

function escapeText(s) {
  const d = document.createElement("div");
  d.textContent = String(s ?? "");
  return d.innerHTML;
}
