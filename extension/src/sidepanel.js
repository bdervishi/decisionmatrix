/**
 * Side-Panel-Einstiegspunkt.
 *
 * 1. Extension-Einstellungen in die Kern-Konfiguration übernehmen.
 * 2. Vollständige Matrix-UI der Web-App starten (dynamischer Import, damit die
 *    Konfiguration vor dem UI-Start gesetzt ist).
 * 3. Falls über das Kontextmenü markierter Text übergeben wurde: Eingabefeld
 *    vorbefüllen.
 */
import { applySettingsToConfig } from "./ext-settings.js";

applySettingsToConfig();

await import("../../src/main.js");

// Über das Kontextmenü übergebenen Text ins Eingabefeld übernehmen.
try {
  const { pendingTranscript } = await chrome.storage.session.get("pendingTranscript");
  if (pendingTranscript) {
    await chrome.storage.session.remove("pendingTranscript");
    const inp = document.getElementById("askInput");
    if (inp) {
      inp.value = pendingTranscript;
      inp.focus();
    }
  }
} catch {
  /* chrome.storage.session evtl. nicht verfügbar – ignorieren */
}
