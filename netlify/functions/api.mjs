// Netlify Serverless Function v2 for MediCompare API
import { MASTER_MEDICINE_DATA } from '../../server/scripts/build_full_dataset.js';
import { processMedicineDataset } from '../../server/scripts/seed.js';
import { STORE_DATABASE, calculateDistanceKm, getDirectionsUrl } from '../../server/data/pharmacies.js';

const processed = processMedicineDataset(MASTER_MEDICINE_DATA);
const medicinesById = new Map();
const medicinesByGroup = new Map();

for (const med of processed.medicines) {
  medicinesById.set(med.id, med);
  if (!medicinesByGroup.has(med.composition_key)) {
    medicinesByGroup.set(med.composition_key, []);
  }
  medicinesByGroup.get(med.composition_key).push(med);
}

export default async (req, context) => {
  const url = new URL(req.url);
  const pathname = url.pathname;
  const searchParams = url.searchParams;

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  // 1. /api/search?q=
  if (pathname.includes('/search')) {
    const query = (searchParams.get('q') || '').trim().toLowerCase();
    const limit = Math.min(parseInt(searchParams.get('limit') || '12', 10), 50);

    if (!query) {
      return new Response(JSON.stringify({ query: '', results: [], total: 0 }), { headers });
    }

    const exact = [];
    const starts = [];
    const contains = [];

    for (const med of processed.medicines) {
      if (med.is_discontinued) continue;
      const n = med.name.toLowerCase();
      const c = med.display_composition.toLowerCase();
      const m = med.manufacturer_name.toLowerCase();

      if (n === query) exact.push(med);
      else if (n.startsWith(query)) starts.push(med);
      else if (n.includes(query) || c.includes(query) || m.includes(query)) contains.push(med);
    }

    const combined = [...exact, ...starts, ...contains];
    const seen = new Set();
    const results = [];
    for (const item of combined) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        results.push(item);
      }
      if (results.length >= limit) break;
    }

    return new Response(JSON.stringify({ query, total: results.length, results }), { headers });
  }

  // 2. /api/medicine/:id
  const matchMed = pathname.match(/\/medicine\/([^/]+)/);
  if (matchMed) {
    const medId = decodeURIComponent(matchMed[1]);
    const targetMed = medicinesById.get(medId);

    if (!targetMed) {
      return new Response(JSON.stringify({ error: 'Medicine not found' }), { status: 404, headers });
    }

    const allGroup = medicinesByGroup.get(targetMed.composition_key) || [targetMed];
    const active = allGroup.filter(m => !m.is_discontinued).sort((a, b) => a.unit_price - b.unit_price);
    const cheapest = active[0] || targetMed;

    const diffUnit = Math.max(0, targetMed.unit_price - cheapest.unit_price);
    const diffPack = parseFloat((diffUnit * targetMed.pack_unit_count).toFixed(2));
    const savingsPct = targetMed.unit_price > 0 
      ? Math.round(((targetMed.unit_price - cheapest.unit_price) / targetMed.unit_price) * 100)
      : 0;

    const data = {
      medicine: targetMed,
      composition_key: targetMed.composition_key,
      shared_composition: targetMed.display_composition,
      salts: targetMed.salts,
      cheapest_option: cheapest,
      savings: {
        has_savings: diffUnit > 0.05 && targetMed.id !== cheapest.id,
        savings_percentage: Math.max(0, savingsPct),
        savings_per_unit: parseFloat(diffUnit.toFixed(2)),
        savings_per_pack: diffPack,
        target_unit_price: targetMed.unit_price,
        cheapest_unit_price: cheapest.unit_price,
        pack_unit_count: targetMed.pack_unit_count,
        pack_unit_type: targetMed.pack_unit_type
      },
      total_alternatives: active.length,
      alternatives: active.map(alt => {
        const altDiff = Math.max(0, targetMed.unit_price - alt.unit_price);
        const altPct = targetMed.unit_price > 0 ? Math.round((altDiff / targetMed.unit_price) * 100) : 0;
        return {
          ...alt,
          is_current_selection: alt.id === targetMed.id,
          savings_vs_target_pct: Math.max(0, altPct),
          savings_vs_target_unit: parseFloat(altDiff.toFixed(2)),
          savings_vs_target_pack: parseFloat((altDiff * alt.pack_unit_count).toFixed(2))
        };
      })
    };

    return new Response(JSON.stringify(data), { headers });
  }

  // 3. /api/stores/nearby
  if (pathname.includes('/stores')) {
    const lat = parseFloat(searchParams.get('lat'));
    const lng = parseFloat(searchParams.get('lng'));
    const city = (searchParams.get('city') || '').toLowerCase();
    const pincode = searchParams.get('pincode') || '';

    const userLat = !isNaN(lat) ? lat : 28.6139;
    const userLng = !isNaN(lng) ? lng : 77.2090;

    const filterStore = (s) => {
      if (city && city !== 'all locations' && s.city.toLowerCase().includes(city)) return true;
      if (pincode && s.pincode.startsWith(pincode.substring(0, 3))) return true;
      return true;
    };

    const mapStore = (s) => ({
      ...s,
      distance_km: calculateDistanceKm(userLat, userLng, s.lat, s.lng),
      directions_url: getDirectionsUrl(s.name, s.lat, s.lng, s.address)
    });

    const jak = STORE_DATABASE.jan_aushadhi.filter(filterStore).map(mapStore).sort((a, b) => a.distance_km - b.distance_km);
    const gen = STORE_DATABASE.general_pharmacies.filter(filterStore).map(mapStore).sort((a, b) => a.distance_km - b.distance_km);

    return new Response(JSON.stringify({
      user_location: { lat: userLat, lng: userLng, is_default: isNaN(lat) },
      jan_aushadhi_kendras: jak,
      general_pharmacies: gen
    }), { headers });
  }

  // 4. /api/stats
  if (pathname.includes('/stats')) {
    return new Response(JSON.stringify({
      total_medicines: processed.medicines.length,
      active_medicines: processed.medicines.filter(m => !m.is_discontinued).length,
      composition_groups: processed.groups.length,
      generics_count: processed.medicines.filter(m => m.generic_flag).length,
      average_savings_pct: 68
    }), { headers });
  }

  return new Response(JSON.stringify({ message: 'MediCompare API ready' }), { headers });
};

export const config = {
  path: "/api/*"
};
