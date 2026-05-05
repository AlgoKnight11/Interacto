// Interacto - Content Script
console.log("Interacto content script loaded.");

// Listen for messages from popup if advanced extraction is needed
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractPageData') {
    try {
      const data = {
        title: document.title,
        url: window.location.href,
        text: document.body.innerText.slice(0, 6000)
      };
      sendResponse({ success: true, data });
    } catch (error) {
      console.error('Error extracting page data:', error);
      sendResponse({ success: false, error: error.message });
    }
  }
  return true;
});
