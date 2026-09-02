// MediCompare Content Script - Auto Generic Detector on Indian Online Pharmacies
(async function() {
  // Extract potential medicine name from e-pharmacy product title
  function detectMedicineName() {
    // 1mg title selector
    let titleEl = document.querySelector('h1[class*="DrugHeader__title"], h1[class*="style__pro-title"], h1');
    if (!titleEl) return null;
    
    let text = titleEl.innerText.trim();
    // Clean strings like "Dolo 650 Tablet 15'S" -> "Dolo 650"
    let clean = text.replace(/tablets?|capsules?|strip|bottle|syrup|\d+'s|\(.*?\)/gi, '').trim();
    return clean.split(/\s+/).slice(0, 3).join(' ');
  }

  const medName = detectMedicineName();
  if (!medName || medName.length < 3) return;

  // Search background for matching generic alternatives
  chrome.runtime.sendMessage({ type: 'SEARCH_MEDICINE', query: medName }, async (response) => {
    if (!response || !response.success || !response.data || !response.data.results || response.data.results.length === 0) {
      return;
    }

    const matchedMed = response.data.results[0];
    
    // Fetch full comparison
    chrome.runtime.sendMessage({ type: 'GET_COMPARISON', medicineId: matchedMed.id }, (compRes) => {
      if (!compRes || !compRes.success || !compRes.data) return;
      const { medicine, cheapest_option, savings } = compRes.data;

      if (!savings || !savings.has_savings || savings.savings_percentage < 15) return;

      // Render floating savings pill with requestAnimationFrame
      requestAnimationFrame(() => {
        const badge = document.createElement('div');
        badge.id = 'medicompare-floating-badge';
        badge.style.cssText = `
          position: fixed;
          bottom: 24px;
          right: 24px;
          background: #0f172a;
          color: #ffffff;
          border-radius: 16px;
          padding: 14px 18px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.1);
          z-index: 999999;
          font-family: system-ui, -apple-system, sans-serif;
          max-width: 320px;
          animation: medicompareSlideIn 0.3s ease-out;
        `;

        badge.innerHTML = `
          <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 8px;">
            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #34d399; letter-spacing: 0.5px;">
              ⚡ MediCompare Generic Alert
            </div>
            <button id="medicompare-close-btn" style="background: transparent; border: none; color: #94a3b8; cursor: pointer; font-size: 14px; padding: 0;">✕</button>
          </div>
          <div style="font-size: 13px; font-weight: 600; margin-top: 4px; color: #f8fafc;">
            Save ${savings.savings_percentage}% (₹${savings.savings_per_pack.toFixed(2)}) with Jan Aushadhi
          </div>
          <div style="font-size: 11px; color: #cbd5e1; margin-top: 4px;">
            Identical salt: <em>${medicine.display_composition}</em>
          </div>
          <a href="http://localhost:5173" target="_blank" style="display: block; text-align: center; background: #0d9488; color: #ffffff; text-decoration: none; font-size: 12px; font-weight: 700; padding: 6px 12px; border-radius: 8px; margin-top: 10px;">
            View Alternatives & Stores →
          </a>
        `;

        document.body.appendChild(badge);

        document.getElementById('medicompare-close-btn')?.addEventListener('click', () => {
          badge.remove();
        });
      });
    });
  });
})();
