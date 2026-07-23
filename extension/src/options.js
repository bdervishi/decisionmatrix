/** Options-Seite: Backend- und Share-URL speichern. */
import "./options.css";
import { loadSettings, saveSettings } from "./ext-settings.js";

const backendUrl = document.getElementById("backendUrl");
const shareBaseUrl = document.getElementById("shareBaseUrl");
const status = document.getElementById("status");

const s = loadSettings();
backendUrl.value = s.backendUrl || "";
shareBaseUrl.value = s.shareBaseUrl || "";

document.getElementById("save").addEventListener("click", () => {
  saveSettings({
    backendUrl: backendUrl.value.trim(),
    shareBaseUrl: shareBaseUrl.value.trim(),
  });
  status.textContent = "Gespeichert.";
  setTimeout(() => (status.textContent = ""), 2000);
});
