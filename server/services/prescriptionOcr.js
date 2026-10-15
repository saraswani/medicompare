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
    for (const med of this.medicines) {
      if (med.is_discontinued) continue;

      // Extract core brand name (e.g. "Aceclo Plus", "Dolo 650", "Pan D")
      const cleanBrand = med.name
        .replace(/\b(Tablet|Tablets|Capsule|Capsules|Injection|Syrup|Suspension|Drops|Gel|Ointment|Duo|Advance|SR|ER|PR|CR)\b/gi, '')
        .trim();

      this.indexedBrands.push({
        id: med.id,
        fullName: med.name,
        cleanBrand: cleanBrand.toLowerCase(),
        composition: med.display_composition,
        compositionKey: med.composition_key,
        price: med.price,
        record: med
      });
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
   */
  extractMedicinesFromText(text) {
    if (!text || typeof text !== 'string') return [];

    const normalized = text.toLowerCase();
    const candidateMatches = [];

    // Check exact & substring matches against our indexed brands
    for (const item of this.indexedBrands) {
      const brand = item.cleanBrand;
      if (brand.length < 3) continue;

      // Word boundary regex check
      const regex = new RegExp(`\\b${brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(normalized)) {
        candidateMatches.push({
          name: item.fullName,
          score: 1.0,
          length: brand.length
        });
      }
    }

    // Also check active salt names (e.g., "Paracetamol", "Aceclofenac", "Amoxicillin")
    for (const med of this.medicines) {
      if (med.generic_flag && med.display_composition) {
        const salts = med.display_composition.toLowerCase().split('+').map(s => s.replace(/\([^)]*\)/g, '').trim());
        for (const salt of salts) {
          if (salt.length >= 5 && normalized.includes(salt)) {
            candidateMatches.push({
              name: med.name,
              score: 0.9,
              length: salt.length
            });
          }
        }
      }
    }

    // If still no matches, split text into lines and check fuzzy distance
    if (candidateMatches.length === 0) {
      const lines = text.split(/[\r\n]+/);
      for (const line of lines) {
        const cleanLine = line
          .replace(/[0-9]+/g, '')
          .replace(/[^\w\s]/g, ' ')
          .trim();

        const words = cleanLine.split(/\s+/).filter(w => w.length >= 4 && !CLINICAL_STOPWORDS.has(w.toLowerCase()));

        for (const word of words) {
          for (const item of this.indexedBrands) {
            const sim = stringSimilarity(word, item.cleanBrand);
            if (sim >= 0.78) {
              candidateMatches.push({
                name: item.fullName,
                score: sim,
                length: item.cleanBrand.length
              });
            }
          }
        }
      }
    }

    // Deduplicate and sort by match quality
    candidateMatches.sort((a, b) => b.score - a.score || b.length - a.length);
    const unique = [];
    const seen = new Set();

    for (const c of candidateMatches) {
      if (!seen.has(c.name)) {
        seen.add(c.name);
        unique.push(c.name);
      }
      if (unique.length >= 5) break;
    }

    return unique;
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
