const searchInput = document.getElementById('search-input');
const resultsContainer = document.getElementById('results-container');
const comparisonCard = document.getElementById('comparison-card');

let debounceTimer = null;

searchInput.addEventListener('input', (e) => {
  const query = e.target.value.trim();
  clearTimeout(debounceTimer);

  if (!query) {
    resultsContainer.innerHTML = '<div class="empty-state"><p>Type a medicine name to compare generic prices instantly.</p></div>';
    comparisonCard.classList.add('hidden');
    return;
  }

  debounceTimer = setTimeout(async () => {
    try {
      chrome.runtime.sendMessage({ type: 'SEARCH_MEDICINE', query }, (response) => {
        if (!response || !response.success || !response.data || !response.data.results) {
          resultsContainer.innerHTML = '<div class="empty-state"><p>No matching medicine found.</p></div>';
          return;
        }

        renderResults(response.data.results);
      });
    } catch (err) {
      console.error('Error during search:', err);
    }
  }, 200);
});

function renderResults(medicines) {
  if (medicines.length === 0) {
    resultsContainer.innerHTML = '<div class="empty-state"><p>No matching medicines found.</p></div>';
    return;
  }

  resultsContainer.innerHTML = '';
  comparisonCard.classList.add('hidden');

  medicines.forEach(med => {
    const item = document.createElement('div');
    item.className = 'result-item';
    item.innerHTML = `
      <div class="med-info">
        <h4>${med.name}</h4>
        <p>${med.manufacturer_name} • ${med.pack_size_label}</p>
      </div>
      <div class="med-price">
        <div>₹${med.price.toFixed(2)}</div>
      </div>
    `;

    item.addEventListener('click', () => loadComparison(med.id));
    resultsContainer.appendChild(item);
  });
}

async function loadComparison(medicineId) {
  chrome.runtime.sendMessage({ type: 'GET_COMPARISON', medicineId }, (response) => {
    if (!response || !response.success || !response.data) return;

    const { medicine, cheapest_option, savings, shared_composition } = response.data;
    resultsContainer.innerHTML = '';

    comparisonCard.classList.remove('hidden');
    comparisonCard.innerHTML = `
      <div style="font-size: 11px; color: #64748b; font-weight: 600;">SEARCHED MEDICINE:</div>
      <div style="font-weight: 700; font-size: 14px; color: #0f172a;">${medicine.name} (₹${medicine.price.toFixed(2)})</div>
      <div class="comp-salt">Active Salt: ${shared_composition}</div>
      
      <div style="margin-top: 6px; padding-top: 6px; border-top: 1px dashed #cbd5e1;">
        <div style="font-size: 11px; color: #059669; font-weight: 700;">CHEAPEST GENERIC SWAP:</div>
        <div style="font-weight: 800; font-size: 14px; color: #065f46;">${cheapest_option.name} (₹${cheapest_option.price.toFixed(2)})</div>
        <div style="font-size: 10px; color: #64748b;">${cheapest_option.manufacturer_name}</div>
      </div>

      ${savings?.has_savings ? `
        <div class="savings-badge">
          🎉 Save ${savings.savings_percentage}% (₹${savings.savings_per_pack.toFixed(2)}/pack)
        </div>
      ` : `
        <div style="font-size: 11px; color: #059669; font-weight: 600;">You are viewing the lowest price option!</div>
      `}

      <a href="http://localhost:5173" target="_blank" class="open-app-btn">
        Find Nearby Jan Aushadhi Stores →
      </a>
    `;
  });
}
