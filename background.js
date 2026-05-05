chrome.runtime.onInstalled.addListener((details) => {
  console.log("Interacto Extension installed/updated:", details.reason);
});

// Allow users to open the side panel by clicking the action icon
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));