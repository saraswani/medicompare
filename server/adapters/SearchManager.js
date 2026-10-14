/**
 * SearchManager
 * Multi-source search coordinator.
 * Queries primary Indian Pharmacopoeia/PMBJP dataset and secondary live international
 * regulatory sources (RxNorm and openFDA) with deduplication, resilience, and strict provenance.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { IndianMedicineAdapter } from './IndianMedicineAdapter.js';
import { RxNormAdapter } from './RxNormAdapter.js';
import { OpenFdaAdapter } from './OpenFdaAdapter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_DATA_PATH = path.join(__dirname, '..', 'data', 'processed_medicines.json');

export class SearchManager {
  constructor(indianMedicineData) {
    let data = indianMedicineData;
    if (!data && fs.existsSync(DEFAULT_DATA_PATH)) {
      try {
        data = JSON.parse(fs.readFileSync(DEFAULT_DATA_PATH, 'utf-8'));
      } catch (e) {
        console.error('Error auto-loading processed_medicines.json in SearchManager:', e.message);
      }
    }
    this.indianAdapter = new IndianMedicineAdapter(data);
    this.rxNormAdapter = new RxNormAdapter();
    this.openFdaAdapter = new OpenFdaAdapter();
  }

  updateIndianData(medicineData) {
    this.indianAdapter.initialize(medicineData.medicines || []);
  }

  async search(query, options = {}) {
    const q = String(query || '').trim();
    const limit = Math.min(Math.max(parseInt(options.limit, 10) || 10, 1), 50);
    const country = (options.country || 'all').toUpperCase();

    if (!q) {
      return { query: '', total: 0, results: [], sources_queried: [] };
    }

    const sourcesQueried = [];
    const tasks = [];

    // 1. Primary Indian Pharmacopoeia / PMBJP Search
    if (country === 'ALL' || country === 'IN') {
      sourcesQueried.push('IN_PHARMACOPOEIA');
      tasks.push(
        this.indianAdapter.search(q, limit)
          .catch(err => {
            console.error('Indian search adapter error:', err.message);
            return [];
          })
      );
    }

    // 2. Secondary Live RxNorm Search (NLM)
    if (country === 'ALL' || country === 'US') {
      sourcesQueried.push('US_NLM_RXNORM');
      tasks.push(
        this.rxNormAdapter.search(q, 4)
          .catch(err => {
            console.warn('RxNorm search adapter offline/timed out:', err.message);
            return [];
          })
      );
    }

    // 3. Tertiary Live openFDA NDC Search
    if (country === 'ALL' || country === 'US') {
      sourcesQueried.push('US_FDA_NDC');
      tasks.push(
        this.openFdaAdapter.search(q, 4)
          .catch(err => {
            console.warn('openFDA search adapter offline/timed out:', err.message);
            return [];
          })
      );
    }

    // Execute in parallel with error isolation
    const resultsArrays = await Promise.all(tasks);
    const combined = [];

    // Prioritize Indian Pharmacopoeia results first
    const [inResults = [], rxResults = [], fdaResults = []] = resultsArrays;
    combined.push(...inResults, ...rxResults, ...fdaResults);

    // Deduplication by normalized name and active salt composition
    const seenKeys = new Set();
    const deduplicated = [];

    for (const item of combined) {
      // Key on normalized name and country
      const dedupKey = `${item.country}-${(item.name || '').toLowerCase().trim()}-${(item.dosage_form || '').toLowerCase()}`;
      if (!seenKeys.has(dedupKey)) {
        seenKeys.add(dedupKey);
        deduplicated.push(item);
      }
      if (deduplicated.length >= limit) break;
    }

    return {
      query: q,
      total: deduplicated.length,
      results: deduplicated,
      sources_queried: sourcesQueried,
      has_international_records: deduplicated.some(d => d.country !== 'IN')
    };
  }

  getMedicineById(id) {
    // 1. Check Indian Pharmacopoeia first
    const inMed = this.indianAdapter.getById(id);
    if (inMed) return inMed;

    // 2. Check cached RxNorm
    for (const cachedList of this.rxNormAdapter.cache.values()) {
      const match = cachedList.find(m => m.id === id);
      if (match) return match;
    }

    // 3. Check cached openFDA
    for (const cachedList of this.openFdaAdapter.cache.values()) {
      const match = cachedList.find(m => m.id === id);
      if (match) return match;
    }

    return null;
  }

  getByComposition(compositionKey) {
    return this.indianAdapter.getByComposition(compositionKey);
  }

  getAllIndianMedicines() {
    return this.indianAdapter.getAll();
  }
}
