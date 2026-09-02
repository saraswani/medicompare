import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Known generic / low-cost manufacturer signatures in India
const GENERIC_MANUFACTURERS = [
  'pradhan mantri',
  'janaushadhi',
  'bppi',
  'pmbjp',
  'zee laboratories',
  'zee labs',
  'jagsonpal',
  'cipla genepharm',
  'cipla generics',
  'centaur',
  'mankind generics',
  'dawaa dost',
  'stayhappi',
  'genericart',
  'medlife generics',
  'lifeline generics',
  'dr reddy generic',
  'abbott generic',
  'cadila generics'
];

// Helper to parse pack size to numeric count
export function parsePackSize(label) {
  if (!label) return { count: 1, unit: 'unit', display: '1 unit' };
  const str = String(label).toLowerCase().trim();

  // "strip of 15 tablets" -> 15
  let match = str.match(/(?:strip|box|pack|blister)\s+of\s+(\d+)\s*([a-z]+)?/);
  if (match) {
    const count = parseInt(match[1], 10);
    const unit = match[2] || 'tablets';
    return { count: count > 0 ? count : 1, unit, display: label };
  }

  // "10 tablets" or "15 capsules"
  match = str.match(/(\d+)\s*(tablets?|capsules?|pills?|sachets?|ampoules?|vials?|injections?|patches?)/);
  if (match) {
    const count = parseInt(match[1], 10);
    return { count: count > 0 ? count : 1, unit: match[2], display: label };
  }

  // "bottle of 100 ml" or "100 ml"
  match = str.match(/(\d+(?:\.\d+)?)\s*(ml|l|gm|g|mg|drop|suspension|syrup)/);
  if (match) {
    const count = parseFloat(match[1]);
    return { count: count > 0 ? count : 1, unit: match[2], display: label };
  }

  // Just numeric match
  match = str.match(/(\d+)/);
  if (match) {
    const count = parseInt(match[1], 10);
    return { count: count > 0 ? count : 1, unit: 'units', display: label };
  }

  return { count: 1, unit: 'unit', display: label };
}

// Normalization function: normalize compositions into canonical key
export function normalizeComposition(comp1, comp2) {
  const parts = [];
  if (comp1 && String(comp1).trim()) parts.push(String(comp1).trim());
  if (comp2 && String(comp2).trim()) parts.push(String(comp2).trim());

  if (parts.length === 0) return { key: 'unknown', display: 'Not specified', salts: [] };

  const rawString = parts.join(' + ');
  // Split multiple salts if combined in single string with + or /
  const individualSalts = rawString.split(/\s*\+\s*|\s*\/\s*/).map(s => s.trim()).filter(Boolean);

  const parsedSalts = individualSalts.map(s => {
    // Extract salt name and strength, e.g. "Paracetamol (650mg)" -> name: "paracetamol", strength: "650mg"
    const match = s.match(/^([^(]+)(?:\(([^)]+)\))?/);
    if (match) {
      const name = match[1].trim();
      const strength = match[2] ? match[2].trim() : '';
      return {
        raw: s,
        name: name,
        strength: strength,
        normalizedName: name.toLowerCase().replace(/[^a-z0-9]/g, '')
      };
    }
    return {
      raw: s,
      name: s,
      strength: '',
      normalizedName: s.toLowerCase().replace(/[^a-z0-9]/g, '')
    };
  });

  // Sort salts alphabetically for consistent grouping key
  const sorted = [...parsedSalts].sort((a, b) => a.normalizedName.localeCompare(b.normalizedName));
  const key = sorted.map(s => `${s.normalizedName}${s.strength ? '-' + s.strength.toLowerCase().replace(/\s+/g, '') : ''}`).join('+');
  const display = parsedSalts.map(s => s.raw).join(' + ');

  return { key, display, salts: parsedSalts };
}

// Check if medicine is generic based on manufacturer
export function isGenericManufacturer(mfgName) {
  if (!mfgName) return false;
  const lower = String(mfgName).toLowerCase();
  return GENERIC_MANUFACTURERS.some(m => lower.includes(m));
}

// Comprehensive initial Indian Medicine Seed Data (curated real dataset)
export const RAW_MEDICINE_DATA = [
  // Paracetamol 650mg
  {
    id: 'MED001',
    name: 'Dolo 650 Tablet',
    price: 33.60,
    Is_discontinued: false,
    manufacturer_name: 'Micro Labs Ltd',
    type: 'allopathy',
    pack_size_label: 'strip of 15 tablets',
    short_composition1: 'Paracetamol (650mg)',
    short_composition2: ''
  },
  {
    id: 'MED002',
    name: 'Calpol 650 Tablet',
    price: 31.00,
    Is_discontinued: false,
    manufacturer_name: 'GlaxoSmithKline Pharmaceuticals Ltd',
    type: 'allopathy',
    pack_size_label: 'strip of 15 tablets',
    short_composition1: 'Paracetamol (650mg)',
    short_composition2: ''
  },
  {
    id: 'MED003',
    name: 'Crocin 650 Tablet',
    price: 32.50,
    Is_discontinued: false,
    manufacturer_name: 'GlaxoSmithKline Pharmaceuticals Ltd',
    type: 'allopathy',
    pack_size_label: 'strip of 15 tablets',
    short_composition1: 'Paracetamol (650mg)',
    short_composition2: ''
  },
  {
    id: 'MED004',
    name: 'Pacimol 650 Tablet',
    price: 30.00,
    Is_discontinued: false,
    manufacturer_name: 'Ipca Laboratories Ltd',
    type: 'allopathy',
    pack_size_label: 'strip of 15 tablets',
    short_composition1: 'Paracetamol (650mg)',
    short_composition2: ''
  },
  {
    id: 'MED005',
    name: 'P-650 Tablet',
    price: 21.00,
    Is_discontinued: false,
    manufacturer_name: 'Apex Laboratories Pvt Ltd',
    type: 'allopathy',
    pack_size_label: 'strip of 10 tablets',
    short_composition1: 'Paracetamol (650mg)',
    short_composition2: ''
  },
  {
    id: 'MED006',
    name: 'Paracetamol 650 Jan Aushadhi',
    price: 8.50,
    Is_discontinued: false,
    manufacturer_name: 'Pradhan Mantri Bhartiya Janaushadhi Pariyojana',
    type: 'allopathy',
    pack_size_label: 'strip of 10 tablets',
    short_composition1: 'Paracetamol (650mg)',
    short_composition2: ''
  },
  {
    id: 'MED007',
    name: 'Zee Paracetamol 650',
    price: 9.00,
    Is_discontinued: false,
    manufacturer_name: 'Zee Laboratories Ltd',
    type: 'allopathy',
    pack_size_label: 'strip of 10 tablets',
    short_composition1: 'Paracetamol (650mg)',
    short_composition2: ''
  },
  {
    id: 'MED008',
    name: 'Cipla Paracetamol 650 Generics',
    price: 12.00,
    Is_discontinued: false,
    manufacturer_name: 'Cipla Generics',
    type: 'allopathy',
    pack_size_label: 'strip of 10 tablets',
    short_composition1: 'Paracetamol (650mg)',
    short_composition2: ''
  },

  // Amoxicillin 500mg + Clavulanic Acid 125mg (Augmentin 625)
  {
    id: 'MED009',
    name: 'Augmentin 625 Duo Tablet',
    price: 204.00,
    Is_discontinued: false,
    manufacturer_name: 'GlaxoSmithKline Pharmaceuticals Ltd',
    type: 'allopathy',
    pack_size_label: 'strip of 10 tablets',
    short_composition1: 'Amoxycillin (500mg)',
    short_composition2: 'Clavulanic Acid (125mg)'
  },
  {
    id: 'MED010',
    name: 'Moxikind-CV 625 Tablet',
    price: 175.00,
    Is_discontinued: false,
    manufacturer_name: 'Mankind Pharma Ltd',
    type: 'allopathy',
    pack_size_label: 'strip of 10 tablets',
    short_composition1: 'Amoxicillin (500mg)',
    short_composition2: 'Clavulanic Acid (125mg)'
  },
  {
    id: 'MED011',
    name: 'Clavam 625 Tablet',
    price: 190.00,
    Is_discontinued: false,
    manufacturer_name: 'Alkem Laboratories Ltd',
    type: 'allopathy',
    pack_size_label: 'strip of 10 tablets',
    short_composition1: 'Amoxycillin (500mg)',
    short_composition2: 'Clavulanic Acid (125mg)'
  },
  {
    id: 'MED012',
    name: 'Megapen-CV 625 Tablet',
    price: 165.00,
    Is_discontinued: false,
    manufacturer_name: 'Aristo Pharmaceuticals Pvt Ltd',
    type: 'allopathy',
    pack_size_label: 'strip of 10 tablets',
    short_composition1: 'Amoxycillin (500mg)',
    short_composition2: 'Clavulanic Acid (125mg)'
  },
  {
    id: 'MED013',
    name: 'Amoxycillin & Potassium Clavulanate 625 Jan Aushadhi',
    price: 54.00,
    Is_discontinued: false,
    manufacturer_name: 'Pradhan Mantri Bhartiya Janaushadhi Pariyojana',
    type: 'allopathy',
    pack_size_label: 'strip of 10 tablets',
    short_composition1: 'Amoxicillin (500mg)',
    short_composition2: 'Clavulanic Acid (125mg)'
  },
  {
    id: 'MED014',
    name: 'Zee Amoxyclav 625',
    price: 60.00,
    Is_discontinued: false,
    manufacturer_name: 'Zee Laboratories Ltd',
    type: 'allopathy',
    pack_size_label: 'strip of 10 tablets',
    short_composition1: 'Amoxycillin (500mg)',
    short_composition2: 'Clavulanic Acid (125mg)'
  },
  {
    id: 'MED015',
    name: 'Novamox-CV 625 Tablet',
    price: 185.00,
    Is_discontinued: false,
    manufacturer_name: 'Cipla Ltd',
    type: 'allopathy',
    pack_size_label: 'strip of 10 tablets',
    short_composition1: 'Amoxycillin (500mg)',
    short_composition2: 'Clavulanic Acid (125mg)'
  },

  // Pantoprazole 40mg + Domperidone 30mg (Pan D)
  {
    id: 'MED016',
    name: 'Pan D Capsule SR',
    price: 199.00,
    Is_discontinued: false,
    manufacturer_name: 'Alkem Laboratories Ltd',
    type: 'allopathy',
    pack_size_label: 'strip of 15 capsules',
    short_composition1: 'Pantoprazole (40mg)',
    short_composition2: 'Domperidone (30mg)'
  },
  {
    id: 'MED017',
    name: 'Pantocid D Capsule SR',
    price: 188.00,
    Is_discontinued: false,
    manufacturer_name: 'Sun Pharma Laboratories Ltd',
    type: 'allopathy',
    pack_size_label: 'strip of 15 capsules',
    short_composition1: 'Pantoprazole (40mg)',
    short_composition2: 'Domperidone (30mg)'
  },
  {
    id: 'MED018',
    name: 'Pantakind-D Capsule',
    price: 110.00,
    Is_discontinued: false,
    manufacturer_name: 'Mankind Pharma Ltd',
    type: 'allopathy',
    pack_size_label: 'strip of 10 capsules',
    short_composition1: 'Pantoprazole (40mg)',
    short_composition2: 'Domperidone (30mg)'
  },
  {
    id: 'MED019',
    name: 'Pantoprazole & Domperidone SR Jan Aushadhi',
    price: 28.00,
    Is_discontinued: false,
    manufacturer_name: 'Pradhan Mantri Bhartiya Janaushadhi Pariyojana',
    type: 'allopathy',
    pack_size_label: 'strip of 10 capsules',
    short_composition1: 'Pantoprazole (40mg)',
    short_composition2: 'Domperidone (30mg)'
  },
  {
    id: 'MED020',
    name: 'Pantosec D SR Capsule',
    price: 165.00,
    Is_discontinued: false,
    manufacturer_name: 'Cipla Ltd',
    type: 'allopathy',
    pack_size_label: 'strip of 10 capsules',
    short_composition1: 'Pantoprazole (40mg)',
    short_composition2: 'Domperidone (30mg)'
  },
  {
    id: 'MED021',
    name: 'Zee Pantoprazole D',
    price: 32.00,
    Is_discontinued: false,
    manufacturer_name: 'Zee Laboratories Ltd',
    type: 'allopathy',
    pack_size_label: 'strip of 10 capsules',
    short_composition1: 'Pantoprazole (40mg)',
    short_composition2: 'Domperidone (30mg)'
  },

  // Telmisartan 40mg (BP)
  {
    id: 'MED022',
    name: 'Telma 40 Tablet',
    price: 115.00,
    Is_discontinued: false,
    manufacturer_name: 'Glenmark Pharmaceuticals Ltd',
    type: 'allopathy',
    pack_size_label: 'strip of 15 tablets',
    short_composition1: 'Telmisartan (40mg)',
    short_composition2: ''
  },
  {
    id: 'MED023',
    name: 'Telmikind 40 Tablet',
    price: 68.00,
    Is_discontinued: false,
    manufacturer_name: 'Mankind Pharma Ltd',
    type: 'allopathy',
    pack_size_label: 'strip of 10 tablets',
    short_composition1: 'Telmisartan (40mg)',
    short_composition2: ''
  },
  {
    id: 'MED024',
    name: 'Telpres 40 Tablet',
    price: 108.00,
    Is_discontinued: false,
    manufacturer_name: 'Abbott',
    type: 'allopathy',
    pack_size_label: 'strip of 15 tablets',
    short_composition1: 'Telmisartan (40mg)',
    short_composition2: ''
  },
  {
    id: 'MED025',
    name: 'Telvas 40 Tablet',
    price: 82.00,
    Is_discontinued: false,
    manufacturer_name: 'Aristo Pharmaceuticals Pvt Ltd',
    type: 'allopathy',
    pack_size_label: 'strip of 10 tablets',
    short_composition1: 'Telmisartan (40mg)',
    short_composition2: ''
  },
  {
    id: 'MED026',
    name: 'Telmisartan 40 Jan Aushadhi',
    price: 14.00,
    Is_discontinued: false,
    manufacturer_name: 'Pradhan Mantri Bhartiya Janaushadhi Pariyojana',
    type: 'allopathy',
    pack_size_label: 'strip of 10 tablets',
    short_composition1: 'Telmisartan (40mg)',
    short_composition2: ''
  },
  {
    id: 'MED027',
    name: 'Zee Telmisartan 40',
    price: 16.00,
    Is_discontinued: false,
    manufacturer_name: 'Zee Laboratories Ltd',
    type: 'allopathy',
    pack_size_label: 'strip of 10 tablets',
    short_composition1: 'Telmisartan (40mg)',
    short_composition2: ''
  },

  // Metformin 500mg (Diabetes)
  {
    id: 'MED028',
    name: 'Glycomet 500 Tablet',
    price: 24.50,
    Is_discontinued: false,
    manufacturer_name: 'USV Ltd',
    type: 'allopathy',
    pack_size_label: 'strip of 10 tablets',
    short_composition1: 'Metformin (500mg)',
    short_composition2: ''
  },
  {
    id: 'MED029',
    name: 'Glyciphage 500 Tablet',
    price: 23.00,
    Is_discontinued: false,
    manufacturer_name: 'Franco-Indian Pharmaceuticals Pvt Ltd',
    type: 'allopathy',
    pack_size_label: 'strip of 10 tablets',
    short_composition1: 'Metformin (500mg)',
    short_composition2: ''
  },
  {
    id: 'MED030',
    name: 'Obimet 500 Tablet',
    price: 26.00,
    Is_discontinued: false,
    manufacturer_name: 'Abbott',
    type: 'allopathy',
    pack_size_label: 'strip of 10 tablets',
    short_composition1: 'Metformin (500mg)',
    short_composition2: ''
  },
  {
    id: 'MED031',
    name: 'Metformin 500 Jan Aushadhi',
    price: 6.00,
    Is_discontinued: false,
    manufacturer_name: 'Pradhan Mantri Bhartiya Janaushadhi Pariyojana',
    type: 'allopathy',
    pack_size_label: 'strip of 10 tablets',
    short_composition1: 'Metformin (500mg)',
    short_composition2: ''
  },
  {
    id: 'MED032',
    name: 'Zee Metformin 500',
    price: 6.50,
    Is_discontinued: false,
    manufacturer_name: 'Zee Laboratories Ltd',
    type: 'allopathy',
    pack_size_label: 'strip of 10 tablets',
    short_composition1: 'Metformin (500mg)',
    short_composition2: ''
  },

  // Atorvastatin 10mg (Cholesterol)
  {
    id: 'MED033',
    name: 'Atorva 10 Tablet',
    price: 112.00,
    Is_discontinued: false,
    manufacturer_name: 'Zydus Cadila',
    type: 'allopathy',
    pack_size_label: 'strip of 15 tablets',
    short_composition1: 'Atorvastatin (10mg)',
    short_composition2: ''
  },
  {
    id: 'MED034',
    name: 'Storvas 10 Tablet',
    price: 125.00,
    Is_discontinued: false,
    manufacturer_name: 'Sun Pharma Laboratories Ltd',
    type: 'allopathy',
    pack_size_label: 'strip of 15 tablets',
    short_composition1: 'Atorvastatin (10mg)',
    short_composition2: ''
  },
  {
    id: 'MED035',
    name: 'Lipitor 10mg Tablet',
    price: 160.00,
    Is_discontinued: false,
    manufacturer_name: 'Pfizer Ltd',
    type: 'allopathy',
    pack_size_label: 'strip of 10 tablets',
    short_composition1: 'Atorvastatin (10mg)',
    short_composition2: ''
  },
  {
    id: 'MED036',
    name: 'Tonact 10 Tablet',
    price: 105.00,
    Is_discontinued: false,
    manufacturer_name: 'Lupin Ltd',
    type: 'allopathy',
    pack_size_label: 'strip of 15 tablets',
    short_composition1: 'Atorvastatin (10mg)',
    short_composition2: ''
  },
  {
    id: 'MED037',
    name: 'Atorvastatin 10 Jan Aushadhi',
    price: 12.00,
    Is_discontinued: false,
    manufacturer_name: 'Pradhan Mantri Bhartiya Janaushadhi Pariyojana',
    type: 'allopathy',
    pack_size_label: 'strip of 10 tablets',
    short_composition1: 'Atorvastatin (10mg)',
    short_composition2: ''
  },

  // Levocetirizine 5mg + Montelukast 10mg (Montair LC)
  {
    id: 'MED038',
    name: 'Montair LC Tablet',
    price: 215.00,
    Is_discontinued: false,
    manufacturer_name: 'Cipla Ltd',
    type: 'allopathy',
    pack_size_label: 'strip of 10 tablets',
    short_composition1: 'Levocetirizine (5mg)',
    short_composition2: 'Montelukast (10mg)'
  },
  {
    id: 'MED039',
    name: 'Monticope Tablet',
    price: 130.00,
    Is_discontinued: false,
    manufacturer_name: 'Mankind Pharma Ltd',
    type: 'allopathy',
    pack_size_label: 'strip of 10 tablets',
    short_composition1: 'Levocetirizine (5mg)',
    short_composition2: 'Montelukast (10mg)'
  },
  {
    id: 'MED040',
    name: 'Telekast L Tablet',
    price: 195.00,
    Is_discontinued: false,
    manufacturer_name: 'Lupin Ltd',
    type: 'allopathy',
    pack_size_label: 'strip of 10 tablets',
    short_composition1: 'Levocetirizine (5mg)',
    short_composition2: 'Montelukast (10mg)'
  },
  {
    id: 'MED041',
    name: 'Montek LC Tablet',
    price: 205.00,
    Is_discontinued: false,
    manufacturer_name: 'Sun Pharma Laboratories Ltd',
    type: 'allopathy',
    pack_size_label: 'strip of 10 tablets',
    short_composition1: 'Levocetirizine (5mg)',
    short_composition2: 'Montelukast (10mg)'
  },
  {
    id: 'MED042',
    name: 'Levocetirizine & Montelukast Jan Aushadhi',
    price: 32.00,
    Is_discontinued: false,
    manufacturer_name: 'Pradhan Mantri Bhartiya Janaushadhi Pariyojana',
    type: 'allopathy',
    pack_size_label: 'strip of 10 tablets',
    short_composition1: 'Levocetirizine (5mg)',
    short_composition2: 'Montelukast (10mg)'
  },
  {
    id: 'MED043',
    name: 'Zee Levocetirizine-M',
    price: 35.00,
    Is_discontinued: false,
    manufacturer_name: 'Zee Laboratories Ltd',
    type: 'allopathy',
    pack_size_label: 'strip of 10 tablets',
    short_composition1: 'Levocetirizine (5mg)',
    short_composition2: 'Montelukast (10mg)'
  },

  // Azithromycin 500mg
  {
    id: 'MED044',
    name: 'Azithral 500 Tablet',
    price: 132.00,
    Is_discontinued: false,
    manufacturer_name: 'Alembic Pharmaceuticals Ltd',
    type: 'allopathy',
    pack_size_label: 'strip of 5 tablets',
    short_composition1: 'Azithromycin (500mg)',
    short_composition2: ''
  },
  {
    id: 'MED045',
    name: 'Azee 500 Tablet',
    price: 130.00,
    Is_discontinued: false,
    manufacturer_name: 'Cipla Ltd',
    type: 'allopathy',
    pack_size_label: 'strip of 5 tablets',
    short_composition1: 'Azithromycin (500mg)',
    short_composition2: ''
  },
  {
    id: 'MED046',
    name: 'Zithrox 500 Tablet',
    price: 115.00,
    Is_discontinued: false,
    manufacturer_name: 'Macleods Pharmaceuticals Ltd',
    type: 'allopathy',
    pack_size_label: 'strip of 5 tablets',
    short_composition1: 'Azithromycin (500mg)',
    short_composition2: ''
  },
  {
    id: 'MED047',
    name: 'Azithromycin 500 Jan Aushadhi',
    price: 35.00,
    Is_discontinued: false,
    manufacturer_name: 'Pradhan Mantri Bhartiya Janaushadhi Pariyojana',
    type: 'allopathy',
    pack_size_label: 'strip of 5 tablets',
    short_composition1: 'Azithromycin (500mg)',
    short_composition2: ''
  },
  {
    id: 'MED048',
    name: 'Zee Azithromycin 500',
    price: 38.00,
    Is_discontinued: false,
    manufacturer_name: 'Zee Laboratories Ltd',
    type: 'allopathy',
    pack_size_label: 'strip of 5 tablets',
    short_composition1: 'Azithromycin (500mg)',
    short_composition2: ''
  },

  // Omeprazole 20mg (Omez)
  {
    id: 'MED049',
    name: 'Omez 20 Capsule',
    price: 64.00,
    Is_discontinued: false,
    manufacturer_name: 'Dr. Reddy\'s Laboratories Ltd',
    type: 'allopathy',
    pack_size_label: 'strip of 20 capsules',
    short_composition1: 'Omeprazole (20mg)',
    short_composition2: ''
  },
  {
    id: 'MED050',
    name: 'Omee 20 Capsule',
    price: 48.00,
    Is_discontinued: false,
    manufacturer_name: 'Alkem Laboratories Ltd',
    type: 'allopathy',
    pack_size_label: 'strip of 20 capsules',
    short_composition1: 'Omeprazole (20mg)',
    short_composition2: ''
  },
  {
    id: 'MED051',
    name: 'Omecip 20 Capsule',
    price: 42.00,
    Is_discontinued: false,
    manufacturer_name: 'Cipla Ltd',
    type: 'allopathy',
    pack_size_label: 'strip of 20 capsules',
    short_composition1: 'Omeprazole (20mg)',
    short_composition2: ''
  },
  {
    id: 'MED052',
    name: 'Omeprazole 20 Jan Aushadhi',
    price: 8.00,
    Is_discontinued: false,
    manufacturer_name: 'Pradhan Mantri Bhartiya Janaushadhi Pariyojana',
    type: 'allopathy',
    pack_size_label: 'strip of 10 capsules',
    short_composition1: 'Omeprazole (20mg)',
    short_composition2: ''
  },

  // Cetirizine 10mg
  {
    id: 'MED053',
    name: 'Cetzine 10 Tablet',
    price: 22.00,
    Is_discontinued: false,
    manufacturer_name: 'Dr. Reddy\'s Laboratories Ltd',
    type: 'allopathy',
    pack_size_label: 'strip of 10 tablets',
    short_composition1: 'Cetirizine (10mg)',
    short_composition2: ''
  },
  {
    id: 'MED054',
    name: 'Alerid 10 Tablet',
    price: 21.00,
    Is_discontinued: false,
    manufacturer_name: 'Cipla Ltd',
    type: 'allopathy',
    pack_size_label: 'strip of 10 tablets',
    short_composition1: 'Cetirizine (10mg)',
    short_composition2: ''
  },
  {
    id: 'MED055',
    name: 'Okacet 10 Tablet',
    price: 20.50,
    Is_discontinued: false,
    manufacturer_name: 'Cipla Ltd',
    type: 'allopathy',
    pack_size_label: 'strip of 10 tablets',
    short_composition1: 'Cetirizine (10mg)',
    short_composition2: ''
  },
  {
    id: 'MED056',
    name: 'Cetirizine 10 Jan Aushadhi',
    price: 4.50,
    Is_discontinued: false,
    manufacturer_name: 'Pradhan Mantri Bhartiya Janaushadhi Pariyojana',
    type: 'allopathy',
    pack_size_label: 'strip of 10 tablets',
    short_composition1: 'Cetirizine (10mg)',
    short_composition2: ''
  },

  // Fexofenadine 120mg (Allegra)
  {
    id: 'MED057',
    name: 'Allegra 120mg Tablet',
    price: 210.00,
    Is_discontinued: false,
    manufacturer_name: 'Sanofi India Ltd',
    type: 'allopathy',
    pack_size_label: 'strip of 10 tablets',
    short_composition1: 'Fexofenadine (120mg)',
    short_composition2: ''
  },
  {
    id: 'MED058',
    name: 'Fexova 120 Tablet',
    price: 150.00,
    Is_discontinued: false,
    manufacturer_name: 'Torrent Pharmaceuticals Ltd',
    type: 'allopathy',
    pack_size_label: 'strip of 10 tablets',
    short_composition1: 'Fexofenadine (120mg)',
    short_composition2: ''
  },
  {
    id: 'MED059',
    name: 'Histafree 120 Tablet',
    price: 125.00,
    Is_discontinued: false,
    manufacturer_name: 'Mankind Pharma Ltd',
    type: 'allopathy',
    pack_size_label: 'strip of 10 tablets',
    short_composition1: 'Fexofenadine (120mg)',
    short_composition2: ''
  },
  {
    id: 'MED060',
    name: 'Fexofenadine 120 Jan Aushadhi',
    price: 32.00,
    Is_discontinued: false,
    manufacturer_name: 'Pradhan Mantri Bhartiya Janaushadhi Pariyojana',
    type: 'allopathy',
    pack_size_label: 'strip of 10 tablets',
    short_composition1: 'Fexofenadine (120mg)',
    short_composition2: ''
  },

  // Ibuprofen 400mg + Paracetamol 325mg (Combiflam)
  {
    id: 'MED061',
    name: 'Combiflam Tablet',
    price: 42.50,
    Is_discontinued: false,
    manufacturer_name: 'Sanofi India Ltd',
    type: 'allopathy',
    pack_size_label: 'strip of 20 tablets',
    short_composition1: 'Ibuprofen (400mg)',
    short_composition2: 'Paracetamol (325mg)'
  },
  {
    id: 'MED062',
    name: 'Ibugesic Plus Tablet',
    price: 36.00,
    Is_discontinued: false,
    manufacturer_name: 'Cipla Ltd',
    type: 'allopathy',
    pack_size_label: 'strip of 20 tablets',
    short_composition1: 'Ibuprofen (400mg)',
    short_composition2: 'Paracetamol (325mg)'
  },
  {
    id: 'MED063',
    name: 'Brufen Plus Tablet',
    price: 40.00,
    Is_discontinued: false,
    manufacturer_name: 'Abbott',
    type: 'allopathy',
    pack_size_label: 'strip of 15 tablets',
    short_composition1: 'Ibuprofen (400mg)',
    short_composition2: 'Paracetamol (325mg)'
  },
  {
    id: 'MED064',
    name: 'Flexon Tablet',
    price: 32.00,
    Is_discontinued: false,
    manufacturer_name: 'Aristo Pharmaceuticals Pvt Ltd',
    type: 'allopathy',
    pack_size_label: 'strip of 15 tablets',
    short_composition1: 'Ibuprofen (400mg)',
    short_composition2: 'Paracetamol (325mg)'
  },
  {
    id: 'MED065',
    name: 'Ibuprofen & Paracetamol Jan Aushadhi',
    price: 11.00,
    Is_discontinued: false,
    manufacturer_name: 'Pradhan Mantri Bhartiya Janaushadhi Pariyojana',
    type: 'allopathy',
    pack_size_label: 'strip of 10 tablets',
    short_composition1: 'Ibuprofen (400mg)',
    short_composition2: 'Paracetamol (325mg)'
  },

  // Cefixime 200mg (Taxim-O)
  {
    id: 'MED066',
    name: 'Taxim-O 200 Tablet',
    price: 120.00,
    Is_discontinued: false,
    manufacturer_name: 'Alkem Laboratories Ltd',
    type: 'allopathy',
    pack_size_label: 'strip of 10 tablets',
    short_composition1: 'Cefixime (200mg)',
    short_composition2: ''
  },
  {
    id: 'MED067',
    name: 'Mahacef 200 Tablet',
    price: 98.00,
    Is_discontinued: false,
    manufacturer_name: 'Mankind Pharma Ltd',
    type: 'allopathy',
    pack_size_label: 'strip of 10 tablets',
    short_composition1: 'Cefixime (200mg)',
    short_composition2: ''
  },
  {
    id: 'MED068',
    name: 'Zifi 200 Tablet',
    price: 115.00,
    Is_discontinued: false,
    manufacturer_name: 'FDC Ltd',
    type: 'allopathy',
    pack_size_label: 'strip of 10 tablets',
    short_composition1: 'Cefixime (200mg)',
    short_composition2: ''
  },
  {
    id: 'MED069',
    name: 'Cefixime 200 Jan Aushadhi',
    price: 32.00,
    Is_discontinued: false,
    manufacturer_name: 'Pradhan Mantri Bhartiya Janaushadhi Pariyojana',
    type: 'allopathy',
    pack_size_label: 'strip of 10 tablets',
    short_composition1: 'Cefixime (200mg)',
    short_composition2: ''
  },

  // Vildagliptin 50mg + Metformin 500mg (Galvus Met)
  {
    id: 'MED070',
    name: 'Galvus Met 50mg/500mg Tablet',
    price: 320.00,
    Is_discontinued: false,
    manufacturer_name: 'Novartis India Ltd',
    type: 'allopathy',
    pack_size_label: 'strip of 15 tablets',
    short_composition1: 'Vildagliptin (50mg)',
    short_composition2: 'Metformin (500mg)'
  },
  {
    id: 'MED071',
    name: 'Jalra M 50mg/500mg Tablet',
    price: 275.00,
    Is_discontinued: false,
    manufacturer_name: 'USV Ltd',
    type: 'allopathy',
    pack_size_label: 'strip of 15 tablets',
    short_composition1: 'Vildagliptin (50mg)',
    short_composition2: 'Metformin (500mg)'
  },
  {
    id: 'MED072',
    name: 'Vilget M 50/500 Tablet',
    price: 180.00,
    Is_discontinued: false,
    manufacturer_name: 'Mankind Pharma Ltd',
    type: 'allopathy',
    pack_size_label: 'strip of 10 tablets',
    short_composition1: 'Vildagliptin (50mg)',
    short_composition2: 'Metformin (500mg)'
  },
  {
    id: 'MED073',
    name: 'Vildagliptin & Metformin Jan Aushadhi',
    price: 65.00,
    Is_discontinued: false,
    manufacturer_name: 'Pradhan Mantri Bhartiya Janaushadhi Pariyojana',
    type: 'allopathy',
    pack_size_label: 'strip of 10 tablets',
    short_composition1: 'Vildagliptin (50mg)',
    short_composition2: 'Metformin (500mg)'
  },

  // Rosuvastatin 10mg (Rozavel)
  {
    id: 'MED074',
    name: 'Rozavel 10 Tablet',
    price: 185.00,
    Is_discontinued: false,
    manufacturer_name: 'Sun Pharma Laboratories Ltd',
    type: 'allopathy',
    pack_size_label: 'strip of 15 tablets',
    short_composition1: 'Rosuvastatin (10mg)',
    short_composition2: ''
  },
  {
    id: 'MED075',
    name: 'Rosuvas 10 Tablet',
    price: 175.00,
    Is_discontinued: false,
    manufacturer_name: 'Sun Pharma Laboratories Ltd',
    type: 'allopathy',
    pack_size_label: 'strip of 15 tablets',
    short_composition1: 'Rosuvastatin (10mg)',
    short_composition2: ''
  },
  {
    id: 'MED076',
    name: 'Crestor 10mg Tablet',
    price: 240.00,
    Is_discontinued: false,
    manufacturer_name: 'AstraZeneca',
    type: 'allopathy',
    pack_size_label: 'strip of 15 tablets',
    short_composition1: 'Rosuvastatin (10mg)',
    short_composition2: ''
  },
  {
    id: 'MED077',
    name: 'Rosuvastatin 10 Jan Aushadhi',
    price: 22.00,
    Is_discontinued: false,
    manufacturer_name: 'Pradhan Mantri Bhartiya Janaushadhi Pariyojana',
    type: 'allopathy',
    pack_size_label: 'strip of 10 tablets',
    short_composition1: 'Rosuvastatin (10mg)',
    short_composition2: ''
  },

  // Calcium Carbonate 500mg + Vitamin D3 250IU (Shelcal 500)
  {
    id: 'MED078',
    name: 'Shelcal 500 Tablet',
    price: 135.00,
    Is_discontinued: false,
    manufacturer_name: 'Torrent Pharmaceuticals Ltd',
    type: 'allopathy',
    pack_size_label: 'strip of 15 tablets',
    short_composition1: 'Calcium Carbonate (500mg)',
    short_composition2: 'Vitamin D3 (250IU)'
  },
  {
    id: 'MED079',
    name: 'Cipcal 500 Tablet',
    price: 120.00,
    Is_discontinued: false,
    manufacturer_name: 'Cipla Ltd',
    type: 'allopathy',
    pack_size_label: 'strip of 15 tablets',
    short_composition1: 'Calcium Carbonate (500mg)',
    short_composition2: 'Vitamin D3 (250IU)'
  },
  {
    id: 'MED080',
    name: 'Calcium & Vitamin D3 Jan Aushadhi',
    price: 22.00,
    Is_discontinued: false,
    manufacturer_name: 'Pradhan Mantri Bhartiya Janaushadhi Pariyojana',
    type: 'allopathy',
    pack_size_label: 'strip of 15 tablets',
    short_composition1: 'Calcium Carbonate (500mg)',
    short_composition2: 'Vitamin D3 (250IU)'
  },

  // Rabeprazole 20mg + Domperidone 30mg (Rablet D)
  {
    id: 'MED081',
    name: 'Rablet-D Capsule SR',
    price: 198.00,
    Is_discontinued: false,
    manufacturer_name: 'Lupin Ltd',
    type: 'allopathy',
    pack_size_label: 'strip of 10 capsules',
    short_composition1: 'Rabeprazole (20mg)',
    short_composition2: 'Domperidone (30mg)'
  },
  {
    id: 'MED082',
    name: 'Razo-D Capsule SR',
    price: 205.00,
    Is_discontinued: false,
    manufacturer_name: 'Dr. Reddy\'s Laboratories Ltd',
    type: 'allopathy',
    pack_size_label: 'strip of 10 capsules',
    short_composition1: 'Rabeprazole (20mg)',
    short_composition2: 'Domperidone (30mg)'
  },
  {
    id: 'MED083',
    name: 'Rabeprazole & Domperidone Jan Aushadhi',
    price: 30.00,
    Is_discontinued: false,
    manufacturer_name: 'Pradhan Mantri Bhartiya Janaushadhi Pariyojana',
    type: 'allopathy',
    pack_size_label: 'strip of 10 capsules',
    short_composition1: 'Rabeprazole (20mg)',
    short_composition2: 'Domperidone (30mg)'
  },

  // Amlodipine 5mg (Amlong)
  {
    id: 'MED084',
    name: 'Amlong 5 Tablet',
    price: 48.00,
    Is_discontinued: false,
    manufacturer_name: 'Micro Labs Ltd',
    type: 'allopathy',
    pack_size_label: 'strip of 15 tablets',
    short_composition1: 'Amlodipine (5mg)',
    short_composition2: ''
  },
  {
    id: 'MED085',
    name: 'Stamlo 5 Tablet',
    price: 65.00,
    Is_discontinued: false,
    manufacturer_name: 'Dr. Reddy\'s Laboratories Ltd',
    type: 'allopathy',
    pack_size_label: 'strip of 15 tablets',
    short_composition1: 'Amlodipine (5mg)',
    short_composition2: ''
  },
  {
    id: 'MED086',
    name: 'Amlodipine 5 Jan Aushadhi',
    price: 6.00,
    Is_discontinued: false,
    manufacturer_name: 'Pradhan Mantri Bhartiya Janaushadhi Pariyojana',
    type: 'allopathy',
    pack_size_label: 'strip of 10 tablets',
    short_composition1: 'Amlodipine (5mg)',
    short_composition2: ''
  },

  // Ofloxacin 200mg + Ornidazole 500mg (O2)
  {
    id: 'MED087',
    name: 'O2 Tablet',
    price: 145.00,
    Is_discontinued: false,
    manufacturer_name: 'Medley Pharmaceuticals',
    type: 'allopathy',
    pack_size_label: 'strip of 10 tablets',
    short_composition1: 'Ofloxacin (200mg)',
    short_composition2: 'Ornidazole (500mg)'
  },
  {
    id: 'MED088',
    name: 'Zenflox-OZ Tablet',
    price: 115.00,
    Is_discontinued: false,
    manufacturer_name: 'Mankind Pharma Ltd',
    type: 'allopathy',
    pack_size_label: 'strip of 10 tablets',
    short_composition1: 'Ofloxacin (200mg)',
    short_composition2: 'Ornidazole (500mg)'
  },
  {
    id: 'MED089',
    name: 'Ofloxacin & Ornidazole Jan Aushadhi',
    price: 26.00,
    Is_discontinued: false,
    manufacturer_name: 'Pradhan Mantri Bhartiya Janaushadhi Pariyojana',
    type: 'allopathy',
    pack_size_label: 'strip of 10 tablets',
    short_composition1: 'Ofloxacin (200mg)',
    short_composition2: 'Ornidazole (500mg)'
  },

  // Discontinued item example for test verification
  {
    id: 'MED090',
    name: 'Old Discontinued Paracetamol 650',
    price: 15.00,
    Is_discontinued: true,
    manufacturer_name: 'Old Pharma Co',
    type: 'allopathy',
    pack_size_label: 'strip of 10 tablets',
    short_composition1: 'Paracetamol (650mg)',
    short_composition2: ''
  }
];

// Function to generate and export CSV
export function exportToCsv(medicines, outputPath) {
  const header = 'id,name,price(₹),Is_discontinued,manufacturer_name,type,pack_size_label,short_composition1,short_composition2\n';
  const rows = medicines.map(m => {
    const clean = str => `"${String(str || '').replace(/"/g, '""')}"`;
    return [
      m.id,
      clean(m.name),
      m.price,
      m.Is_discontinued ? 'TRUE' : 'FALSE',
      clean(m.manufacturer_name),
      clean(m.type),
      clean(m.pack_size_label),
      clean(m.short_composition1),
      clean(m.short_composition2)
    ].join(',');
  });
  fs.writeFileSync(outputPath, header + rows.join('\n'), 'utf8');
}

// Processing & Grouping Logic
export function processMedicineDataset(rawItems) {
  // Step 1: Normalize each medicine item
  const parsedItems = rawItems.map(item => {
    const norm = normalizeComposition(item.short_composition1, item.short_composition2);
    const pack = parsePackSize(item.pack_size_label);
    const unitPrice = parseFloat((item.price / (pack.count || 1)).toFixed(2));
    const isDiscontinued = item.Is_discontinued === true || String(item.Is_discontinued).toLowerCase() === 'true';

    return {
      id: String(item.id),
      name: String(item.name).trim(),
      price: parseFloat(item.price),
      is_discontinued: isDiscontinued,
      manufacturer_name: String(item.manufacturer_name || 'Unknown').trim(),
      type: String(item.type || 'allopathy').trim(),
      pack_size_label: String(item.pack_size_label || '1 unit').trim(),
      pack_unit_count: pack.count,
      pack_unit_type: pack.unit,
      unit_price: unitPrice,
      short_composition1: item.short_composition1 || '',
      short_composition2: item.short_composition2 || '',
      display_composition: norm.display,
      composition_key: norm.key,
      salts: norm.salts,
      generic_flag: isGenericManufacturer(item.manufacturer_name)
    };
  });

  // Step 2: Group by composition_key
  const groupsMap = new Map();
  for (const med of parsedItems) {
    if (!groupsMap.has(med.composition_key)) {
      groupsMap.set(med.composition_key, []);
    }
    groupsMap.get(med.composition_key).push(med);
  }

  // Step 3: Process within each group (cheapest flag, bottom 25% generic fallback, savings)
  const processedMedicines = [];
  const compositionGroups = [];

  for (const [compKey, groupItems] of groupsMap.entries()) {
    // Exclude discontinued for price analysis if possible, but keep items
    const activeItems = groupItems.filter(i => !i.is_discontinued);
    const pool = activeItems.length > 0 ? activeItems : groupItems;

    // Find lowest unit price
    const minUnitPrice = Math.min(...pool.map(i => i.unit_price));
    const maxUnitPrice = Math.max(...pool.map(i => i.unit_price));

    // Calculate 25th percentile unit price threshold
    const sortedPrices = [...pool.map(i => i.unit_price)].sort((a, b) => a - b);
    const p25Index = Math.floor(sortedPrices.length * 0.25);
    const p25Threshold = sortedPrices[p25Index] || minUnitPrice;

    // Tag medicines in group
    const processedGroupItems = groupItems.map(item => {
      const isCheapest = activeItems.length > 0 && !item.is_discontinued && item.unit_price === minUnitPrice;
      const isGeneric = item.generic_flag || (item.unit_price <= p25Threshold && sortedPrices.length > 1);

      return {
        ...item,
        is_cheapest: isCheapest,
        generic_flag: isGeneric,
        badge_type: item.generic_flag ? 'Generic / Jan Aushadhi' : (isGeneric ? 'Low-Cost Generic' : 'Branded')
      };
    });

    processedMedicines.push(...processedGroupItems);

    const cheapestMed = processedGroupItems.find(i => i.is_cheapest) || processedGroupItems[0];

    compositionGroups.push({
      composition_key: compKey,
      display_composition: groupItems[0].display_composition,
      salts: groupItems[0].salts,
      total_alternatives: groupItems.length,
      active_alternatives: activeItems.length,
      min_unit_price: minUnitPrice,
      max_unit_price: maxUnitPrice,
      cheapest_medicine_id: cheapestMed?.id,
      cheapest_medicine_name: cheapestMed?.name,
      cheapest_manufacturer: cheapestMed?.manufacturer_name,
      cheapest_price: cheapestMed?.price,
      cheapest_unit_price: cheapestMed?.unit_price
    });
  }

  return {
    medicines: processedMedicines,
    groups: compositionGroups
  };
}

// Execute Seeding
export function seedDatabase() {
  console.log('🌱 Seeding Indian Medicine Database...');

  const csvPath = path.join(DATA_DIR, 'indian_medicine_data.csv');
  exportToCsv(RAW_MEDICINE_DATA, csvPath);
  console.log(`✅ Exported raw CSV dataset to ${csvPath}`);

  const result = processMedicineDataset(RAW_MEDICINE_DATA);

  const outputPath = path.join(DATA_DIR, 'processed_medicines.json');
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf8');
  console.log(`✅ Processed ${result.medicines.length} medicines across ${result.groups.length} composition groups`);
  console.log(`✅ Database ready at ${outputPath}`);

  return result;
}

// Auto-run if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedDatabase();
}
