/**
 * Prescription OCR & Clinical Entity Extraction Service
 * Supports multi-tier scanning:
 * 1. Google Gemini 2.0 Flash Vision (if GEMINI_API_KEY is configured)
 * 2. Tesseract.js Open Source OCR (free, local, no API key required)
 * 3. Pharmaceutical Lexicon & Fuzzy Matcher against Indian Pharmacopoeia dataset
 */

import Tesseract from 'tesseract.js';

// Clean clinical boilerplate words that are not medicine names
const CLINICAL_STOPWORDS = new Set([
  'rx', 'tab', 'tablet', 'tablets', 'cap', 'capsule', 'capsules', 'syp', 'syrup',
  'inj', 'injection', 'drop', 'drops', 'gel', 'ointment', 'cream',
  'od', 'bd', 'tds', 'qid', 'hs', 'sos', 'stat', 'po', 'iv', 'im',
  'mg', 'ml', 'mcg', 'gm', 'g', 'dose', 'daily', 'twice', 'thrice', 'once',
  'days', 'day', 'weeks', 'week', 'after', 'before', 'food', 'meals',
  'doctor', 'dr', 'clinic', 'hospital', 'patient', 'name', 'age', 'sex', 'gender',
  'date', 'sign', 'signature', 'reg', 'no', 'opd', 'ipd', 'consultant',
  'take', 'oral', 'dispense', 'qty', 'refill'
]);

function levenshteinDistance(s1, s2) {
  const a = s1.toLowerCase().trim();
  const b = s2.toLowerCase().trim();
  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

function stringSimilarity(s1, s2) {
  const longer = s1.length > s2.length ? s1 : s2;
  if (longer.length === 0) return 1.0;
  return (longer.length - levenshteinDistance(s1, s2)) / longer.length;
}

export class PrescriptionOcrService {
  constructor(medicineData, searchManager, geminiModel = null) {
    this.medicineData = medicineData || { medicines: [], groups: [] };
    this.searchManager = searchManager;
    this.geminiModel = geminiModel;
    this.medicines = medicineData?.medicines || [];
    this.groups = medicineData?.groups || [];

    // Precompile indexed lookup dictionary for rapid fuzzy/exact matching
    this.indexedBrands = [];
    this.initLexicon();
  }

  updateData(medicineData) {
    this.medicineData = medicineData;
    this.medicines = medicineData?.medicines || [];
    this.groups = medicineData?.groups || [];
    this.initLexicon();
  }

  setGeminiModel(model) {
    this.geminiModel = model;
  }

  initLexicon() {
    this.indexedBrands = [];
    this.indexedRoots = new Map();
    this.indexedPhrases = new Map();
    this.saltIndex = new Map();

    for (const med of this.medicines) {
      if (med.is_discontinued) continue;

      // Extract core brand name (e.g. "Aceclo Plus", "Dolo 650", "Pan D")
      const cleanBrand = med.name
        .replace(/\b(Tablet|Tablets|Capsule|Capsules|Injection|Syrup|Suspension|Drops|Gel|Ointment|Duo|Advance|SR|ER|PR|CR)\b/gi, '')
        .trim();

      const item = {
        id: med.id,
        fullName: med.name,
        cleanBrand: cleanBrand.toLowerCase(),
        composition: med.display_composition,
        compositionKey: med.composition_key,
        price: med.price,
        record: med
      };

      this.indexedBrands.push(item);

      // Index multi-word brand phrase (e.g. "aceclo plus", "pan d", "dolo 650")
      const cleanLower = cleanBrand.toLowerCase();
      if (!this.indexedPhrases.has(cleanLower)) {
        this.indexedPhrases.set(cleanLower, []);
      }
      this.indexedPhrases.get(cleanLower).push(med);

      // Index single primary brand root (e.g. "aceclo", "dolo", "augmentin", "pan", "telma", "calpol")
      const tokens = cleanLower.split(/[\s-]+/).filter(t => t.length >= 3 && !/^\d+$/.test(t));
      const primaryRoot = tokens[0];
      if (primaryRoot && primaryRoot.length >= 3 && !CLINICAL_STOPWORDS.has(primaryRoot)) {
        if (!this.indexedRoots.has(primaryRoot)) {
          this.indexedRoots.set(primaryRoot, []);
        }
        this.indexedRoots.get(primaryRoot).push(med);
      }

      // Index active salts
      if (med.display_composition) {
        const rawSalts = med.display_composition.split('+');
        for (const s of rawSalts) {
          const saltName = s.replace(/\([^)]*\)/g, '').trim().toLowerCase();
          if (saltName.length >= 4 && !CLINICAL_STOPWORDS.has(saltName)) {
            if (!this.saltIndex.has(saltName)) {
              this.saltIndex.set(saltName, []);
            }
            this.saltIndex.get(saltName).push(med);
          }
        }
      }
    }
  }

  /**
   * Main scan function
   */
  async scanPrescriptionImage(imageBase64, mimeType = 'image/jpeg', hints = {}) {
    let extractedNames = [];
    let ocrEngine = 'tesseract-ocr';
    let rawOcrText = '';

    // 1. Attempt Gemini 2.0 Flash Vision if key is available
    if (this.geminiModel) {
      try {
        const imagePart = {
          inlineData: {
            data: imageBase64.replace(/^data:image\/\w+;base64,/, ''),
            mimeType: mimeType || 'image/jpeg'
          }
        };

        const prompt = `You are a medical Optical Character Recognition (OCR) assistant.
Analyze this prescription image and extract ONLY the exact written medicine brand names or chemical salt names.
DO NOT provide dosage recommendations, medical advice, side effects, or clinical diagnosis.

Return ONLY a valid JSON object in this exact format:
{
  "extracted_medicines": ["Medicine Name 1", "Medicine Name 2"]
}`;

        const result = await this.geminiModel.generateContent([prompt, imagePart]);
        const responseText = result.response.text();
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (Array.isArray(parsed.extracted_medicines) && parsed.extracted_medicines.length > 0) {
            extractedNames = parsed.extracted_medicines;
            ocrEngine = 'gemini-vision';
          }
        }
      } catch (geminiErr) {
        console.warn('Gemini Vision OCR failed/unavailable, falling back to local Tesseract OCR:', geminiErr.message);
      }
    }

    // 2. Open-Source Local OCR via Tesseract if Gemini did not produce results
    if (extractedNames.length === 0) {
      try {
        const imageBuffer = Buffer.from(imageBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
        const tesseractResult = await Tesseract.recognize(imageBuffer, 'eng');
        rawOcrText = tesseractResult.data?.text || '';
        ocrEngine = 'tesseract-ocr';

        // Extract medicine names from OCR text
        extractedNames = this.extractMedicinesFromText(rawOcrText);
      } catch (tessErr) {
        console.warn('Tesseract OCR error:', tessErr.message);
      }
    }

    // 3. Fallback extraction from client hints (e.g. filename like "aceclo-plus-rx.jpg") if OCR text was sparse
    if (extractedNames.length === 0 && hints?.fileName) {
      const hintMatches = this.extractMedicinesFromText(hints.fileName.replace(/[-_.]/g, ' '));
      if (hintMatches.length > 0) {
        extractedNames = hintMatches;
        ocrEngine = 'filename-heuristic';
      }
    }

    // 4. Match extracted names against database & attach generic alternative info
    const matchedMedicines = [];
    const seenMedIds = new Set();

    for (const rawName of extractedNames) {
      const match = this.findBestMedicineMatch(rawName);
      if (match && !seenMedIds.has(match.id)) {
        seenMedIds.add(match.id);
        const genericAlt = this.findGenericAlternative(match);

        matchedMedicines.push({
          extracted_name: rawName,
          confidence: match.confidence || 0.9,
          matched: {
            id: match.id,
            name: match.name,
            price: match.price,
            pack_size_label: match.pack_size_label,
            display_composition: match.display_composition,
            manufacturer_name: match.manufacturer_name,
            badge_type: match.badge_type,
            generic_flag: match.generic_flag
          },
          generic_alternative: genericAlt
        });
      }
    }

    // 5. Popular fallback suggestions if nothing detected
    const popularRecommendations = this.getPopularPrescriptions();

    return {
      success: true,
      ocr_engine: ocrEngine,
      raw_text_snippet: rawOcrText ? rawOcrText.slice(0, 150) : null,
      extracted_names: extractedNames,
      medicines: matchedMedicines,
      total_extracted: extractedNames.length,
      total_matched: matchedMedicines.length,
      suggested_alternatives: matchedMedicines.length === 0 ? popularRecommendations : []
    };
  }

  /**
   * Pharmaceutical text parsing and entity extraction
   * Supports phrase matching, primary brand roots, active salts, and fuzzy OCR typo tolerance
   */
  extractMedicinesFromText(text) {
    if (!text || typeof text !== 'string') return [];

    const normalized = text.toLowerCase().replace(/[-_.]/g, ' ');
    const words = normalized.split(/\s+/).filter(w => w.length >= 3 && !CLINICAL_STOPWORDS.has(w));
    const candidateMatches = new Map();

    // 1. Check multi-word phrase matches (e.g. "aceclo plus", "pan d", "dolo 650", "augmentin 625")
    if (this.indexedPhrases) {
      for (const [phrase, meds] of this.indexedPhrases.entries()) {
        if (phrase.includes(' ') && normalized.includes(phrase)) {
          const primary = meds.find(m => !m.generic_flag) || meds[0];
          if (primary && !candidateMatches.has(primary.id)) {
            candidateMatches.set(primary.id, { name: primary.name, score: 1.0, length: phrase.length });
          }
        }
      }
    }

    // 2. Check primary brand root matches (e.g. "aceclo", "dolo", "augmentin", "pan", "telma", "calpol")
    if (this.indexedRoots) {
      for (const word of words) {
        if (this.indexedRoots.has(word)) {
          const meds = this.indexedRoots.get(word);
          const primary = meds.find(m => !m.generic_flag) || meds[0];
          if (primary && !candidateMatches.has(primary.id)) {
            candidateMatches.set(primary.id, { name: primary.name, score: 0.95, length: word.length });
          }
        }
      }
    }

    // 3. Check active pharmaceutical salts (e.g. "paracetamol", "aceclofenac", "amoxicillin", "pantoprazole")
    if (this.saltIndex) {
      for (const [salt, meds] of this.saltIndex.entries()) {
        if (normalized.includes(salt)) {
          const primary = meds.find(m => !m.generic_flag) || meds[0];
          if (primary && !candidateMatches.has(primary.id)) {
            candidateMatches.set(primary.id, { name: primary.name, score: 0.90, length: salt.length });
          }
        }
      }
    }

    // 4. Fuzzy Levenshtein match on brand roots for OCR typos (e.g. "Acecl0", "D0lo", "Augmntin")
    if (candidateMatches.size === 0 && this.indexedRoots) {
      for (const word of words) {
        if (word.length >= 4) {
          for (const [root, meds] of this.indexedRoots.entries()) {
            if (root.length >= 4) {
              const sim = stringSimilarity(word, root);
              if (sim >= 0.74) {
                const primary = meds.find(m => !m.generic_flag) || meds[0];
                if (primary && !candidateMatches.has(primary.id)) {
                  candidateMatches.set(primary.id, { name: primary.name, score: Math.round(sim * 100) / 100, length: root.length });
                }
              }
            }
          }
        }
      }
    }

    // Sort by match score and length
    const sorted = Array.from(candidateMatches.values()).sort((a, b) => b.score - a.score || b.length - a.length);
    return sorted.map(c => c.name).slice(0, 5);
  }

  /**
   * Find best medicine record in database
   */
  findBestMedicineMatch(rawName) {
    if (!rawName) return null;
    const clean = rawName.toLowerCase().trim();

    // 1. Exact match
    const exact = this.medicines.find(m => m.name.toLowerCase() === clean);
    if (exact) return { ...exact, confidence: 1.0 };

    // 2. Starts with / includes match
    const contains = this.medicines.find(m => m.name.toLowerCase().includes(clean) || clean.includes(m.name.toLowerCase()));
    if (contains) return { ...contains, confidence: 0.92 };

    // 3. Search via indexed brands
    for (const item of this.indexedBrands) {
      if (clean.includes(item.cleanBrand) || item.cleanBrand.includes(clean)) {
        return { ...item.record, confidence: 0.88 };
      }
      const sim = stringSimilarity(clean, item.cleanBrand);
      if (sim >= 0.75) {
        return { ...item.record, confidence: Math.round(sim * 100) / 100 };
      }
    }

    return null;
  }

  /**
   * Find generic PMBJP alternative for price comparison
   */
  findGenericAlternative(brandedMed) {
    if (!brandedMed || !brandedMed.composition_key) return null;

    const group = this.groups.find(g => g.composition_key === brandedMed.composition_key);
    if (!group) return null;

    // Find cheapest generic in the composition group
    const generics = this.medicines.filter(m => 
      m.composition_key === brandedMed.composition_key && 
      (m.generic_flag || m.badge_type === 'PMBJP Generic' || m.name.toLowerCase().includes('jan aushadhi'))
    );

    if (generics.length === 0) return null;

    generics.sort((a, b) => a.price - b.price);
    const cheapest = generics[0];

    const savingsAmount = Math.max(0, brandedMed.price - cheapest.price);
    const savingsPercent = brandedMed.price > 0 
      ? Math.round((savingsAmount / brandedMed.price) * 100) 
      : 0;

    return {
      id: cheapest.id,
      name: cheapest.name,
      price: cheapest.price,
      pack_size_label: cheapest.pack_size_label,
      savings_amount: savingsAmount,
      savings_percentage: savingsPercent
    };
  }

  /**
   * Curated popular prescriptions for instant 1-click test and guidance
   */
  getPopularPrescriptions() {
    const popularIds = ['MED031', 'MED001', 'MED011', 'MED021', 'MED061'];
    return this.medicines
      .filter(m => popularIds.includes(m.id))
      .map(m => {
        const alt = this.findGenericAlternative(m);
        return {
          id: m.id,
          name: m.name,
          display_composition: m.display_composition,
          price: m.price,
          generic_alternative: alt
        };
      });
  }
}
