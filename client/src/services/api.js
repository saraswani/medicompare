import { MEDICINE_DATA } from '../data/medicinesData';
import { STORE_DATABASE, calculateDistanceKm, getDirectionsUrl } from '../data/pharmaciesData';

// Map indexes for instant client-side lookup fallback
const medicinesById = new Map();
const medicinesByGroup = new Map();

for (const med of MEDICINE_DATA.medicines) {
  medicinesById.set(med.id, med);
  if (!medicinesByGroup.has(med.composition_key)) {
    medicinesByGroup.set(med.composition_key, []);
  }
  medicinesByGroup.get(med.composition_key).push(med);
}

// Client-side fallback implementations:
function clientSearch(query, limit = 12) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return { query: '', results: [], total: 0 };

  const exactMatches = [];
  const startsWithMatches = [];
  const containsMatches = [];
  const saltMatches = [];

  for (const med of MEDICINE_DATA.medicines) {
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

  const combined = [...exactMatches, ...startsWithMatches, ...containsMatches, ...saltMatches];
  const seen = new Set();
  const deduped = [];
  for (const item of combined) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      deduped.push(item);
    }
    if (deduped.length >= limit) break;
  }

  return { query, total: deduped.length, results: deduped };
}

function clientGetMedicine(medicineId) {
  const targetMed = medicinesById.get(medicineId);
  if (!targetMed) return null;

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

  return {
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
  };
}

function clientGetStores(lat, lng, city, pincode) {
  const userLat = !isNaN(lat) && lat !== null ? lat : 28.6139;
  const userLng = !isNaN(lng) && lng !== null ? lng : 77.2090;

  const filterStore = (store) => {
    if (city && city !== 'All Locations' && store.city.toLowerCase().includes(city.toLowerCase())) return true;
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

  return {
    user_location: {
      lat: userLat,
      lng: userLng,
      is_default: isNaN(lat) || isNaN(lng) || lat === null
    },
    jan_aushadhi_kendras: janAushadhi,
    general_pharmacies: generalPharmacies,
    total_jan_aushadhi: janAushadhi.length,
    total_general: generalPharmacies.length
  };
}

// Unified API Service (Tries network API, falls back seamlessly to client data)
export const api = {
  async searchMedicines(query, limit = 8) {
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=${limit}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      // Fallback
    }
    return clientSearch(query, limit);
  },

  async getMedicineDetails(medicineId) {
    try {
      const res = await fetch(`/api/medicine/${encodeURIComponent(medicineId)}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      // Fallback
    }
    return clientGetMedicine(medicineId);
  },

  async getNearbyStores(lat, lng, city, pincode) {
    try {
      const params = new URLSearchParams();
      if (lat && lng) {
        params.append('lat', lat);
        params.append('lng', lng);
      }
      if (city && city !== 'All Locations') params.append('city', city);
      if (pincode) params.append('pincode', pincode);

      const res = await fetch(`/api/stores/nearby?${params.toString()}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      // Fallback
    }
    return clientGetStores(lat, lng, city, pincode);
  },

  async getCategories() {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      // Fallback
    }
    return {
      categories: [
        { id: 'fever-pain', title: 'Fever & Pain Relief', subtitle: 'Paracetamol, Ibuprofen, Aceclofenac', icon: 'Flame', color: 'from-orange-500 to-amber-500', sampleQuery: 'Dolo 650' },
        { id: 'diabetes', title: 'Diabetes Care', subtitle: 'Metformin, Vildagliptin, Glimepiride', icon: 'Activity', color: 'from-blue-500 to-cyan-500', sampleQuery: 'Glycomet 500' },
        { id: 'blood-pressure', title: 'Blood Pressure & Heart', subtitle: 'Telmisartan, Amlodipine, Atorvastatin', icon: 'HeartPulse', color: 'from-rose-500 to-red-500', sampleQuery: 'Telma 40' },
        { id: 'acidity', title: 'Acidity & Digestion', subtitle: 'Pantoprazole, Omeprazole, Rabeprazole', icon: 'ShieldAlert', color: 'from-emerald-500 to-teal-500', sampleQuery: 'Pan D' },
        { id: 'antibiotics', title: 'Antibiotics & Infections', subtitle: 'Augmentin, Azithral, Taxim-O', icon: 'Pill', color: 'from-purple-500 to-indigo-500', sampleQuery: 'Augmentin 625' },
        { id: 'allergies', title: 'Allergy & Respiratory', subtitle: 'Montair LC, Allegra 120, Cetzine', icon: 'Wind', color: 'from-sky-500 to-blue-600', sampleQuery: 'Montair LC' }
      ]
    };
  },

  async scanPrescription(imageFile) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = reader.result;
          const res = await fetch('/api/scan-prescription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image: base64,
              mimeType: imageFile.type || 'image/jpeg'
            })
          });
          if (res.ok) {
            return resolve(await res.json());
          }
          const errBody = await res.json().catch(() => ({}));
          reject(new Error(errBody.error || 'Scan failed'));
        } catch (e) {
          reject(e);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read image file'));
      reader.readAsDataURL(imageFile);
    });
  },

  async getStats() {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      // Fallback
    }
    return {
      total_medicines: MEDICINE_DATA.medicines.length,
      active_medicines: MEDICINE_DATA.medicines.filter(m => !m.is_discontinued).length,
      composition_groups: MEDICINE_DATA.groups.length,
      generics_count: MEDICINE_DATA.medicines.filter(m => m.generic_flag && !m.is_discontinued).length,
      average_savings_pct: 68
    };
  }
};
