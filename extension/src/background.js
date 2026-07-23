/** Service-Worker: Kontextmenü + Side-Panel-Öffnung. */

const MENU_ID = "dm-decide";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: MENU_ID,
    title: 'Als Entscheidung öffnen: „%s“',
    contexts: ["selection"],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== MENU_ID) return;
  try {
    // Session-Storage auch für nicht-vertrauenswürdige Kontexte lesbar machen ist
    // nicht nötig – wir schreiben aus dem Worker und lesen im Side-Panel (beide vertrauenswürdig).
    await chrome.storage.session.set({ pendingTranscript: info.selectionText || "" });
    if (tab && tab.windowId != null) {
      await chrome.sidePanel.open({ windowId: tab.windowId });
    }
  } catch {
    /* Öffnen fehlgeschlagen – ignorieren */
  }
});
