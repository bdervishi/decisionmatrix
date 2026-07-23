/**
 * Storage-Adapter.
 *
 * Web-App: nutzt `localStorage`. Fällt auf einen In-Memory-Store zurück, falls
 * localStorage gesperrt ist (Privatmodus, blockierte Cookies).
 *
 * Für die Browser-Extension (Phase 2) wird hier ein `chrome.storage`-Backend
 * ergänzt: Beim Start werden die Schlüssel einmal in einen Cache hydriert, damit
 * dieselbe synchrone Lese-Schnittstelle (`loadJSON`/`loadString`) erhalten bleibt;
 * Schreibvorgänge gehen zusätzlich write-through an `chrome.storage.local`.
 */

function localStorageBackend() {
  return {
    getString(key) {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    setString(key, val) {
      try {
        localStorage.setItem(key, val);
      } catch {
        /* Speicher gesperrt/voll – ignorieren */
      }
    },
  };
}

function memoryBackend() {
  const m = new Map();
  return {
    getString: (k) => (m.has(k) ? m.get(k) : null),
    setString: (k, v) => m.set(k, v),
  };
}

function pickBackend() {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.getItem("__dm_probe__");
      return localStorageBackend();
    }
  } catch {
    /* fällt auf memory zurück */
  }
  return memoryBackend();
}

const backend = pickBackend();

export const storage = {
  loadJSON(key, fallback = null) {
    const s = backend.getString(key);
    if (s == null) return fallback;
    try {
      return JSON.parse(s);
    } catch {
      return fallback;
    }
  },
  saveJSON(key, value) {
    backend.setString(key, JSON.stringify(value));
  },
  loadString(key) {
    return backend.getString(key);
  },
  saveString(key, value) {
    backend.setString(key, value);
  },
};
