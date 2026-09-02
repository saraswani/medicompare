// Background Service Worker for MediCompare Chrome Extension (Manifest V3)
const API_BASE = 'http://localhost:3001';

// Handle messages from content script or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      if (message.type === 'SEARCH_MEDICINE') {
        const res = await fetch(`${API_BASE}/api/search?q=${encodeURIComponent(message.query)}&limit=5`);
        if (!res.ok) throw new Error('Search failed');
        const data = await res.json();
        sendResponse({ success: true, data });
      } 
      else if (message.type === 'GET_COMPARISON') {
        const res = await fetch(`${API_BASE}/api/medicine/${encodeURIComponent(message.medicineId)}`);
        if (!res.ok) throw new Error('Comparison lookup failed');
        const data = await res.json();
        sendResponse({ success: true, data });
      }
      else if (message.type === 'SAVE_SWAP') {
        const { savedSwaps = [] } = await chrome.storage.local.get('savedSwaps');
        const updated = [message.swap, ...savedSwaps.filter(s => s.alternative.id !== message.swap.alternative.id)];
        await chrome.storage.local.set({ savedSwaps: updated });
        sendResponse({ success: true, count: updated.length });
      }
      else if (message.type === 'GET_SAVED_SWAPS') {
        const { savedSwaps = [] } = await chrome.storage.local.get('savedSwaps');
        sendResponse({ success: true, savedSwaps });
      }
    } catch (err) {
      console.error('Service Worker Error:', err);
      sendResponse({ success: false, error: err.message });
    }
  })();

  return true; // Keep message channel open for async response
});
