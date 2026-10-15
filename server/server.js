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
import { PrescriptionOcrService } from './services/prescriptionOcr.js';

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
  console.log('🔑 Gemini Vision API initialized for accelerated OCR.');
} else {
  console.log('📄 Using built-in local Tesseract OCR & Indian Pharmacopoeia Lexicon matcher (zero external API keys required).');
}

// In-memory indexed data store, Multi-source Search Manager & OCR Service
let medicineData = { medicines: [], groups: [] };
let searchManager = null;
let ocrService = null;

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

  if (!ocrService) {
    ocrService = new PrescriptionOcrService(medicineData, searchManager, geminiModel);
  } else {
    ocrService.updateData(medicineData);
    ocrService.setGeminiModel(geminiModel);
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
 * 6b. OpenStreetMap Geocoding & Overpass Proxy Endpoints
 * Fully compliant with Nominatim & Overpass usage policies (with User-Agent & caching)
 */
const osmServerCache = new Map();

app.get('/api/osm/geocode', async (req, res) => {
  const query = String(req.query.q || '').trim();
  if (!query) return res.status(400).json({ error: 'Query parameter q is required' });

  const cacheKey = `geo_${query.toLowerCase()}`;
  if (osmServerCache.has(cacheKey)) {
    return res.json(osmServerCache.get(cacheKey));
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5&countrycodes=in`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'MediCompare-College-Project/1.0 (saraswani@medicompare.local)',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Nominatim geocoding failed' });
    }

    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) {
      return res.json({ found: false, result: null });
    }

    const top = data[0];
    const result = {
      found: true,
      result: {
        display_name: top.display_name,
        lat: parseFloat(top.lat),
        lng: parseFloat(top.lon),
        address: top.address || {},
        type: top.type
      }
    };

    osmServerCache.set(cacheKey, result);
    return res.json(result);
  } catch (err) {
    console.error('Server Nominatim proxy error:', err);
    return res.status(500).json({ error: 'Failed to geocode address' });
  }
});

app.get('/api/osm/pharmacies', async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  const radius = parseInt(req.query.radius, 10) || 5000;

  if (isNaN(lat) || isNaN(lng)) {
    return res.status(400).json({ error: 'Valid lat and lng required' });
  }

  const cacheKey = `osm_${lat.toFixed(3)}_${lng.toFixed(3)}_${radius}`;
  if (osmServerCache.has(cacheKey)) {
    return res.json(osmServerCache.get(cacheKey));
  }

  const query = `
    [out:json][timeout:15];
    (
      node["amenity"="pharmacy"](around:${radius},${lat},${lng});
      way["amenity"="pharmacy"](around:${radius},${lat},${lng});
      node["healthcare"="pharmacy"](around:${radius},${lat},${lng});
      way["healthcare"="pharmacy"](around:${radius},${lat},${lng});
      node["shop"="chemist"](around:${radius},${lat},${lng});
      way["shop"="chemist"](around:${radius},${lat},${lng});
    );
    out center tags;
  `.replace(/\s+/g, ' ').trim();

  const mirrors = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://maps.mail.ru/osm/tools/overpass/api/interpreter'
  ];

  for (const endpoint of mirrors) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        body: `data=${encodeURIComponent(query)}`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          'User-Agent': 'MediCompare-College-Project/1.0 (saraswani@medicompare.local)',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) continue;
      const data = await response.json();
      const output = { elements: data.elements || [] };
      osmServerCache.set(cacheKey, output);
      return res.json(output);
    } catch (e) {
      console.warn(`Overpass mirror ${endpoint} failed on server, trying next:`, e.message);
    }
  }

  return res.status(502).json({ error: 'Overpass API service temporarily unavailable' });
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
 * Multi-Tier Engine:
 * - Tier 1: Gemini Vision (if configured)
 * - Tier 2: Free local Tesseract.js OCR
 * - Tier 3: Indian Pharmacopoeia Lexicon matcher
 */
app.post('/api/scan-prescription', async (req, res) => {
  try {
    const { imageBase64, mimeType, fileName } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 is required' });
    }

    if (!ocrService) {
      ocrService = new PrescriptionOcrService(medicineData, searchManager, geminiModel);
    }

    const scanResult = await ocrService.scanPrescriptionImage(imageBase64, mimeType, { fileName });
    return res.json(scanResult);
  } catch (err) {
    console.error('Prescription OCR error:', err);
    return res.status(500).json({
      error: 'Failed to read prescription text. Please ensure clear focus and good lighting.'
    });
  }
});

// Production: Serve static client build files from client/dist (when running as standalone server)
if (!process.env.VERCEL && fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(CLIENT_DIST, 'index.html'));
    }
  });
  console.log(`🌐 Production static client build mounted from ${CLIENT_DIST}`);
}

export default app;

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🏥 MediCompare Healthcare API Server running at http://localhost:${PORT}`);
  });
}
