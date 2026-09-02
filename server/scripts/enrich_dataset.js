import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  RAW_MEDICINE_DATA, 
  exportToCsv, 
  processMedicineDataset 
} from './seed.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');

// Additional curated Indian medicines across all major therapeutic categories
const ADDITIONAL_MEDICINES = [
  // Sitagliptin 100mg (Januvia)
  {
    id: 'MED091',
    name: 'Januvia 100mg Tablet',
    price: 390.00,
    Is_discontinued: false,
    manufacturer_name: 'MSD Pharmaceuticals Pvt Ltd',
    type: 'allopathy',
    pack_size_label: 'strip of 7 tablets',
    short_composition1: 'Sitagliptin (100mg)',
    short_composition2: ''
  },
  {
    id: 'MED092',
    name: 'Zita 100 Tablet',
    price: 180.00,
    Is_discontinued: false,
    manufacturer_name: 'Glenmark Pharmaceuticals Ltd',
    type: 'allopathy',
    pack_size_label: 'strip of 10 tablets',
    short_composition1: 'Sitagliptin (100mg)',
    short_composition2: ''
  },
  {
    id: 'MED093',
    name: 'Sitagliptin 100 Jan Aushadhi',
    price: 45.00,
    Is_discontinued: false,
    manufacturer_name: 'Pradhan Mantri Bhartiya Janaushadhi Pariyojana',
    type: 'allopathy',
    pack_size_label: 'strip of 10 tablets',
    short_composition1: 'Sitagliptin (100mg)',
    short_composition2: ''
  },

  // Dapagliflozin 10mg (Forxiga)
  {
    id: 'MED094',
    name: 'Forxiga 10mg Tablet',
    price: 760.00,
    Is_discontinued: false,
    manufacturer_name: 'AstraZeneca',
    type: 'allopathy',
    pack_size_label: 'strip of 14 tablets',
    short_composition1: 'Dapagliflozin (10mg)',
    short_composition2: ''
  },
  {
    id: 'MED095',
    name: 'Daxid 10 Tablet',
    price: 185.00,
    Is_discontinued: false,
    manufacturer_name: 'Torrent Pharmaceuticals Ltd',
    type: 'allopathy',
    pack_size_label: 'strip of 10 tablets',
    short_composition1: 'Dapagliflozin (10mg)',
    short_composition2: ''
  },
  {
    id: 'MED096',
    name: 'Dapagliflozin 10 Jan Aushadhi',
    price: 38.00,
    Is_discontinued: false,
    manufacturer_name: 'Pradhan Mantri Bhartiya Janaushadhi Pariyojana',
    type: 'allopathy',
    pack_size_label: 'strip of 10 tablets',
    short_composition1: 'Dapagliflozin (10mg)',
    short_composition2: ''
  },

  // Aceclofenac 100mg + Paracetamol 325mg (Zerodol P)
  {
    id: 'MED097',
    name: 'Zerodol-P Tablet',
    price: 72.00,
    Is_discontinued: false,
    manufacturer_name: 'Ipca Laboratories Ltd',
    type: 'allopathy',
    pack_size_label: 'strip of 10 tablets',
    short_composition1: 'Aceclofenac (100mg)',
    short_composition2: 'Paracetamol (325mg)'
  },
  {
    id: 'MED098',
    name: 'Aceclo Plus Tablet',
    price: 65.00,
    Is_discontinued: false,
    manufacturer_name: 'Aristo Pharmaceuticals Pvt Ltd',
    type: 'allopathy',
    pack_size_label: 'strip of 10 tablets',
    short_composition1: 'Aceclofenac (100mg)',
    short_composition2: 'Paracetamol (325mg)'
  },
  {
    id: 'MED099',
    name: 'Hifenac-P Tablet',
    price: 68.00,
    Is_discontinued: false,
    manufacturer_name: 'Intas Pharmaceuticals Ltd',
    type: 'allopathy',
    pack_size_label: 'strip of 10 tablets',
    short_composition1: 'Aceclofenac (100mg)',
    short_composition2: 'Paracetamol (325mg)'
  },
  {
    id: 'MED100',
    name: 'Aceclofenac & Paracetamol Jan Aushadhi',
    price: 15.00,
    Is_discontinued: false,
    manufacturer_name: 'Pradhan Mantri Bhartiya Janaushadhi Pariyojana',
    type: 'allopathy',
    pack_size_label: 'strip of 10 tablets',
    short_composition1: 'Aceclofenac (100mg)',
    short_composition2: 'Paracetamol (325mg)'
  },

  // Mefenamic Acid 250mg + Dicyclomine 10mg (Meftal Spas)
  {
    id: 'MED101',
    name: 'Meftal-Spas Tablet',
    price: 52.00,
    Is_discontinued: false,
    manufacturer_name: 'Blue Cross Laboratories Ltd',
    type: 'allopathy',
    pack_size_label: 'strip of 10 tablets',
    short_composition1: 'Mefenamic Acid (250mg)',
    short_composition2: 'Dicyclomine (10mg)'
  },
  {
    id: 'MED102',
    name: 'Colimex Tablet',
    price: 45.00,
    Is_discontinued: false,
    manufacturer_name: 'Wallace Pharmaceuticals Pvt Ltd',
    type: 'allopathy',
    pack_size_label: 'strip of 10 tablets',
    short_composition1: 'Mefenamic Acid (250mg)',
    short_composition2: 'Dicyclomine (10mg)'
  },
  {
    id: 'MED103',
    name: 'Mefenamic Acid & Dicyclomine Jan Aushadhi',
    price: 12.00,
    Is_discontinued: false,
    manufacturer_name: 'Pradhan Mantri Bhartiya Janaushadhi Pariyojana',
    type: 'allopathy',
    pack_size_label: 'strip of 10 tablets',
    short_composition1: 'Mefenamic Acid (250mg)',
    short_composition2: 'Dicyclomine (10mg)'
  },

  // Cefuroxime 500mg (Ceftum)
  {
    id: 'MED104',
    name: 'Ceftum 500 Tablet',
    price: 495.00,
    Is_discontinued: false,
    manufacturer_name: 'GlaxoSmithKline Pharmaceuticals Ltd',
    type: 'allopathy',
    pack_size_label: 'strip of 10 tablets',
    short_composition1: 'Cefuroxime (500mg)',
    short_composition2: ''
  },
  {
    id: 'MED105',
    name: 'Cetil 500 Tablet',
    price: 410.00,
    Is_discontinued: false,
    manufacturer_name: 'Lupin Ltd',
    type: 'allopathy',
    pack_size_label: 'strip of 10 tablets',
    short_composition1: 'Cefuroxime (500mg)',
    short_composition2: ''
  },
  {
    id: 'MED106',
    name: 'Cefuroxime Axetil 500 Jan Aushadhi',
    price: 98.00,
    Is_discontinued: false,
    manufacturer_name: 'Pradhan Mantri Bhartiya Janaushadhi Pariyojana',
    type: 'allopathy',
    pack_size_label: 'strip of 10 tablets',
    short_composition1: 'Cefuroxime (500mg)',
    short_composition2: ''
  },

  // Methylcobalamin 1500mcg (Nurokind / Neurobion)
  {
    id: 'MED107',
    name: 'Nurokind-OD Tablet',
    price: 110.00,
    Is_discontinued: false,
    manufacturer_name: 'Mankind Pharma Ltd',
    type: 'allopathy',
    pack_size_label: 'strip of 20 tablets',
    short_composition1: 'Methylcobalamin (1500mcg)',
    short_composition2: ''
  },
  {
    id: 'MED108',
    name: 'Cobix OD Tablet',
    price: 95.00,
    Is_discontinued: false,
    manufacturer_name: 'Cipla Ltd',
    type: 'allopathy',
    pack_size_label: 'strip of 15 tablets',
    short_composition1: 'Methylcobalamin (1500mcg)',
    short_composition2: ''
  },
  {
    id: 'MED109',
    name: 'Methylcobalamin 1500 Jan Aushadhi',
    price: 18.00,
    Is_discontinued: false,
    manufacturer_name: 'Pradhan Mantri Bhartiya Janaushadhi Pariyojana',
    type: 'allopathy',
    pack_size_label: 'strip of 10 tablets',
    short_composition1: 'Methylcobalamin (1500mcg)',
    short_composition2: ''
  },

  // Losartan 50mg (Losar 50)
  {
    id: 'MED110',
    name: 'Losar 50 Tablet',
    price: 118.00,
    Is_discontinued: false,
    manufacturer_name: 'Unichem Laboratories Ltd',
    type: 'allopathy',
    pack_size_label: 'strip of 15 tablets',
    short_composition1: 'Losartan (50mg)',
    short_composition2: ''
  },
  {
    id: 'MED111',
    name: 'Repace 50 Tablet',
    price: 105.00,
    Is_discontinued: false,
    manufacturer_name: 'Sun Pharma Laboratories Ltd',
    type: 'allopathy',
    pack_size_label: 'strip of 15 tablets',
    short_composition1: 'Losartan (50mg)',
    short_composition2: ''
  },
  {
    id: 'MED112',
    name: 'Losartan 50 Jan Aushadhi',
    price: 12.00,
    Is_discontinued: false,
    manufacturer_name: 'Pradhan Mantri Bhartiya Janaushadhi Pariyojana',
    type: 'allopathy',
    pack_size_label: 'strip of 10 tablets',
    short_composition1: 'Losartan (50mg)',
    short_composition2: ''
  }
];

export function enrichAndSeed() {
  const combined = [...RAW_MEDICINE_DATA, ...ADDITIONAL_MEDICINES];
  const csvPath = path.join(DATA_DIR, 'indian_medicine_data.csv');
  exportToCsv(combined, csvPath);

  const result = processMedicineDataset(combined);
  const outputPath = path.join(DATA_DIR, 'processed_medicines.json');
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf8');

  console.log(`✨ Enriched database with ${result.medicines.length} total medicines in ${result.groups.length} composition groups.`);
  return result;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  enrichAndSeed();
}
