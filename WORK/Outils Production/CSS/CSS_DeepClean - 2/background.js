// background.js: Creates the context menu and sends a message to the content script.

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "deep-clean-css",
    title: "✨ DeepClean CSS",
    contexts: ["all"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "deep-clean-css") {
    // Send a message to the content script in the active tab
    chrome.tabs.sendMessage(tab.id, {
      type: "DEEP_CLEAN_INIT"
    });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "DEEP_CLEAN_RESIZE_WINDOW") {
    chrome.windows.getCurrent((win) => {
      chrome.windows.update(win.id, {
        width: message.width,
        height: win.height // Keep current height
      }, () => sendResponse({ success: true }));
    });
    return true; // Keep channel open for async response
  }
});
