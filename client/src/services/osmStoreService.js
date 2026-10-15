/**
 * Free & Open-Source Geospatial Pharmacy Service
 * Powered by OpenStreetMap (OSM), Overpass API, Nominatim, and Curated Indian Pharmacy Directory.
 * Zero paid API keys, zero Google Cloud billing.
 */

import { STORE_DATABASE } from '../data/pharmaciesData.js';

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://z.overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter'
];

const NOMINATIM_ENDPOINT = 'https://nominatim.openstreetmap.org/search';

// In-memory caches to respect provider rate limits & avoid repeated queries
const overpassCache = new Map();
const geocodeCache = new Map();

/**
 * Calculates straight-line (aerial) distance between two lat/lng coordinates in km using the Haversine formula.
 */
export function calculateStraightLineDistance(lat1, lon1, lat2, lon2) {
  if (lat1 === null || lon1 === null || lat2 === null || lon2 === null) return null;
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
}

/**
 * Categorizes a pharmacy into Jan Aushadhi, Generic Medicine Store, or Branded/Retail Pharmacy
 * based strictly on real verifiable tags without inventing claims.
 */
export function categorizePharmacy(tags = {}) {
  const name = (tags.name || '').toLowerCase();
  const operator = (tags.operator || '').toLowerCase();
  const brand = (tags.brand || '').toLowerCase();
  const combined = `${name} ${operator} ${brand}`;

  const isJanAushadhi = /jan\s*aushadhi|pmbjp|bhartiya\s*janaushadhi|janaushadhi/i.test(combined);
  if (isJanAushadhi) {
    return {
      category_id: 'jan_aushadhi',
      category_label: 'Jan Aushadhi Kendra (PMBJP)',
      badge_color: 'bg-emerald-50 text-emerald-800 border-emerald-300',
      badge_text: 'Jan Aushadhi (PMBJP)',
      verification_status: 'OSM_MAPPED_PMBJP',
      verification_label: 'Government Jan Aushadhi Scheme',
      is_generic_focused: true
    };
  }

  const isGeneric = /generic|dawaa|davakhana|generic\s*aadhaar|genericart|zeno\s*health|medkart|sanative/i.test(combined);
  if (isGeneric) {
    return {
      category_id: 'generic',
      category_label: 'Generic Medicine Store',
      badge_color: 'bg-sky-50 text-sky-800 border-sky-300',
      badge_text: 'Generic Medical',
      verification_status: 'OSM_MAPPED_GENERIC',
      verification_label: 'Generic Retailer',
      is_generic_focused: true
    };
  }

  return {
    category_id: 'branded',
    category_label: 'Retail Chemist & Medical',
    badge_color: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    badge_text: 'Retail Chemist',
    verification_status: 'OSM_MAPPED_PHARMACY',
    verification_label: 'Retail Chemist Shop',
    is_generic_focused: false
  };
}

/**
 * Builds a readable address string from OSM address tags
 */
function buildAddress(tags = {}) {
  if (tags['addr:full']) return tags['addr:full'];

  const parts = [];
  if (tags['addr:housenumber'] || tags['addr:housename']) {
    parts.push(tags['addr:housenumber'] || tags['addr:housename']);
  }
  if (tags['addr:street']) parts.push(tags['addr:street']);
  if (tags['addr:suburb'] || tags['addr:neighbourhood']) {
    parts.push(tags['addr:suburb'] || tags['addr:neighbourhood']);
  }
  if (tags['addr:city']) parts.push(tags['addr:city']);
  if (tags['addr:postcode']) parts.push(`PIN ${tags['addr:postcode']}`);

  return parts.length > 0 ? parts.join(', ') : 'Address available in map view';
}

/**
 * Converts curated directory pharmacies to standard pharmacy objects with distance calculations
 */
export function getDirectoryPharmacies(centerLat, centerLng, maxDistanceKm = 30) {
  const allDirectory = [
    ...(STORE_DATABASE.jan_aushadhi || []),
    ...(STORE_DATABASE.general_pharmacies || [])
  ];

  return allDirectory.map((store) => {
    const dist = calculateStraightLineDistance(centerLat, centerLng, store.lat, store.lng);
    const isJanAushadhi = store.type === 'jan_aushadhi';
    const isGeneric = store.is_generic || isJanAushadhi;

    return {
      id: `dir-${store.id}`,
      osm_id: store.id,
      osm_type: 'dir',
      name: store.name,
      lat: store.lat,
      lng: store.lng,
      address: store.address,
      postcode: store.pincode,
      city: store.city,
      opening_hours: store.hours || 'Mon-Sat: 9:00 AM - 9:00 PM',
      phone: store.phone || null,
      distance_km: dist,
      distance_type: 'aerial',
      directions_url: `https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lng}&destination_place_id=${encodeURIComponent(store.name)}`,
      osm_directions_url: `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${centerLat},${centerLng};${store.lat},${store.lng}`,
      osm_element_url: `https://www.openstreetmap.org/search?query=${encodeURIComponent(store.name + ' ' + store.city)}`,
      category_id: isJanAushadhi ? 'jan_aushadhi' : (isGeneric ? 'generic' : 'branded'),
      category_label: isJanAushadhi ? 'Jan Aushadhi Kendra (PMBJP)' : (isGeneric ? 'Generic Medicine Store' : 'Retail Chemist & Medical'),
      badge_color: isJanAushadhi 
        ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
        : (isGeneric ? 'bg-sky-50 text-sky-800 border-sky-300' : 'bg-indigo-50 text-indigo-800 border-indigo-200'),
      badge_text: isJanAushadhi ? 'Jan Aushadhi (PMBJP)' : (isGeneric ? 'Generic Medical' : 'Retail Chemist'),
      verification_status: 'VERIFIED_DIRECTORY',
      verification_label: isJanAushadhi ? 'PMBJP Scheme Outlet' : 'Licensed Retail Chemist',
      is_generic_focused: isGeneric
    };
  }).filter(store => store.distance_km !== null && store.distance_km <= maxDistanceKm);
}

/**
 * Geocodes an address, city, area, or PIN code using Nominatim.
 */
export async function geocodeLocation(query, signal) {
  const cleanQuery = String(query || '').trim();
  if (!cleanQuery) return null;

  const cacheKey = cleanQuery.toLowerCase();
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey);
  }

  // 1. Try serverless proxy endpoint first
  try {
    const res = await fetch(`/api/osm/geocode?q=${encodeURIComponent(cleanQuery)}`, { signal });
    if (res.ok) {
      const data = await res.json();
      if (data && data.found && data.result) {
        geocodeCache.set(cacheKey, data.result);
        return data.result;
      }
      if (data && data.found === false) {
        return null;
      }
    }
  } catch (e) {
    if (e.name === 'AbortError') throw e;
  }

  // 2. Direct Nominatim fallback
  const url = `${NOMINATIM_ENDPOINT}?q=${encodeURIComponent(cleanQuery)}&format=json&addressdetails=1&limit=5&countrycodes=in`;
  const headers = { 'Accept': 'application/json' };
  try {
    if (typeof window === 'undefined') {
      headers['User-Agent'] = 'MediCompare-College-Project/1.0';
    }
  } catch (e) {}

  const res = await fetch(url, { signal, headers });
  if (!res.ok) {
    throw new Error(`Geocoding failed with status ${res.status}`);
  }

  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) {
    return null;
  }

  const topResult = data[0];
  const parsed = {
    display_name: topResult.display_name,
    lat: parseFloat(topResult.lat),
    lng: parseFloat(topResult.lon),
    boundingbox: topResult.boundingbox,
    address: topResult.address || {},
    type: topResult.type
  };

  geocodeCache.set(cacheKey, parsed);
  return parsed;
}

/**
 * Fetches nearby pharmacies combining OpenStreetMap live data with curated directory pharmacies.
 * Guaranteed to return medical stores near the user's coordinates.
 */
export async function fetchNearbyPharmacies(lat, lng, radiusMeters = 5000, signal) {
  if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
    throw new Error('Valid geographic coordinates are required');
  }

  const radiusKm = radiusMeters / 1000;
  const cacheKey = `${lat.toFixed(3)}_${lng.toFixed(3)}_${radiusMeters}`;
  if (overpassCache.has(cacheKey)) {
    const cached = overpassCache.get(cacheKey);
    return recalculateDistances(cached, lat, lng);
  }

  // 1. Gather all nearby directory pharmacies immediately as a dependable baseline
  const directoryStores = getDirectoryPharmacies(lat, lng, Math.max(radiusKm * 1.5, 25));

  // 2. Query live OpenStreetMap Overpass with a fast timeout (6 seconds)
  let osmStores = [];

  // Try serverless backend proxy first
  try {
    const proxyUrl = `/api/osm/pharmacies?lat=${lat}&lng=${lng}&radius=${radiusMeters}`;
    const timeoutController = new AbortController();
    const timer = setTimeout(() => timeoutController.abort(), 6000);

    const res = await fetch(proxyUrl, { 
      signal: signal ? AbortSignal.any([signal, timeoutController.signal]) : timeoutController.signal 
    });
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.elements)) {
        osmStores = processOsmElements(data.elements, lat, lng);
      }
    }
  } catch (e) {
    // If proxy failed or timed out, attempt direct Overpass mirror with short timeout
    if (e.name !== 'AbortError' || (signal && !signal.aborted)) {
      osmStores = await fetchDirectOverpass(lat, lng, radiusMeters, signal).catch(() => []);
    }
  }

  // 3. Merge OSM live stores with Directory stores, deduplicating by proximity (within ~100m) or name
  const combined = [...osmStores];
  const seenNames = new Set(osmStores.map(s => s.name.toLowerCase().trim()));

  for (const dirStore of directoryStores) {
    const nameKey = dirStore.name.toLowerCase().trim();
    // Check if store with same name or within 150m is already in the list
    const isDuplicate = osmStores.some(osm => {
      const distBetween = calculateStraightLineDistance(osm.lat, osm.lng, dirStore.lat, dirStore.lng);
      return (distBetween !== null && distBetween < 0.2) || seenNames.has(nameKey);
    });

    if (!isDuplicate) {
      combined.push(dirStore);
    }
  }

  // Sort strictly by proximity
  combined.sort((a, b) => (a.distance_km || 0) - (b.distance_km || 0));

  // If combined results are empty (e.g. strict radius was too small), take the closest available directory stores
  let finalResults = combined;
  if (finalResults.length === 0) {
    const closestEver = getDirectoryPharmacies(lat, lng, 100);
    finalResults = closestEver.slice(0, 8);
  }

  overpassCache.set(cacheKey, finalResults);
  return finalResults;
}

/**
 * Direct Overpass mirror caller with rapid failover
 */
async function fetchDirectOverpass(lat, lng, radiusMeters, signal) {
  const query = `
    [out:json][timeout:8];
    (
      node["amenity"="pharmacy"](around:${radiusMeters},${lat},${lng});
      way["amenity"="pharmacy"](around:${radiusMeters},${lat},${lng});
      node["shop"="chemist"](around:${radiusMeters},${lat},${lng});
      way["shop"="chemist"](around:${radiusMeters},${lat},${lng});
      node["shop"="pharmacy"](around:${radiusMeters},${lat},${lng});
      way["shop"="pharmacy"](around:${radiusMeters},${lat},${lng});
      node["shop"="medical"](around:${radiusMeters},${lat},${lng});
      way["shop"="medical"](around:${radiusMeters},${lat},${lng});
      node["healthcare"="pharmacy"](around:${radiusMeters},${lat},${lng});
      way["healthcare"="pharmacy"](around:${radiusMeters},${lat},${lng});
    );
    out center tags;
  `.replace(/\s+/g, ' ').trim();

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const timeoutController = new AbortController();
      const timer = setTimeout(() => timeoutController.abort(), 6000);

      const headers = {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'Accept': 'application/json'
      };
      if (typeof window === 'undefined') {
        headers['User-Agent'] = 'MediCompare-College-Project/1.0';
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        body: `data=${encodeURIComponent(query)}`,
        headers,
        signal: signal ? AbortSignal.any([signal, timeoutController.signal]) : timeoutController.signal
      });
      clearTimeout(timer);

      if (!res.ok) continue;

      const json = await res.json();
      if (json && Array.isArray(json.elements)) {
        return processOsmElements(json.elements, lat, lng);
      }
    } catch (err) {
      if (signal && signal.aborted) throw err;
    }
  }

  return [];
}

/**
 * Processes and deduplicates raw OSM elements
 */
function processOsmElements(elements, centerLat, centerLng) {
  const seenIds = new Set();
  const results = [];

  for (const el of elements) {
    const uniqueId = `osm-${el.type}-${el.id}`;
    if (seenIds.has(uniqueId)) continue;
    seenIds.add(uniqueId);

    const itemLat = el.lat !== undefined ? el.lat : el.center?.lat;
    const itemLng = el.lon !== undefined ? el.lon : el.center?.lon;
    if (itemLat === undefined || itemLng === undefined) continue;

    const tags = el.tags || {};
    const name = tags.name || tags['name:en'] || tags.brand || tags.operator || 'Medical Store / Chemist';
    const address = buildAddress(tags);
    const categoryInfo = categorizePharmacy(tags);
    const distanceKm = calculateStraightLineDistance(centerLat, centerLng, itemLat, itemLng);

    results.push({
      id: uniqueId,
      osm_id: el.id,
      osm_type: el.type,
      name,
      lat: itemLat,
      lng: itemLng,
      address,
      postcode: tags['addr:postcode'] || null,
      city: tags['addr:city'] || null,
      opening_hours: tags.opening_hours || 'Mon-Sat: 9:00 AM - 9:00 PM',
      phone: tags.phone || tags['contact:phone'] || null,
      distance_km: distanceKm,
      distance_type: 'aerial',
      directions_url: `https://www.google.com/maps/dir/?api=1&destination=${itemLat},${itemLng}&destination_place_id=${encodeURIComponent(name)}`,
      osm_directions_url: `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${centerLat},${centerLng};${itemLat},${itemLng}`,
      osm_element_url: `https://www.openstreetmap.org/${el.type}/${el.id}`,
      ...categoryInfo
    });
  }

  return results.sort((a, b) => (a.distance_km || 0) - (b.distance_km || 0));
}

function recalculateDistances(list, lat, lng) {
  return list.map(item => ({
    ...item,
    distance_km: calculateStraightLineDistance(lat, lng, item.lat, item.lng)
  })).sort((a, b) => (a.distance_km || 0) - (b.distance_km || 0));
}
