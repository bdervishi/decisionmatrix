/** Service-Worker / Background: Kontextmenü + Side-Panel-Öffnung (cross-browser). */

const api = globalThis.browser || globalThis.chrome;
const MENU_ID = "dm-decide";

api.runtime.onInstalled.addListener(() => {
  api.contextMenus.create({
    id: MENU_ID,
    title: 'Als Entscheidung öffnen: „%s“',
    contexts: ["selection"],
  });
});

api.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== MENU_ID) return;
  try {
    await api.storage.session.set({ pendingTranscript: info.selectionText || "" });
  } catch {
    /* storage.session evtl. nicht verfügbar */
  }
  try {
    if (api.sidePanel && api.sidePanel.open && tab && tab.windowId != null) {
      await api.sidePanel.open({ windowId: tab.windowId }); // Chrome / Edge
    } else if (api.sidebarAction && api.sidebarAction.open) {
      await api.sidebarAction.open(); // Firefox
    }
  } catch {
    /* Öffnen fehlgeschlagen – ignorieren */
  }
});
