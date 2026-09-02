import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildAndSeedFullDataset } from './scripts/build_full_dataset.js';
import { STORE_DATABASE, calculateDistanceKm, getDirectionsUrl } from './data/pharmacies.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'data', 'processed_medicines.json');
const CLIENT_DIST = path.join(__dirname, '..', 'client', 'dist');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// In-memory indexed data store
let medicineData = { medicines: [], groups: [] };
let medicinesById = new Map();
let medicinesByGroup = new Map();

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

  medicinesById.clear();
  medicinesByGroup.clear();

  for (const med of medicineData.medicines) {
    medicinesById.set(med.id, med);
    if (!medicinesByGroup.has(med.composition_key)) {
      medicinesByGroup.set(med.composition_key, []);
    }
    medicinesByGroup.get(med.composition_key).push(med);
  }

  console.log(`🚀 Loaded ${medicineData.medicines.length} medicines into memory (${medicinesByGroup.size} composition groups).`);
}

// Initial data load
loadOrSeedData();

// Curated Popular Categories
const THERAPEUTIC_CATEGORIES = [
  {
    id: 'fever-pain',
    title: 'Fever & Pain Relief',
    subtitle: 'Paracetamol, Ibuprofen, Aceclofenac, Diclofenac',
    icon: 'Flame',
    color: 'from-orange-500 to-amber-500',
    sampleQuery: 'Dolo 650'
  },
  {
    id: 'diabetes',
    title: 'Diabetes Care',
    subtitle: 'Metformin, Vildagliptin, Glimepiride, Sitagliptin',
    icon: 'Activity',
    color: 'from-blue-500 to-cyan-500',
    sampleQuery: 'Glycomet 500'
  },
  {
    id: 'blood-pressure',
    title: 'Blood Pressure & Heart',
    subtitle: 'Telmisartan, Amlodipine, Atorvastatin, Rosuvastatin',
    icon: 'HeartPulse',
    color: 'from-rose-500 to-red-500',
    sampleQuery: 'Telma 40'
  },
  {
    id: 'acidity',
    title: 'Acidity & Digestion',
    subtitle: 'Pantoprazole, Omeprazole, Rabeprazole',
    icon: 'ShieldAlert',
    color: 'from-emerald-500 to-teal-500',
    sampleQuery: 'Pan D'
  },
  {
    id: 'antibiotics',
    title: 'Antibiotics & Infections',
    subtitle: 'Augmentin, Azithral, Taxim-O, Ceftum',
    icon: 'Pill',
    color: 'from-purple-500 to-indigo-500',
    sampleQuery: 'Augmentin 625'
  },
  {
    id: 'allergies',
    title: 'Allergy & Respiratory',
    subtitle: 'Montair LC, Allegra 120, Cetzine 10',
    icon: 'Wind',
    color: 'from-sky-500 to-blue-600',
    sampleQuery: 'Montair LC'
  }
];

// 1. Search Endpoint with Type-ahead Autocomplete
app.get('/api/search', (req, res) => {
  const query = String(req.query.q || '').trim().toLowerCase();
  const limit = Math.min(parseInt(req.query.limit, 10) || 12, 50);
  const includeDiscontinued = req.query.includeDiscontinued === 'true';

  if (!query) {
    return res.json({ query: '', results: [], total: 0 });
  }

  const activePool = medicineData.medicines.filter(m => includeDiscontinued || !m.is_discontinued);

  const exactMatches = [];
  const startsWithMatches = [];
  const containsMatches = [];
  const saltMatches = [];

  for (const med of activePool) {
    const nameLower = med.name.toLowerCase();
    const compLower = med.display_composition.toLowerCase();
    const mfgLower = med.manufacturer_name.toLowerCase();

    if (nameLower === query) {
      exactMatches.push(med);
    } else if (nameLower.startsWith(query)) {
      startsWithMatches.push(med);
    } else if (nameLower.includes(query) || mfgLower.includes(query)) {
      containsMatches.push(med);
    } else if (compLower.includes(query)) {
      saltMatches.push(med);
    }
  }

  const combined = [
    ...exactMatches,
    ...startsWithMatches,
    ...containsMatches,
    ...saltMatches
  ];

  const seen = new Set();
  const deduped = [];
  for (const item of combined) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      deduped.push(item);
    }
    if (deduped.length >= limit) break;
  }

  return res.json({
    query: req.query.q,
    total: deduped.length,
    results: deduped.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      unit_price: item.unit_price,
      pack_size_label: item.pack_size_label,
      manufacturer_name: item.manufacturer_name,
      display_composition: item.display_composition,
      badge_type: item.badge_type,
      generic_flag: item.generic_flag,
      is_cheapest: item.is_cheapest,
      composition_key: item.composition_key
    }))
  });
});

// 2. Medicine Details & Full Comparison Group Endpoint
app.get('/api/medicine/:id', (req, res) => {
  const medicineId = req.params.id;
  const targetMed = medicinesById.get(medicineId);

  if (!targetMed) {
    return res.status(404).json({ error: 'Medicine not found' });
  }

  const allGroupMeds = medicinesByGroup.get(targetMed.composition_key) || [targetMed];

  const activeAlternatives = allGroupMeds
    .filter(m => !m.is_discontinued)
    .sort((a, b) => a.unit_price - b.unit_price);

  const cheapestOption = activeAlternatives[0] || targetMed;

  const priceDiffPerUnit = Math.max(0, targetMed.unit_price - cheapestOption.unit_price);
  const priceDiffPerPack = parseFloat((priceDiffPerUnit * targetMed.pack_unit_count).toFixed(2));
  const savingsPct = targetMed.unit_price > 0 
    ? Math.round(((targetMed.unit_price - cheapestOption.unit_price) / targetMed.unit_price) * 100)
    : 0;

  const hasSavings = priceDiffPerUnit > 0.05 && targetMed.id !== cheapestOption.id;

  return res.json({
    medicine: targetMed,
    composition_key: targetMed.composition_key,
    shared_composition: targetMed.display_composition,
    salts: targetMed.salts,
    cheapest_option: cheapestOption,
    savings: {
      has_savings: hasSavings,
      savings_percentage: Math.max(0, savingsPct),
      savings_per_unit: parseFloat(priceDiffPerUnit.toFixed(2)),
      savings_per_pack: priceDiffPerPack,
      target_unit_price: targetMed.unit_price,
      cheapest_unit_price: cheapestOption.unit_price,
      pack_unit_count: targetMed.pack_unit_count,
      pack_unit_type: targetMed.pack_unit_type
    },
    total_alternatives: activeAlternatives.length,
    alternatives: activeAlternatives.map(alt => {
      const altDiffPerUnit = Math.max(0, targetMed.unit_price - alt.unit_price);
      const altSavingsPct = targetMed.unit_price > 0
        ? Math.round(((targetMed.unit_price - alt.unit_price) / targetMed.unit_price) * 100)
        : 0;

      return {
        ...alt,
        is_current_selection: alt.id === targetMed.id,
        savings_vs_target_pct: Math.max(0, altSavingsPct),
        savings_vs_target_unit: parseFloat(altDiffPerUnit.toFixed(2)),
        savings_vs_target_pack: parseFloat((altDiffPerUnit * alt.pack_unit_count).toFixed(2))
      };
    })
  });
});

// 3. Categories Endpoint
app.get('/api/categories', (req, res) => {
  return res.json({ categories: THERAPEUTIC_CATEGORIES });
});

// 4. Store Locator Endpoint
app.get('/api/stores/nearby', (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  const city = String(req.query.city || '').trim().toLowerCase();
  const pincode = String(req.query.pincode || '').trim();

  const userLat = !isNaN(lat) ? lat : 28.6139;
  const userLng = !isNaN(lng) ? lng : 77.2090;

  const filterStore = (store) => {
    if (city && store.city.toLowerCase().includes(city)) return true;
    if (pincode && store.pincode.startsWith(pincode.substring(0, 3))) return true;
    return true;
  };

  const mapWithDistance = (store) => {
    const dist = calculateDistanceKm(userLat, userLng, store.lat, store.lng);
    return {
      ...store,
      distance_km: dist,
      directions_url: getDirectionsUrl(store.name, store.lat, store.lng, store.address)
    };
  };

  const janAushadhi = STORE_DATABASE.jan_aushadhi
    .filter(filterStore)
    .map(mapWithDistance)
    .sort((a, b) => a.distance_km - b.distance_km);

  const generalPharmacies = STORE_DATABASE.general_pharmacies
    .filter(filterStore)
    .map(mapWithDistance)
    .sort((a, b) => a.distance_km - b.distance_km);

  return res.json({
    user_location: {
      lat: userLat,
      lng: userLng,
      is_default: isNaN(lat) || isNaN(lng)
    },
    jan_aushadhi_kendras: janAushadhi,
    general_pharmacies: generalPharmacies,
    total_jan_aushadhi: janAushadhi.length,
    total_general: generalPharmacies.length
  });
});

// 5. System Stats
app.get('/api/stats', (req, res) => {
  const totalMeds = medicineData.medicines.length;
  const activeMeds = medicineData.medicines.filter(m => !m.is_discontinued).length;
  const totalGroups = medicinesByGroup.size;
  const genericCount = medicineData.medicines.filter(m => m.generic_flag && !m.is_discontinued).length;

  return res.json({
    total_medicines: totalMeds,
    active_medicines: activeMeds,
    composition_groups: totalGroups,
    generics_count: genericCount,
    average_savings_pct: 68
  });
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
  console.log(`🏥 MediCompare API server running at http://localhost:${PORT}`);
});
