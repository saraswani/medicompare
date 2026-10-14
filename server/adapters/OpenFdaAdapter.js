/**
 * OpenFdaAdapter
 * Connects to the openFDA National Drug Code (NDC) Directory API.
 * Provides FDA-registered finished drug products, manufacturers, routes, and active ingredients.
 */

export class OpenFdaAdapter {
  constructor() {
    this.sourceId = 'US_FDA_NDC';
    this.sourceName = 'U.S. FDA National Drug Code (NDC) Directory';
    this.country = 'US';
    this.jurisdiction = 'United States (U.S. FDA)';
    this.baseUrl = 'https://api.fda.gov/drug/ndc.json';
    this.cache = new Map();
    this.maxCacheEntries = 200;
  }

  async search(query, limit = 6) {
    const q = String(query || '').trim();
    if (!q || q.length < 3) return [];

    const cacheKey = `fda_${q.toLowerCase()}_${limit}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      // Search brand_name, generic_name, or active_ingredients.name
      const safeQ = encodeURIComponent(`brand_name:"${q}" generic_name:"${q}"`);
      const url = `${this.baseUrl}?search=${safeQ}&limit=${limit}`;

      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      const results = (data?.results || []).map(r => this.normalizeRecord(r));

      // Cache results
      if (this.cache.size > this.maxCacheEntries) {
        const firstKey = this.cache.keys().next().value;
        this.cache.delete(firstKey);
      }
      this.cache.set(cacheKey, results);

      return results;
    } catch (err) {
      // Graceful timeout or network offline
      return [];
    }
  }

  normalizeRecord(raw) {
    const brandName = raw.brand_name || raw.brand_name_base || raw.generic_name || 'FDA Listed Drug';
    const genericName = raw.generic_name || brandName;
    const ingredients = (raw.active_ingredients || []).map(i => ({
      name: this.toTitleCase(i.name || ''),
      strength: i.strength || '',
      normalizedName: (i.name || '').toLowerCase().trim()
    }));

    const compositionStr = ingredients.length > 0 
      ? ingredients.map(i => `${i.name} (${i.strength})`).join(' + ')
      : genericName;

    const ndcId = raw.product_ndc || `FDA-${Date.now()}`;
    const dosageForm = this.toTitleCase(raw.dosage_form || 'Tablet');
    const route = Array.isArray(raw.route) ? raw.route.map(r => this.toTitleCase(r)).join(', ') : 'Oral';
    const isGeneric = (raw.marketing_category || '').toLowerCase().includes('generic') ||
                      (raw.marketing_category || '').toLowerCase().includes('anda');

    return {
      id: `FDA-NDC-${ndcId}`,
      name: this.toTitleCase(brandName),
      display_name: `${this.toTitleCase(brandName)} (${dosageForm})`,
      brand_name: brandName,
      generic_name: genericName,
      price: null,
      unit_price: null,
      has_verified_price: false,
      price_type: 'NO_RETAIL_PRICE_RECORDED',
      currency: 'USD',
      currency_symbol: '$',
      pack_size_label: raw.packaging?.[0]?.description || 'Commercial Package',
      pack_unit_count: 1,
      pack_unit_type: 'unit',
      manufacturer_name: raw.labeler_name || raw.openfda?.manufacturer_name?.[0] || 'FDA Registered Manufacturer',
      display_composition: compositionStr,
      composition_key: this.slugify(compositionStr),
      dosage_form: dosageForm,
      release_characteristic: dosageForm.toLowerCase().includes('extended') ? 'Extended Release (ER)' : 'Immediate Release',
      route: route || 'Oral',
      salts: ingredients,
      generic_flag: isGeneric,
      badge_type: isGeneric ? 'FDA Generic (ANDA)' : 'FDA Listed (NDA)',
      is_cheapest: false,
      is_discontinued: Boolean(raw.listing_expiration_date && new Date(raw.listing_expiration_date) < new Date()),
      country: this.country,
      jurisdiction: this.jurisdiction,
      provenance: {
        source_id: this.sourceId,
        source_name: this.sourceName,
        source_url: `https://ndclist.com/ndc/${ndcId}`,
        retrieval_date: new Date().toISOString().split('T')[0],
        verification_status: 'OFFICIAL_REGULATORY_DIRECTORY',
        regulatory_authority: 'U.S. Food and Drug Administration (FDA)',
        application_number: raw.application_number || null,
        product_ndc: ndcId,
        marketing_category: raw.marketing_category || null
      }
    };
  }

  toTitleCase(str) {
    return String(str || '')
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  slugify(text) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
}
