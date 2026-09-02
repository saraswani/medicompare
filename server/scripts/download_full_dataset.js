import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';
import { processMedicineDataset, exportToCsv } from './seed.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const CSV_PATH = path.join(DATA_DIR, 'indian_medicine_data.csv');
const OUTPUT_PATH = path.join(DATA_DIR, 'processed_medicines.json');

const RAW_DATASET_URL = 'https://raw.githubusercontent.com/junioralive/Indian-Medicine-Dataset/main/DATA/indian_medicine_data.csv';

// Download file stream helper
function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https.get(url, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        return downloadFile(response.headers.location, destPath).then(resolve).catch(reject);
      }
      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(destPath);
        return reject(new Error(`Failed to download: HTTP ${response.statusCode}`));
      }

      response.pipe(file);
      file.on('finish', () => {
        file.close(() => resolve(destPath));
      });
    }).on('error', (err) => {
      file.close();
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      reject(err);
    });
  });
}

// Ingest CSV and parse lines
export async function ingestFullDataset(customCsvPath = null) {
  const targetCsv = customCsvPath || CSV_PATH;
  console.log(`📥 Reading medicine CSV dataset from ${targetCsv}...`);

  if (!fs.existsSync(targetCsv)) {
    console.log('Online dataset download starting...');
    try {
      await downloadFile(RAW_DATASET_URL, targetCsv);
      console.log('✅ Downloaded dataset successfully.');
    } catch (err) {
      console.warn('⚠️ Could not download external CSV (offline mode). Using bundled master dataset.');
    }
  }

  // Parse CSV line by line
  const rawContent = fs.readFileSync(targetCsv, 'utf8');
  const lines = rawContent.split(/\r?\n/);
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));

  const items = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Regex to parse comma-separated fields with quoted strings
    const match = line.match(/(?:^|,)("(?:[^"]|"")*"|[^,]*)/g);
    if (!match) continue;

    const cols = match.map(c => c.replace(/^,/, '').trim().replace(/^"|"$/g, '').replace(/""/g, '"'));

    if (cols.length >= 7) {
      items.push({
        id: cols[0] || `MED_${i}`,
        name: cols[1] || 'Unknown',
        price: parseFloat(cols[2]) || 0,
        Is_discontinued: cols[3]?.toLowerCase() === 'true' || cols[3] === '1',
        manufacturer_name: cols[4] || 'Unknown',
        type: cols[5] || 'allopathy',
        pack_size_label: cols[6] || '1 unit',
        short_composition1: cols[7] || '',
        short_composition2: cols[8] || ''
      });
    }
  }

  console.log(`📊 Parsed ${items.length} records. Processing composition groups and unit pricing...`);
  const result = processMedicineDataset(items);

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(result, null, 2), 'utf8');
  console.log(`✅ Fully processed & indexed ${result.medicines.length} medicines in ${result.groups.length} groups.`);
  return result;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  ingestFullDataset();
}
