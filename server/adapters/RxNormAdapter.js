/**
 * RxNormAdapter
 * Connects to the US National Library of Medicine (NLM) RxNav / RxNorm REST API.
 * Provides normalized clinical drug concepts (RxCUI), ingredients, strengths, and synonyms.
 */

export class RxNormAdapter {
  constructor() {
    this.sourceId = 'US_NLM_RXNORM';
    this.sourceName = 'U.S. National Library of Medicine (RxNorm / RxNav)';
    this.country = 'US';
    this.jurisdiction = 'United States (NLM / NIH)';
    this.baseUrl = 'https://rxnav.nlm.nih.gov/REST';
    this.cache = new Map();
    this.maxCacheEntries = 200;
  }

  async search(query, limit = 6) {
    const q = String(query || '').trim();
    if (!q || q.length < 3) return [];

    const cacheKey = `rx_${q.toLowerCase()}_${limit}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const url = `${this.baseUrl}/drugs.json?name=${encodeURIComponent(q)}`;
      const response = await fetch(url, { 
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      const concepts = [];

      const groups = data?.drugGroup?.conceptGroup || [];
      for (const group of groups) {
        if (!group.conceptProperties) continue;
        for (const prop of group.conceptProperties) {
          // Normalize RxNorm clinical record
          concepts.push(this.normalizeRecord(prop));
          if (concepts.length >= limit) break;
        }
        if (concepts.length >= limit) break;
      }

      // If no exact results, try approximate match
      if (concepts.length === 0) {
        const approxUrl = `${this.baseUrl}/approximateTerm.json?term=${encodeURIComponent(q)}&maxEntries=${limit}`;
        const approxRes = await fetch(approxUrl, { headers: { 'Accept': 'application/json' } });
        if (approxRes.ok) {
          const approxData = await approxRes.json();
          const candidates = approxData?.approximateGroup?.candidate || [];
          for (const cand of candidates) {
            if (cand.rxcui) {
              concepts.push({
                id: `RXNORM-${cand.rxcui}`,
                name: cand.name || q,
                display_name: cand.name || q,
                brand_name: null,
                generic_name: cand.name || q,
                price: null,
                unit_price: null,
                has_verified_price: false,
                price_type: 'NO_RETAIL_PRICE_RECORDED',
                currency: 'USD',
                currency_symbol: '$',
                pack_size_label: 'Standard clinical formulation',
                pack_unit_count: 1,
                pack_unit_type: 'unit',
                manufacturer_name: 'NLM Reference Concept',
                display_composition: cand.name || q,
                composition_key: this.slugify(cand.name || q),
                dosage_form: this.inferDosageForm(cand.name || ''),
                release_characteristic: this.inferRelease(cand.name || ''),
                route: 'Oral',
                salts: [{ raw: cand.name, name: cand.name, strength: '' }],
                generic_flag: true,
                badge_type: 'RxNorm Concept',
                is_cheapest: false,
                is_discontinued: false,
                country: this.country,
                jurisdiction: this.jurisdiction,
                provenance: {
                  source_id: this.sourceId,
                  source_name: this.sourceName,
                  source_url: `https://mor.nlm.nih.gov/RxNav/search?searchBy=RXCUI&searchTerm=${cand.rxcui}`,
                  retrieval_date: new Date().toISOString().split('T')[0],
                  verification_status: 'OFFICIAL_REGULATORY_VOCABULARY',
                  regulatory_authority: 'National Library of Medicine (NLM), USA',
                  rxcui: cand.rxcui
                }
              });
              if (concepts.length >= limit) break;
            }
          }
        }
      }

      // Cache results
      if (this.cache.size > this.maxCacheEntries) {
        const firstKey = this.cache.keys().next().value;
        this.cache.delete(firstKey);
      }
      this.cache.set(cacheKey, concepts);

      return concepts;
    } catch (err) {
      // Graceful timeout or offline fail
      return [];
    }
  }

  normalizeRecord(prop) {
    const name = prop.name || '';
    const dosageForm = this.inferDosageForm(name);
    const releaseType = this.inferRelease(name);

    return {
      id: `RXNORM-${prop.rxcui}`,
      name: name,
      display_name: name,
      brand_name: prop.tty === 'SBD' ? name : null,
      generic_name: name,
      price: null,
      unit_price: null,
      has_verified_price: false,
      price_type: 'NO_RETAIL_PRICE_RECORDED',
      currency: 'USD',
      currency_symbol: '$',
      pack_size_label: 'Standard Clinical Drug Unit',
      pack_unit_count: 1,
      pack_unit_type: 'unit',
      manufacturer_name: prop.tty === 'SBD' ? 'Branded Product Concept' : 'Normalized Clinical Drug',
      display_composition: prop.synonym || name,
      composition_key: this.slugify(name),
      dosage_form: dosageForm,
      release_characteristic: releaseType,
      route: this.inferRoute(name),
      salts: [{ raw: name, name: name, strength: '' }],
      generic_flag: prop.tty === 'SCD' || prop.tty === 'IN',
      badge_type: 'RxNorm Reference',
      is_cheapest: false,
      is_discontinued: false,
      country: this.country,
      jurisdiction: this.jurisdiction,
      provenance: {
        source_id: this.sourceId,
        source_name: this.sourceName,
        source_url: `https://mor.nlm.nih.gov/RxNav/search?searchBy=RXCUI&searchTerm=${prop.rxcui}`,
        retrieval_date: new Date().toISOString().split('T')[0],
        verification_status: 'OFFICIAL_REGULATORY_VOCABULARY',
        regulatory_authority: 'National Library of Medicine (NLM), USA',
        rxcui: prop.rxcui,
        term_type: prop.tty
      }
    };
  }

  inferDosageForm(text) {
    const t = text.toLowerCase();
    if (t.includes('tablet')) return 'Tablet';
    if (t.includes('capsule')) return 'Capsule';
    if (t.includes('suspension')) return 'Oral Suspension';
    if (t.includes('solution') || t.includes('syrup')) return 'Oral Solution';
    if (t.includes('injection')) return 'Injection';
    if (t.includes('cream') || t.includes('ointment')) return 'Topical Ointment';
    return 'Formulation';
  }

  inferRelease(text) {
    const t = text.toLowerCase();
    if (t.includes('extended release') || t.includes('12 hr') || t.includes('24 hr')) return 'Extended Release (ER)';
    if (t.includes('delayed release')) return 'Delayed Release (DR)';
    return 'Immediate Release';
  }

  inferRoute(text) {
    const t = text.toLowerCase();
    if (t.includes('oral')) return 'Oral';
    if (t.includes('topical')) return 'Topical';
    if (t.includes('injection')) return 'Injectable';
    return 'Oral';
  }

  slugify(text) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
}
