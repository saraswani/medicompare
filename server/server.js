import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { buildAndSeedFullDataset } from './scripts/build_full_dataset.js';
import { STORE_DATABASE, calculateDistanceKm, getDirectionsUrl } from './data/pharmacies.js';
import { SearchManager } from './adapters/SearchManager.js';
import { ClinicalComparator } from './services/comparator.js';
import { ReportService } from './services/reportService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'data', 'processed_medicines.json');
const CLIENT_DIST = path.join(__dirname, '..', 'client', 'dist');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Initialize Gemini AI (strict OCR for prescription photo reading)
let genAI = null;
let geminiModel = null;
if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  console.log('🔑 Gemini Vision API initialized for optical character recognition.');
} else {
  console.warn('⚠️  GEMINI_API_KEY not set — prescription photo scanning will be unavailable.');
}

// In-memory indexed data store & Multi-source Search Manager
let medicineData = { medicines: [], groups: [] };
let searchManager = null;

function loadOrSeedData() {
  if (!fs.existsSync(DATA_FILE)) {
    console.log('Processed dataset missing, compiling master dataset...');
    medicineData = buildAndSeedFullDataset();
  } else {
    try {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      medicineData = JSON.parse(raw);
    } catch (e) {
      console.error('Error reading processed data, reseeding...', e);
      medicineData = buildAndSeedFullDataset();
    }
  }

  if (!searchManager) {
    searchManager = new SearchManager(medicineData);
  } else {
    searchManager.updateIndianData(medicineData);
  }

  console.log(`🚀 Loaded ${medicineData.medicines.length} medicines into memory (${medicineData.groups?.length || 0} composition groups).`);
}

// Initial data load
loadOrSeedData();

// Curated Popular Categories
const THERAPEUTIC_CATEGORIES = [
  {
    id: 'fever',
    title: 'Fever & Pain Relief',
    subtitle: 'Paracetamol, Ibuprofen, Aceclofenac',
    icon: 'Flame',
    color: 'from-orange-500 to-amber-500',
    sampleQuery: 'Dolo 650'
  },
  {
    id: 'diabetes',
    title: 'Diabetes Care',
    subtitle: 'Metformin, Vildagliptin, Glimepiride',
    icon: 'Activity',
    color: 'from-sky-500 to-blue-500',
    sampleQuery: 'Glycomet 500'
  },
  {
    id: 'cardiac',
    title: 'Blood Pressure & Heart',
    subtitle: 'Telmisartan, Amlodipine, Atorvastatin',
    icon: 'HeartPulse',
    color: 'from-rose-500 to-red-500',
    sampleQuery: 'Telma 40'
  },
  {
    id: 'gastro',
    title: 'Acidity & Digestion',
    subtitle: 'Pantoprazole, Omeprazole, Rabeprazole',
    icon: 'ShieldAlert',
    color: 'from-emerald-500 to-teal-500',
    sampleQuery: 'Pan D'
  },
  {
    id: 'infection',
    title: 'Antibiotics & Infections',
    subtitle: 'Augmentin, Azithral, Taxim-O',
    icon: 'Pill',
    color: 'from-purple-500 to-indigo-500',
    sampleQuery: 'Augmentin 625'
  },
  {
    id: 'respiratory',
    title: 'Allergy & Respiratory',
    subtitle: 'Montair LC, Allegra 120, Cetzine',
    icon: 'Wind',
    color: 'from-blue-500 to-cyan-500',
    sampleQuery: 'Allegra 120'
  }
];

// ==========================================
// API ROUTES
// ==========================================

/**
 * 1. Multi-Source Medicine Autocomplete & Search Endpoint
 * Queries Indian Pharmacopoeia + RxNorm (NLM) + openFDA with deduplication and caching.
 */
app.get('/api/search', async (req, res) => {
  try {
    const query = String(req.query.q || '').trim();
    const limit = parseInt(req.query.limit, 10) || 10;
    const country = req.query.country || 'all';

    if (!query) {
      return res.json({ query: '', results: [], total: 0, sources_queried: [] });
    }

    const searchResponse = await searchManager.search(query, { limit, country });
    return res.json(searchResponse);
  } catch (err) {
    console.error('Search endpoint error:', err);
    return res.status(500).json({ error: 'Search service encountered an internal error' });
  }
});

/**
 * 2. Medicine Details & Clinical Comparison Endpoint
 * Uses ClinicalComparator for strict formulation evaluation and bounded savings math.
 */
app.get('/api/medicine/:id', (req, res) => {
  try {
    const medicineId = req.params.id;
    const targetMed = searchManager.getMedicineById(medicineId);

    if (!targetMed) {
      return res.status(404).json({ error: 'Medicine not found in connected databases' });
    }

    // Get candidate alternatives sharing active composition
    const candidateAlts = searchManager.getByComposition(targetMed.composition_key);
    
    // Fallback: If no group alternatives found, at least include target itself
    const candidatePool = candidateAlts.length > 0 ? candidateAlts : [targetMed];

    // Run clinical comparator
    const comparisonResult = ClinicalComparator.buildComparison(targetMed, candidatePool);

    return res.json(comparisonResult);
  } catch (err) {
    console.error('Medicine details endpoint error:', err);
    return res.status(500).json({ error: 'Failed to generate medicine comparison' });
  }
});

/**
 * 3. Provenance & Verification Metadata Endpoint
 * Returns regulatory audit trail, retrieval date, and authority citations.
 */
app.get('/api/provenance/:id', (req, res) => {
  const medicineId = req.params.id;
  const targetMed = searchManager.getMedicineById(medicineId);

  if (!targetMed) {
    return res.status(404).json({ error: 'Medicine record not found' });
  }

  return res.json({
    medicine_id: targetMed.id,
    name: targetMed.name,
    country: targetMed.country,
    jurisdiction: targetMed.jurisdiction,
    provenance: targetMed.provenance,
    regulatory_rules: {
      schedule_h_prescription: true,
      substitution_requires_consultation: true,
      bioequivalence_standard: targetMed.country === 'IN' ? 'Indian Pharmacopoeia (IP)' : 'USP / FDA Orange Book'
    }
  });
});

/**
 * 4. Report-An-Error Endpoint
 * Allows clinicians and patients to submit corrections, pricing updates, or formulation errors.
 */
app.post('/api/report-error', (req, res) => {
  try {
    const { medicine_id, medicine_name, error_type, description, reporter_contact, suggested_correction, source_reference } = req.body;

    if (!medicine_id || !description) {
      return res.status(400).json({ error: 'medicine_id and description are required.' });
    }

    const report = ReportService.submitReport({
      medicine_id,
      medicine_name,
      error_type,
      description,
      reporter_contact,
      suggested_correction,
      source_reference
    });

    return res.status(201).json({
      success: true,
      message: 'Error report submitted successfully for clinical review.',
      report_id: report.report_id,
      submitted_at: report.submitted_at
    });
  } catch (err) {
    console.error('Error reporting endpoint failed:', err);
    return res.status(500).json({ error: err.message || 'Failed to submit error report' });
  }
});

app.get('/api/reports', (req, res) => {
  const reports = ReportService.getReports(req.query.status);
  return res.json({ total: reports.length, reports });
});

/**
 * 5. Categories Endpoint
 */
app.get('/api/categories', (req, res) => {
  return res.json({ categories: THERAPEUTIC_CATEGORIES });
});

/**
 * 6. Store Locator Endpoint
 */
app.get('/api/stores/nearby', (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  const cityFilter = (req.query.city || '').toLowerCase().trim();

  const userLocationProvided = !isNaN(lat) && !isNaN(lng);

  function enrichStores(storeList) {
    return storeList
      .filter(store => {
        if (!cityFilter || cityFilter === 'all locations') return true;
        return store.city.toLowerCase() === cityFilter;
      })
      .map(store => {
        let distance = null;
        if (userLocationProvided) {
          distance = calculateDistanceKm(lat, lng, store.lat, store.lng);
        }
        return {
          ...store,
          distance_km: distance,
          directions_url: getDirectionsUrl(store)
        };
      })
      .sort((a, b) => {
        if (a.distance_km !== null && b.distance_km !== null) {
          return a.distance_km - b.distance_km;
        }
        return 0;
      });
  }

  const enrichedJanAushadhi = enrichStores(STORE_DATABASE.jan_aushadhi || STORE_DATABASE.jan_aushadhi_kendras || []);
  const enrichedGeneral = enrichStores(STORE_DATABASE.general || STORE_DATABASE.general_pharmacies || []);

  return res.json({
    user_location: userLocationProvided ? { lat, lng } : null,
    total_found: enrichedJanAushadhi.length + enrichedGeneral.length,
    jan_aushadhi_kendras: enrichedJanAushadhi,
    general_pharmacies: enrichedGeneral
  });
});

/**
 * 7. System Stats Endpoint
 */
app.get('/api/stats', (req, res) => {
  const storeCount = (STORE_DATABASE.jan_aushadhi?.length || 0) + (STORE_DATABASE.general?.length || 0);
  return res.json({
    total_medicines: medicineData.medicines.length,
    total_groups: medicineData.groups?.length || 0,
    total_stores: storeCount,
    supported_jurisdictions: ['IN (CDSCO / PMBJP)', 'US (NLM RxNorm)', 'US (FDA NDC)'],
    last_updated: '2026-10-14'
  });
});

/**
 * 8. Strict OCR Prescription Image Reading Endpoint
 * Optical Character Recognition ONLY — does NOT generate side effects or unprompted medical prescriptions.
 */
app.post('/api/scan-prescription', async (req, res) => {
  try {
    if (!geminiModel) {
      return res.status(503).json({
        error: 'Prescription OCR service is not configured. GEMINI_API_KEY environment variable is required.'
      });
    }

    const { imageBase64, mimeType } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 is required' });
    }

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

    const result = await geminiModel.generateContent([prompt, imagePart]);
    const responseText = result.response.text();

    let extractedNames = [];
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        extractedNames = parsed.extracted_medicines || [];
      }
    } catch (parseErr) {
      console.warn('Failed to parse Gemini OCR JSON:', parseErr);
    }

    // Match extracted medicine names against database
    const matchedMedicines = [];
    for (const rawName of extractedNames) {
      const searchRes = await searchManager.search(rawName, { limit: 1 });
      const bestMatch = searchRes.results?.[0] || null;

      matchedMedicines.push({
        extracted_name: rawName,
        matched: bestMatch
      });
    }

    return res.json({
      extracted_names: extractedNames,
      medicines: matchedMedicines,
      total_extracted: extractedNames.length,
      total_matched: matchedMedicines.filter(m => m.matched).length
    });
  } catch (err) {
    console.error('Prescription OCR error:', err);
    return res.status(500).json({
      error: 'Failed to read prescription text. Please ensure clear focus and good lighting.'
    });
  }
});

// Production: Serve static client build files from client/dist
if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(CLIENT_DIST, 'index.html'));
    }
  });
  console.log(`🌐 Production static client build mounted from ${CLIENT_DIST}`);
}

app.listen(PORT, () => {
  console.log(`🏥 MediCompare Healthcare API Server running at http://localhost:${PORT}`);
});
