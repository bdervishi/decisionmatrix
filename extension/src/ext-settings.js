/**
 * Extension-Einstellungen (Backend-URL, Share-Basis-URL).
 *
 * Speicherung über den Kern-Storage-Adapter. In Extension-Seiten teilen sich
 * Side Panel, Popup und Options dieselbe Origin (`chrome-extension://<id>`) und
 * damit denselben localStorage — die Einstellungen gelten also überall.
 */
import { storage } from "../../src/core/storage.js";
import { config } from "../../src/core/config.js";
import { generateWithKey } from "../../src/core/anthropicClient.js";

const SETTINGS_KEY = "decisionmatrix_ext_settings_v1";

export const DEFAULT_SETTINGS = {
  backendUrl: "", // z. B. https://<deployment>/api/generate ; leer = nur lokale Heuristik
  shareBaseUrl: "", // öffentliche Web-App für Teilen-Links, z. B. https://<deployment>/
  apiKey: "", // eigener Anthropic-Key (BYO); direkter Aufruf, wenn kein Backend gesetzt
};

export function loadSettings() {
  const s = storage.loadJSON(SETTINGS_KEY, {});
  return { ...DEFAULT_SETTINGS, ...(s && typeof s === "object" ? s : {}) };
}

export function saveSettings(settings) {
  storage.saveJSON(SETTINGS_KEY, { ...DEFAULT_SETTINGS, ...settings });
}

/** Einstellungen in die Kern-Konfiguration übernehmen. Vor dem UI-Start aufrufen. */
export function applySettingsToConfig() {
  const s = loadSettings();
  config.backendUrl = s.backendUrl || ""; // in der Extension kein relatives Default
  config.shareBaseUrl = s.shareBaseUrl || null;
  // BYO-Key nur nutzen, wenn kein gehostetes Backend gesetzt ist (Backend ist
  // sicherer – der Key verlässt dort nie den Server).
  if (s.apiKey && !s.backendUrl) {
    config.suggestProvider = (transcript) => generateWithKey(transcript, s.apiKey);
  } else {
    config.suggestProvider = null;
  }
  return s;
}
