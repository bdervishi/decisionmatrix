/**
 * Zentrale Konfiguration.
 *
 * In der Web-App gelten die Defaults (relatives Backend, aktuelle Seite als
 * Share-Basis). Die spätere Browser-Extension importiert `config` und
 * überschreibt die Werte einmalig beim Start (z. B. gehostetes Backend,
 * Share-Links auf die öffentliche Web-App).
 */
export const config = {
  // Endpoint der KI-Vorschlagsfunktion. Relativ = gleiche Origin wie die App.
  backendUrl: "/api/generate",
  // Basis-URL für Teilen-Links. null => aktuelle Seite (location.origin + pathname).
  shareBaseUrl: null,
};

/** localStorage-/chrome.storage-Schlüssel. */
export const STORAGE_KEYS = {
  state: "decisionmatrix_state_v1",
  theme: "decisionmatrix_theme",
  history: "decisionmatrix_history_v1",
};
