/**
 * Ziel-abhängiges MV3-Manifest.
 *
 * Chrome/Edge: `side_panel` + `background.service_worker` (type: module).
 * Firefox:     `sidebar_action` + `background.scripts` + `browser_specific_settings.gecko`.
 */

const ICONS = {
  16: "icons/icon-16.png",
  32: "icons/icon-32.png",
  48: "icons/icon-48.png",
  128: "icons/icon-128.png",
};

export function buildManifest(target) {
  const base = {
    manifest_version: 3,
    name: "Entscheidungsmatrix",
    version: "1.0.0",
    description:
      "Gewichtete Entscheidungsmatrix — Optionen anhand gewichteter Kriterien vergleichen, mit Sprach-/KI-Vorschlägen, Verlauf, Kategorien, Export und Teilen.",
    action: {
      default_popup: "popup.html",
      default_title: "Entscheidungsmatrix",
      default_icon: ICONS,
    },
    options_page: "options.html",
    icons: ICONS,
  };

  if (target === "firefox") {
    return {
      ...base,
      permissions: ["storage", "contextMenus"],
      sidebar_action: {
        default_panel: "sidepanel.html",
        default_title: "Entscheidungsmatrix",
        default_icon: ICONS,
      },
      background: { scripts: ["background.js"] },
      browser_specific_settings: {
        gecko: {
          id: "entscheidungsmatrix@decisionmatrix.app",
          strict_min_version: "115.0",
        },
      },
    };
  }

  // chrome / edge (Chromium)
  return {
    ...base,
    permissions: ["storage", "sidePanel", "contextMenus"],
    side_panel: { default_path: "sidepanel.html" },
    background: { service_worker: "background.js", type: "module" },
  };
}
