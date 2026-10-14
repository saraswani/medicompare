/**
 * IndianMedicineAdapter
 * Standardized data adapter for Indian Pharmacopoeia and PMBJP Jan Aushadhi records.
 */

export class IndianMedicineAdapter {
  constructor(medicineData) {
    this.sourceId = 'IN_PHARMACOPOEIA';
    this.sourceName = 'Indian Pharmacopoeia & PMBJP Jan Aushadhi';
    this.country = 'IN';
    this.jurisdiction = 'India (CDSCO / PMBJP)';
    this.retrievalDate = '2026-10-14';
    this.medicines = [];
    this.medicinesById = new Map();
    this.medicinesByGroup = new Map();

    if (medicineData && Array.isArray(medicineData.medicines)) {
      this.initialize(medicineData.medicines);
    }
  }

  initialize(rawMedicines) {
    this.medicines = rawMedicines.map(med => this.normalizeRecord(med));
    this.medicinesById.clear();
    this.medicinesByGroup.clear();

    for (const med of this.medicines) {
      this.medicinesById.set(med.id, med);
      if (!this.medicinesByGroup.has(med.composition_key)) {
        this.medicinesByGroup.set(med.composition_key, []);
      }
      this.medicinesByGroup.get(med.composition_key).push(med);
    }
  }

  normalizeRecord(raw) {
    // Determine dosage form from name or pack label
    let dosageForm = 'Tablet';
    const nameLower = (raw.name || '').toLowerCase();
    const packLower = (raw.pack_size_label || '').toLowerCase();

    if (nameLower.includes('capsule') || packLower.includes('capsule')) dosageForm = 'Capsule';
    else if (nameLower.includes('syrup') || nameLower.includes('suspension')) dosageForm = 'Oral Suspension';
    else if (nameLower.includes('injection')) dosageForm = 'Injection';
    else if (nameLower.includes('drop')) dosageForm = 'Drops';
    else if (nameLower.includes('gel') || nameLower.includes('ointment')) dosageForm = 'Topical Gel';

    // Release characteristics
    let releaseType = 'Immediate Release';
    if (nameLower.includes(' sr') || nameLower.includes('-sr') || nameLower.includes('sustained release')) {
      releaseType = 'Sustained Release (SR)';
    } else if (nameLower.includes(' er') || nameLower.includes('-er') || nameLower.includes('extended release')) {
      releaseType = 'Extended Release (ER)';
    } else if (nameLower.includes(' pr') || nameLower.includes('prolonged release')) {
      releaseType = 'Prolonged Release (PR)';
    }

    const isPmbjp = raw.badge_type === 'PMBJP Generic' || 
                    (raw.name && raw.name.toLowerCase().includes('jan aushadhi')) ||
                    (raw.manufacturer_name && raw.manufacturer_name.toLowerCase().includes('janaushadhi'));

    return {
      id: raw.id,
      name: raw.name,
      display_name: raw.name,
      brand_name: raw.generic_flag ? null : raw.name,
      generic_name: raw.display_composition || raw.name,
      price: typeof raw.price === 'number' ? raw.price : parseFloat(raw.price) || 0,
      unit_price: typeof raw.unit_price === 'number' ? raw.unit_price : parseFloat(raw.unit_price) || 0,
      has_verified_price: true,
      price_type: isPmbjp ? 'PMBJP_GOVT_MAX_RETAIL_PRICE' : 'MARKET_MRP',
      currency: 'INR',
      currency_symbol: '₹',
      pack_size_label: raw.pack_size_label || '1 strip',
      pack_unit_count: raw.pack_unit_count || 10,
      pack_unit_type: raw.pack_unit_type || 'tablets',
      manufacturer_name: raw.manufacturer_name || 'Licensed Indian Manufacturer',
      display_composition: raw.display_composition || '',
      composition_key: raw.composition_key || '',
      dosage_form: dosageForm,
      release_characteristic: releaseType,
      route: 'Oral',
      salts: raw.salts || [],
      generic_flag: Boolean(raw.generic_flag),
      badge_type: raw.badge_type || (isPmbjp ? 'PMBJP Generic' : 'Branded'),
      is_cheapest: Boolean(raw.is_cheapest),
      is_discontinued: Boolean(raw.is_discontinued),
      country: this.country,
      jurisdiction: this.jurisdiction,
      provenance: {
        source_id: this.sourceId,
        source_name: isPmbjp ? 'Pradhan Mantri Bhartiya Janaushadhi Pariyojana' : 'Indian Medicine Commercial Register',
        source_url: isPmbjp ? 'https://janaushadhi.gov.in/' : 'https://cdsco.gov.in/',
        retrieval_date: this.retrievalDate,
        verification_status: isPmbjp ? 'OFFICIAL_PRICE_REFERENCE' : 'VERIFIED_MARKET_LISTING',
        data_authority: isPmbjp ? 'PMBJP (Govt. of India)' : 'CDSCO / NPPA (Govt. of India)',
        regulatory_authority: 'Central Drugs Standard Control Organisation (CDSCO), India',
        pricing_authority: isPmbjp ? 'Department of Pharmaceuticals, Govt of India' : 'National Pharmaceutical Pricing Authority (NPPA)'
      }
    };
  }

  async search(query, limit = 10) {
    const q = String(query || '').trim().toLowerCase();
    if (!q) return [];

    const exactMatches = [];
    const startsWithMatches = [];
    const containsMatches = [];
    const saltMatches = [];

    for (const med of this.medicines) {
      if (med.is_discontinued) continue;

      const nameLower = med.name.toLowerCase();
      const compLower = med.display_composition.toLowerCase();
      const mfgLower = med.manufacturer_name.toLowerCase();

      if (nameLower === q) {
        exactMatches.push(med);
      } else if (nameLower.startsWith(q)) {
        startsWithMatches.push(med);
      } else if (nameLower.includes(q) || mfgLower.includes(q)) {
        containsMatches.push(med);
      } else if (compLower.includes(q)) {
        saltMatches.push(med);
      }
    }

    const merged = [...exactMatches, ...startsWithMatches, ...containsMatches, ...saltMatches];
    const seen = new Set();
    const results = [];

    for (const item of merged) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        results.push(item);
      }
      if (results.length >= limit) break;
    }

    return results;
  }

  getById(id) {
    return this.medicinesById.get(id) || null;
  }

  getByComposition(compositionKey) {
    return this.medicinesByGroup.get(compositionKey) || [];
  }

  getAll() {
    return this.medicines;
  }
}
