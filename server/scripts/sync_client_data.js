import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { MASTER_MEDICINE_DATA } from './build_full_dataset.js';
import { processMedicineDataset } from './seed.js';
import { STORE_DATABASE } from '../data/pharmacies.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CLIENT_DATA_DIR = path.join(__dirname, '..', '..', 'client', 'src', 'data');
const NETLIFY_DATA_DIR = path.join(__dirname, '..', '..', 'netlify', 'functions');

if (!fs.existsSync(CLIENT_DATA_DIR)) {
  fs.mkdirSync(CLIENT_DATA_DIR, { recursive: true });
}
if (!fs.existsSync(NETLIFY_DATA_DIR)) {
  fs.mkdirSync(NETLIFY_DATA_DIR, { recursive: true });
}

// Process dataset
const processed = processMedicineDataset(MASTER_MEDICINE_DATA);

// 1. Write client/src/data/medicinesData.js
const clientMedicineDataContent = `// Bundled Master Medicine Dataset for Zero-Config Netlify & Static Deployments
export const MEDICINE_DATA = ${JSON.stringify(processed, null, 2)};
`;

fs.writeFileSync(path.join(CLIENT_DATA_DIR, 'medicinesData.js'), clientMedicineDataContent, 'utf8');

// 2. Write client/src/data/pharmaciesData.js
const clientPharmaciesDataContent = `// Bundled Pharmacy and Jan Aushadhi Kendra Directory for Netlify & Offline Mode
export const STORE_DATABASE = ${JSON.stringify(STORE_DATABASE, null, 2)};

export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
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

export function getDirectionsUrl(storeName, lat, lng, address) {
  if (lat && lng) {
    return \`https://www.google.com/maps/dir/?api=1&destination=\${lat},\${lng}&destination_place_id=\${encodeURIComponent(storeName)}\`;
  }
  return \`https://www.google.com/maps/search/?api=1&query=\${encodeURIComponent(storeName + ', ' + address)}\`;
}
`;

fs.writeFileSync(path.join(CLIENT_DATA_DIR, 'pharmaciesData.js'), clientPharmaciesDataContent, 'utf8');

console.log('✅ Synchronized dataset to client/src/data/ for 100% resilient Netlify deployment.');
