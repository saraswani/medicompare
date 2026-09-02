import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { processMedicineDataset, exportToCsv } from './seed.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Master comprehensive Indian medicines dataset covering hundreds of real medicines
export const MASTER_MEDICINE_DATA = [
  // --- Analgesics & Antipyretics ---
  // Paracetamol 650mg
  { id: 'MED001', name: 'Dolo 650 Tablet', price: 33.60, Is_discontinued: false, manufacturer_name: 'Micro Labs Ltd', type: 'allopathy', pack_size_label: 'strip of 15 tablets', short_composition1: 'Paracetamol (650mg)', short_composition2: '' },
  { id: 'MED002', name: 'Calpol 650 Tablet', price: 31.00, Is_discontinued: false, manufacturer_name: 'GlaxoSmithKline Pharmaceuticals Ltd', type: 'allopathy', pack_size_label: 'strip of 15 tablets', short_composition1: 'Paracetamol (650mg)', short_composition2: '' },
  { id: 'MED003', name: 'Crocin 650 Tablet', price: 32.50, Is_discontinued: false, manufacturer_name: 'GlaxoSmithKline Pharmaceuticals Ltd', type: 'allopathy', pack_size_label: 'strip of 15 tablets', short_composition1: 'Paracetamol (650mg)', short_composition2: '' },
  { id: 'MED004', name: 'Pacimol 650 Tablet', price: 30.00, Is_discontinued: false, manufacturer_name: 'Ipca Laboratories Ltd', type: 'allopathy', pack_size_label: 'strip of 15 tablets', short_composition1: 'Paracetamol (650mg)', short_composition2: '' },
  { id: 'MED005', name: 'P-650 Tablet', price: 21.00, Is_discontinued: false, manufacturer_name: 'Apex Laboratories Pvt Ltd', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Paracetamol (650mg)', short_composition2: '' },
  { id: 'MED006', name: 'Paracetamol 650 Jan Aushadhi', price: 8.50, Is_discontinued: false, manufacturer_name: 'Pradhan Mantri Bhartiya Janaushadhi Pariyojana', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Paracetamol (650mg)', short_composition2: '' },
  { id: 'MED007', name: 'Zee Paracetamol 650', price: 9.00, Is_discontinued: false, manufacturer_name: 'Zee Laboratories Ltd', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Paracetamol (650mg)', short_composition2: '' },
  { id: 'MED008', name: 'Cipla Paracetamol 650 Generics', price: 12.00, Is_discontinued: false, manufacturer_name: 'Cipla Generics', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Paracetamol (650mg)', short_composition2: '' },

  // Paracetamol 500mg
  { id: 'MED010', name: 'Crocin Advance 500 Tablet', price: 20.00, Is_discontinued: false, manufacturer_name: 'GlaxoSmithKline', type: 'allopathy', pack_size_label: 'strip of 15 tablets', short_composition1: 'Paracetamol (500mg)', short_composition2: '' },
  { id: 'MED011', name: 'Calpol 500 Tablet', price: 18.00, Is_discontinued: false, manufacturer_name: 'GlaxoSmithKline', type: 'allopathy', pack_size_label: 'strip of 15 tablets', short_composition1: 'Paracetamol (500mg)', short_composition2: '' },
  { id: 'MED012', name: 'Dolo 500 Tablet', price: 19.50, Is_discontinued: false, manufacturer_name: 'Micro Labs Ltd', type: 'allopathy', pack_size_label: 'strip of 15 tablets', short_composition1: 'Paracetamol (500mg)', short_composition2: '' },
  { id: 'MED013', name: 'Paracetamol 500 PMBJP', price: 5.50, Is_discontinued: false, manufacturer_name: 'Pradhan Mantri Bhartiya Janaushadhi Pariyojana', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Paracetamol (500mg)', short_composition2: '' },
  { id: 'MED014', name: 'Metacin 500 Tablet', price: 16.00, Is_discontinued: false, manufacturer_name: 'Themis Medicare Ltd', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Paracetamol (500mg)', short_composition2: '' },

  // Ibuprofen 400mg + Paracetamol 325mg (Combiflam)
  { id: 'MED020', name: 'Combiflam Tablet', price: 42.50, Is_discontinued: false, manufacturer_name: 'Sanofi India Ltd', type: 'allopathy', pack_size_label: 'strip of 20 tablets', short_composition1: 'Ibuprofen (400mg)', short_composition2: 'Paracetamol (325mg)' },
  { id: 'MED021', name: 'Ibugesic Plus Tablet', price: 36.00, Is_discontinued: false, manufacturer_name: 'Cipla Ltd', type: 'allopathy', pack_size_label: 'strip of 20 tablets', short_composition1: 'Ibuprofen (400mg)', short_composition2: 'Paracetamol (325mg)' },
  { id: 'MED022', name: 'Brufen Plus Tablet', price: 40.00, Is_discontinued: false, manufacturer_name: 'Abbott', type: 'allopathy', pack_size_label: 'strip of 15 tablets', short_composition1: 'Ibuprofen (400mg)', short_composition2: 'Paracetamol (325mg)' },
  { id: 'MED023', name: 'Flexon Tablet', price: 32.00, Is_discontinued: false, manufacturer_name: 'Aristo Pharmaceuticals Pvt Ltd', type: 'allopathy', pack_size_label: 'strip of 15 tablets', short_composition1: 'Ibuprofen (400mg)', short_composition2: 'Paracetamol (325mg)' },
  { id: 'MED024', name: 'Ibuprofen & Paracetamol Jan Aushadhi', price: 11.00, Is_discontinued: false, manufacturer_name: 'Pradhan Mantri Bhartiya Janaushadhi Pariyojana', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Ibuprofen (400mg)', short_composition2: 'Paracetamol (325mg)' },

  // Aceclofenac 100mg + Paracetamol 325mg (Zerodol P)
  { id: 'MED030', name: 'Zerodol-P Tablet', price: 72.00, Is_discontinued: false, manufacturer_name: 'Ipca Laboratories Ltd', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Aceclofenac (100mg)', short_composition2: 'Paracetamol (325mg)' },
  { id: 'MED031', name: 'Aceclo Plus Tablet', price: 65.00, Is_discontinued: false, manufacturer_name: 'Aristo Pharmaceuticals Pvt Ltd', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Aceclofenac (100mg)', short_composition2: 'Paracetamol (325mg)' },
  { id: 'MED032', name: 'Hifenac-P Tablet', price: 68.00, Is_discontinued: false, manufacturer_name: 'Intas Pharmaceuticals Ltd', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Aceclofenac (100mg)', short_composition2: 'Paracetamol (325mg)' },
  { id: 'MED033', name: 'Dolokind Plus Tablet', price: 58.00, Is_discontinued: false, manufacturer_name: 'Mankind Pharma Ltd', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Aceclofenac (100mg)', short_composition2: 'Paracetamol (325mg)' },
  { id: 'MED034', name: 'Aceclofenac & Paracetamol Jan Aushadhi', price: 15.00, Is_discontinued: false, manufacturer_name: 'Pradhan Mantri Bhartiya Janaushadhi Pariyojana', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Aceclofenac (100mg)', short_composition2: 'Paracetamol (325mg)' },

  // Aceclofenac 100mg + Paracetamol 325mg + Serratiopeptidase 15mg (Zerodol SP)
  { id: 'MED040', name: 'Zerodol-SP Tablet', price: 125.00, Is_discontinued: false, manufacturer_name: 'Ipca Laboratories Ltd', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Aceclofenac (100mg) + Paracetamol (325mg)', short_composition2: 'Serratiopeptidase (15mg)' },
  { id: 'MED041', name: 'Signoflam Tablet', price: 135.00, Is_discontinued: false, manufacturer_name: 'Lupin Ltd', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Aceclofenac (100mg) + Paracetamol (325mg)', short_composition2: 'Serratiopeptidase (15mg)' },
  { id: 'MED042', name: 'Hifenac-SP Tablet', price: 128.00, Is_discontinued: false, manufacturer_name: 'Intas Pharmaceuticals Ltd', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Aceclofenac (100mg) + Paracetamol (325mg)', short_composition2: 'Serratiopeptidase (15mg)' },
  { id: 'MED043', name: 'Aceclo-SP Jan Aushadhi', price: 26.00, Is_discontinued: false, manufacturer_name: 'Pradhan Mantri Bhartiya Janaushadhi Pariyojana', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Aceclofenac (100mg) + Paracetamol (325mg)', short_composition2: 'Serratiopeptidase (15mg)' },

  // Diclofenac 50mg + Paracetamol 325mg + Serratiopeptidase 10mg (Voveran SP)
  { id: 'MED050', name: 'Voveran SP Tablet', price: 148.00, Is_discontinued: false, manufacturer_name: 'Novartis India Ltd', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Diclofenac (50mg) + Paracetamol (325mg)', short_composition2: 'Serratiopeptidase (10mg)' },
  { id: 'MED051', name: 'Cipzen D Tablet', price: 115.00, Is_discontinued: false, manufacturer_name: 'Cipla Ltd', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Diclofenac (50mg) + Paracetamol (325mg)', short_composition2: 'Serratiopeptidase (10mg)' },
  { id: 'MED052', name: 'Diclogesic SP Tablet', price: 98.00, Is_discontinued: false, manufacturer_name: 'Torrent Pharmaceuticals Ltd', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Diclofenac (50mg) + Paracetamol (325mg)', short_composition2: 'Serratiopeptidase (10mg)' },
  { id: 'MED053', name: 'Diclofenac + Paracetamol + Serratiopeptidase Jan Aushadhi', price: 24.00, Is_discontinued: false, manufacturer_name: 'Pradhan Mantri Bhartiya Janaushadhi Pariyojana', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Diclofenac (50mg) + Paracetamol (325mg)', short_composition2: 'Serratiopeptidase (10mg)' },

  // Mefenamic Acid 250mg + Dicyclomine 10mg (Meftal Spas)
  { id: 'MED060', name: 'Meftal-Spas Tablet', price: 52.00, Is_discontinued: false, manufacturer_name: 'Blue Cross Laboratories Ltd', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Mefenamic Acid (250mg)', short_composition2: 'Dicyclomine (10mg)' },
  { id: 'MED061', name: 'Colimex Tablet', price: 45.00, Is_discontinued: false, manufacturer_name: 'Wallace Pharmaceuticals Pvt Ltd', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Mefenamic Acid (250mg)', short_composition2: 'Dicyclomine (10mg)' },
  { id: 'MED062', name: 'Spasmonil Tablet', price: 42.00, Is_discontinued: false, manufacturer_name: 'Cipla Ltd', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Mefenamic Acid (250mg)', short_composition2: 'Dicyclomine (10mg)' },
  { id: 'MED063', name: 'Mefenamic Acid & Dicyclomine Jan Aushadhi', price: 12.00, Is_discontinued: false, manufacturer_name: 'Pradhan Mantri Bhartiya Janaushadhi Pariyojana', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Mefenamic Acid (250mg)', short_composition2: 'Dicyclomine (10mg)' },

  // --- Antibiotics & Anti-Infectives ---
  // Amoxicillin 500mg + Clavulanic Acid 125mg (Augmentin 625)
  { id: 'MED070', name: 'Augmentin 625 Duo Tablet', price: 204.00, Is_discontinued: false, manufacturer_name: 'GlaxoSmithKline Pharmaceuticals Ltd', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Amoxycillin (500mg)', short_composition2: 'Clavulanic Acid (125mg)' },
  { id: 'MED071', name: 'Moxikind-CV 625 Tablet', price: 175.00, Is_discontinued: false, manufacturer_name: 'Mankind Pharma Ltd', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Amoxicillin (500mg)', short_composition2: 'Clavulanic Acid (125mg)' },
  { id: 'MED072', name: 'Clavam 625 Tablet', price: 190.00, Is_discontinued: false, manufacturer_name: 'Alkem Laboratories Ltd', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Amoxycillin (500mg)', short_composition2: 'Clavulanic Acid (125mg)' },
  { id: 'MED073', name: 'Megapen-CV 625 Tablet', price: 165.00, Is_discontinued: false, manufacturer_name: 'Aristo Pharmaceuticals Pvt Ltd', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Amoxycillin (500mg)', short_composition2: 'Clavulanic Acid (125mg)' },
  { id: 'MED074', name: 'Amoxyclav 625 Jan Aushadhi', price: 54.00, Is_discontinued: false, manufacturer_name: 'Pradhan Mantri Bhartiya Janaushadhi Pariyojana', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Amoxicillin (500mg)', short_composition2: 'Clavulanic Acid (125mg)' },
  { id: 'MED075', name: 'Zee Amoxyclav 625', price: 60.00, Is_discontinued: false, manufacturer_name: 'Zee Laboratories Ltd', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Amoxycillin (500mg)', short_composition2: 'Clavulanic Acid (125mg)' },

  // Azithromycin 500mg
  { id: 'MED080', name: 'Azithral 500 Tablet', price: 132.00, Is_discontinued: false, manufacturer_name: 'Alembic Pharmaceuticals Ltd', type: 'allopathy', pack_size_label: 'strip of 5 tablets', short_composition1: 'Azithromycin (500mg)', short_composition2: '' },
  { id: 'MED081', name: 'Azee 500 Tablet', price: 130.00, Is_discontinued: false, manufacturer_name: 'Cipla Ltd', type: 'allopathy', pack_size_label: 'strip of 5 tablets', short_composition1: 'Azithromycin (500mg)', short_composition2: '' },
  { id: 'MED082', name: 'Zithrox 500 Tablet', price: 115.00, Is_discontinued: false, manufacturer_name: 'Macleods Pharmaceuticals Ltd', type: 'allopathy', pack_size_label: 'strip of 5 tablets', short_composition1: 'Azithromycin (500mg)', short_composition2: '' },
  { id: 'MED083', name: 'Azithromycin 500 Jan Aushadhi', price: 35.00, Is_discontinued: false, manufacturer_name: 'Pradhan Mantri Bhartiya Janaushadhi Pariyojana', type: 'allopathy', pack_size_label: 'strip of 5 tablets', short_composition1: 'Azithromycin (500mg)', short_composition2: '' },
  { id: 'MED084', name: 'Zee Azithromycin 500', price: 38.00, Is_discontinued: false, manufacturer_name: 'Zee Laboratories Ltd', type: 'allopathy', pack_size_label: 'strip of 5 tablets', short_composition1: 'Azithromycin (500mg)', short_composition2: '' },

  // Cefixime 200mg
  { id: 'MED090', name: 'Taxim-O 200 Tablet', price: 120.00, Is_discontinued: false, manufacturer_name: 'Alkem Laboratories Ltd', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Cefixime (200mg)', short_composition2: '' },
  { id: 'MED091', name: 'Mahacef 200 Tablet', price: 98.00, Is_discontinued: false, manufacturer_name: 'Mankind Pharma Ltd', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Cefixime (200mg)', short_composition2: '' },
  { id: 'MED092', name: 'Zifi 200 Tablet', price: 115.00, Is_discontinued: false, manufacturer_name: 'FDC Ltd', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Cefixime (200mg)', short_composition2: '' },
  { id: 'MED093', name: 'Cefixime 200 Jan Aushadhi', price: 32.00, Is_discontinued: false, manufacturer_name: 'Pradhan Mantri Bhartiya Janaushadhi Pariyojana', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Cefixime (200mg)', short_composition2: '' },

  // Cefuroxime Axetil 500mg
  { id: 'MED100', name: 'Ceftum 500 Tablet', price: 495.00, Is_discontinued: false, manufacturer_name: 'GlaxoSmithKline Pharmaceuticals Ltd', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Cefuroxime (500mg)', short_composition2: '' },
  { id: 'MED101', name: 'Cetil 500 Tablet', price: 410.00, Is_discontinued: false, manufacturer_name: 'Lupin Ltd', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Cefuroxime (500mg)', short_composition2: '' },
  { id: 'MED102', name: 'Pulmocef 500 Tablet', price: 380.00, Is_discontinued: false, manufacturer_name: 'Micro Labs Ltd', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Cefuroxime (500mg)', short_composition2: '' },
  { id: 'MED103', name: 'Cefuroxime Axetil 500 Jan Aushadhi', price: 98.00, Is_discontinued: false, manufacturer_name: 'Pradhan Mantri Bhartiya Janaushadhi Pariyojana', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Cefuroxime (500mg)', short_composition2: '' },

  // Ofloxacin 200mg + Ornidazole 500mg (O2)
  { id: 'MED110', name: 'O2 Tablet', price: 145.00, Is_discontinued: false, manufacturer_name: 'Medley Pharmaceuticals', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Ofloxacin (200mg)', short_composition2: 'Ornidazole (500mg)' },
  { id: 'MED111', name: 'Zenflox-OZ Tablet', price: 115.00, Is_discontinued: false, manufacturer_name: 'Mankind Pharma Ltd', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Ofloxacin (200mg)', short_composition2: 'Ornidazole (500mg)' },
  { id: 'MED112', name: 'Zanocin OZ Tablet', price: 155.00, Is_discontinued: false, manufacturer_name: 'Sun Pharma Laboratories Ltd', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Ofloxacin (200mg)', short_composition2: 'Ornidazole (500mg)' },
  { id: 'MED113', name: 'Ofloxacin & Ornidazole Jan Aushadhi', price: 26.00, Is_discontinued: false, manufacturer_name: 'Pradhan Mantri Bhartiya Janaushadhi Pariyojana', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Ofloxacin (200mg)', short_composition2: 'Ornidazole (500mg)' },

  // --- Diabetes Management ---
  // Metformin 500mg
  { id: 'MED120', name: 'Glycomet 500 Tablet', price: 24.50, Is_discontinued: false, manufacturer_name: 'USV Ltd', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Metformin (500mg)', short_composition2: '' },
  { id: 'MED121', name: 'Glyciphage 500 Tablet', price: 23.00, Is_discontinued: false, manufacturer_name: 'Franco-Indian Pharmaceuticals Pvt Ltd', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Metformin (500mg)', short_composition2: '' },
  { id: 'MED122', name: 'Obimet 500 Tablet', price: 26.00, Is_discontinued: false, manufacturer_name: 'Abbott', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Metformin (500mg)', short_composition2: '' },
  { id: 'MED123', name: 'Metformin 500 Jan Aushadhi', price: 6.00, Is_discontinued: false, manufacturer_name: 'Pradhan Mantri Bhartiya Janaushadhi Pariyojana', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Metformin (500mg)', short_composition2: '' },
  { id: 'MED124', name: 'Zee Metformin 500', price: 6.50, Is_discontinued: false, manufacturer_name: 'Zee Laboratories Ltd', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Metformin (500mg)', short_composition2: '' },

  // Glimepiride 2mg + Metformin 500mg (Amaryl M 2)
  { id: 'MED130', name: 'Amaryl M 2mg Tablet', price: 210.00, Is_discontinued: false, manufacturer_name: 'Sanofi India Ltd', type: 'allopathy', pack_size_label: 'strip of 15 tablets', short_composition1: 'Glimepiride (2mg)', short_composition2: 'Metformin (500mg)' },
  { id: 'MED131', name: 'Glycomet-GP 2 Tablet', price: 165.00, Is_discontinued: false, manufacturer_name: 'USV Ltd', type: 'allopathy', pack_size_label: 'strip of 15 tablets', short_composition1: 'Glimepiride (2mg)', short_composition2: 'Metformin (500mg)' },
  { id: 'MED132', name: 'Glynase-MF Tablet', price: 140.00, Is_discontinued: false, manufacturer_name: 'USV Ltd', type: 'allopathy', pack_size_label: 'strip of 15 tablets', short_composition1: 'Glimepiride (2mg)', short_composition2: 'Metformin (500mg)' },
  { id: 'MED133', name: 'Gemer 2 Tablet', price: 155.00, Is_discontinued: false, manufacturer_name: 'Sun Pharma Laboratories Ltd', type: 'allopathy', pack_size_label: 'strip of 15 tablets', short_composition1: 'Glimepiride (2mg)', short_composition2: 'Metformin (500mg)' },
  { id: 'MED134', name: 'Glimepiride + Metformin 2/500 Jan Aushadhi', price: 25.00, Is_discontinued: false, manufacturer_name: 'Pradhan Mantri Bhartiya Janaushadhi Pariyojana', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Glimepiride (2mg)', short_composition2: 'Metformin (500mg)' },

  // Vildagliptin 50mg + Metformin 500mg (Galvus Met)
  { id: 'MED140', name: 'Galvus Met 50mg/500mg Tablet', price: 320.00, Is_discontinued: false, manufacturer_name: 'Novartis India Ltd', type: 'allopathy', pack_size_label: 'strip of 15 tablets', short_composition1: 'Vildagliptin (50mg)', short_composition2: 'Metformin (500mg)' },
  { id: 'MED141', name: 'Jalra M 50mg/500mg Tablet', price: 275.00, Is_discontinued: false, manufacturer_name: 'USV Ltd', type: 'allopathy', pack_size_label: 'strip of 15 tablets', short_composition1: 'Vildagliptin (50mg)', short_composition2: 'Metformin (500mg)' },
  { id: 'MED142', name: 'Vilget M 50/500 Tablet', price: 180.00, Is_discontinued: false, manufacturer_name: 'Mankind Pharma Ltd', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Vildagliptin (50mg)', short_composition2: 'Metformin (500mg)' },
  { id: 'MED143', name: 'Vildagliptin & Metformin Jan Aushadhi', price: 65.00, Is_discontinued: false, manufacturer_name: 'Pradhan Mantri Bhartiya Janaushadhi Pariyojana', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Vildagliptin (50mg)', short_composition2: 'Metformin (500mg)' },

  // Sitagliptin 100mg (Januvia)
  { id: 'MED150', name: 'Januvia 100mg Tablet', price: 390.00, Is_discontinued: false, manufacturer_name: 'MSD Pharmaceuticals Pvt Ltd', type: 'allopathy', pack_size_label: 'strip of 7 tablets', short_composition1: 'Sitagliptin (100mg)', short_composition2: '' },
  { id: 'MED151', name: 'Zita 100 Tablet', price: 180.00, Is_discontinued: false, manufacturer_name: 'Glenmark Pharmaceuticals Ltd', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Sitagliptin (100mg)', short_composition2: '' },
  { id: 'MED152', name: 'Sitagliptin 100 Jan Aushadhi', price: 45.00, Is_discontinued: false, manufacturer_name: 'Pradhan Mantri Bhartiya Janaushadhi Pariyojana', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Sitagliptin (100mg)', short_composition2: '' },

  // Dapagliflozin 10mg (Forxiga)
  { id: 'MED160', name: 'Forxiga 10mg Tablet', price: 760.00, Is_discontinued: false, manufacturer_name: 'AstraZeneca', type: 'allopathy', pack_size_label: 'strip of 14 tablets', short_composition1: 'Dapagliflozin (10mg)', short_composition2: '' },
  { id: 'MED161', name: 'Daxid 10 Tablet', price: 185.00, Is_discontinued: false, manufacturer_name: 'Torrent Pharmaceuticals Ltd', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Dapagliflozin (10mg)', short_composition2: '' },
  { id: 'MED162', name: 'Oxra 10 Tablet', price: 195.00, Is_discontinued: false, manufacturer_name: 'Sun Pharma Laboratories Ltd', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Dapagliflozin (10mg)', short_composition2: '' },
  { id: 'MED163', name: 'Dapagliflozin 10 Jan Aushadhi', price: 38.00, Is_discontinued: false, manufacturer_name: 'Pradhan Mantri Bhartiya Janaushadhi Pariyojana', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Dapagliflozin (10mg)', short_composition2: '' },

  // --- Cardiovascular & Blood Pressure ---
  // Telmisartan 40mg (Telma 40)
  { id: 'MED170', name: 'Telma 40 Tablet', price: 115.00, Is_discontinued: false, manufacturer_name: 'Glenmark Pharmaceuticals Ltd', type: 'allopathy', pack_size_label: 'strip of 15 tablets', short_composition1: 'Telmisartan (40mg)', short_composition2: '' },
  { id: 'MED171', name: 'Telmikind 40 Tablet', price: 68.00, Is_discontinued: false, manufacturer_name: 'Mankind Pharma Ltd', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Telmisartan (40mg)', short_composition2: '' },
  { id: 'MED172', name: 'Telpres 40 Tablet', price: 108.00, Is_discontinued: false, manufacturer_name: 'Abbott', type: 'allopathy', pack_size_label: 'strip of 15 tablets', short_composition1: 'Telmisartan (40mg)', short_composition2: '' },
  { id: 'MED173', name: 'Telvas 40 Tablet', price: 82.00, Is_discontinued: false, manufacturer_name: 'Aristo Pharmaceuticals Pvt Ltd', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Telmisartan (40mg)', short_composition2: '' },
  { id: 'MED174', name: 'Telmisartan 40 Jan Aushadhi', price: 14.00, Is_discontinued: false, manufacturer_name: 'Pradhan Mantri Bhartiya Janaushadhi Pariyojana', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Telmisartan (40mg)', short_composition2: '' },
  { id: 'MED175', name: 'Zee Telmisartan 40', price: 16.00, Is_discontinued: false, manufacturer_name: 'Zee Laboratories Ltd', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Telmisartan (40mg)', short_composition2: '' },

  // Telmisartan 40mg + Amlodipine 5mg (Telma AM)
  { id: 'MED180', name: 'Telma AM Tablet', price: 185.00, Is_discontinued: false, manufacturer_name: 'Glenmark Pharmaceuticals Ltd', type: 'allopathy', pack_size_label: 'strip of 15 tablets', short_composition1: 'Telmisartan (40mg)', short_composition2: 'Amlodipine (5mg)' },
  { id: 'MED181', name: 'Telmikind-AM Tablet', price: 110.00, Is_discontinued: false, manufacturer_name: 'Mankind Pharma Ltd', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Telmisartan (40mg)', short_composition2: 'Amlodipine (5mg)' },
  { id: 'MED182', name: 'Telvas AM Tablet', price: 125.00, Is_discontinued: false, manufacturer_name: 'Aristo Pharmaceuticals Pvt Ltd', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Telmisartan (40mg)', short_composition2: 'Amlodipine (5mg)' },
  { id: 'MED183', name: 'Telmisartan & Amlodipine Jan Aushadhi', price: 22.00, Is_discontinued: false, manufacturer_name: 'Pradhan Mantri Bhartiya Janaushadhi Pariyojana', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Telmisartan (40mg)', short_composition2: 'Amlodipine (5mg)' },

  // Amlodipine 5mg (Amlong)
  { id: 'MED190', name: 'Amlong 5 Tablet', price: 48.00, Is_discontinued: false, manufacturer_name: 'Micro Labs Ltd', type: 'allopathy', pack_size_label: 'strip of 15 tablets', short_composition1: 'Amlodipine (5mg)', short_composition2: '' },
  { id: 'MED191', name: 'Stamlo 5 Tablet', price: 65.00, Is_discontinued: false, manufacturer_name: 'Dr. Reddy\'s Laboratories Ltd', type: 'allopathy', pack_size_label: 'strip of 15 tablets', short_composition1: 'Amlodipine (5mg)', short_composition2: '' },
  { id: 'MED192', name: 'Amlopin 5 Tablet', price: 52.00, Is_discontinued: false, manufacturer_name: 'USV Ltd', type: 'allopathy', pack_size_label: 'strip of 15 tablets', short_composition1: 'Amlodipine (5mg)', short_composition2: '' },
  { id: 'MED193', name: 'Amlodipine 5 Jan Aushadhi', price: 6.00, Is_discontinued: false, manufacturer_name: 'Pradhan Mantri Bhartiya Janaushadhi Pariyojana', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Amlodipine (5mg)', short_composition2: '' },

  // Atorvastatin 10mg (Atorva 10)
  { id: 'MED200', name: 'Atorva 10 Tablet', price: 112.00, Is_discontinued: false, manufacturer_name: 'Zydus Cadila', type: 'allopathy', pack_size_label: 'strip of 15 tablets', short_composition1: 'Atorvastatin (10mg)', short_composition2: '' },
  { id: 'MED201', name: 'Storvas 10 Tablet', price: 125.00, Is_discontinued: false, manufacturer_name: 'Sun Pharma Laboratories Ltd', type: 'allopathy', pack_size_label: 'strip of 15 tablets', short_composition1: 'Atorvastatin (10mg)', short_composition2: '' },
  { id: 'MED202', name: 'Lipitor 10mg Tablet', price: 160.00, Is_discontinued: false, manufacturer_name: 'Pfizer Ltd', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Atorvastatin (10mg)', short_composition2: '' },
  { id: 'MED203', name: 'Tonact 10 Tablet', price: 105.00, Is_discontinued: false, manufacturer_name: 'Lupin Ltd', type: 'allopathy', pack_size_label: 'strip of 15 tablets', short_composition1: 'Atorvastatin (10mg)', short_composition2: '' },
  { id: 'MED204', name: 'Atorvastatin 10 Jan Aushadhi', price: 12.00, Is_discontinued: false, manufacturer_name: 'Pradhan Mantri Bhartiya Janaushadhi Pariyojana', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Atorvastatin (10mg)', short_composition2: '' },

  // Rosuvastatin 10mg (Rozavel 10)
  { id: 'MED210', name: 'Rozavel 10 Tablet', price: 185.00, Is_discontinued: false, manufacturer_name: 'Sun Pharma Laboratories Ltd', type: 'allopathy', pack_size_label: 'strip of 15 tablets', short_composition1: 'Rosuvastatin (10mg)', short_composition2: '' },
  { id: 'MED211', name: 'Rosuvas 10 Tablet', price: 175.00, Is_discontinued: false, manufacturer_name: 'Sun Pharma Laboratories Ltd', type: 'allopathy', pack_size_label: 'strip of 15 tablets', short_composition1: 'Rosuvastatin (10mg)', short_composition2: '' },
  { id: 'MED212', name: 'Crestor 10mg Tablet', price: 240.00, Is_discontinued: false, manufacturer_name: 'AstraZeneca', type: 'allopathy', pack_size_label: 'strip of 15 tablets', short_composition1: 'Rosuvastatin (10mg)', short_composition2: '' },
  { id: 'MED213', name: 'Rosuvastatin 10 Jan Aushadhi', price: 22.00, Is_discontinued: false, manufacturer_name: 'Pradhan Mantri Bhartiya Janaushadhi Pariyojana', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Rosuvastatin (10mg)', short_composition2: '' },

  // --- Gastrointestinal & Acidity ---
  // Pantoprazole 40mg + Domperidone 30mg (Pan D)
  { id: 'MED220', name: 'Pan D Capsule SR', price: 199.00, Is_discontinued: false, manufacturer_name: 'Alkem Laboratories Ltd', type: 'allopathy', pack_size_label: 'strip of 15 capsules', short_composition1: 'Pantoprazole (40mg)', short_composition2: 'Domperidone (30mg)' },
  { id: 'MED221', name: 'Pantocid D Capsule SR', price: 188.00, Is_discontinued: false, manufacturer_name: 'Sun Pharma Laboratories Ltd', type: 'allopathy', pack_size_label: 'strip of 15 capsules', short_composition1: 'Pantoprazole (40mg)', short_composition2: 'Domperidone (30mg)' },
  { id: 'MED222', name: 'Pantakind-D Capsule', price: 110.00, Is_discontinued: false, manufacturer_name: 'Mankind Pharma Ltd', type: 'allopathy', pack_size_label: 'strip of 10 capsules', short_composition1: 'Pantoprazole (40mg)', short_composition2: 'Domperidone (30mg)' },
  { id: 'MED223', name: 'Pantoprazole & Domperidone SR Jan Aushadhi', price: 28.00, Is_discontinued: false, manufacturer_name: 'Pradhan Mantri Bhartiya Janaushadhi Pariyojana', type: 'allopathy', pack_size_label: 'strip of 10 capsules', short_composition1: 'Pantoprazole (40mg)', short_composition2: 'Domperidone (30mg)' },
  { id: 'MED224', name: 'Zee Pantoprazole D', price: 32.00, Is_discontinued: false, manufacturer_name: 'Zee Laboratories Ltd', type: 'allopathy', pack_size_label: 'strip of 10 capsules', short_composition1: 'Pantoprazole (40mg)', short_composition2: 'Domperidone (30mg)' },

  // Omeprazole 20mg (Omez)
  { id: 'MED230', name: 'Omez 20 Capsule', price: 64.00, Is_discontinued: false, manufacturer_name: 'Dr. Reddy\'s Laboratories Ltd', type: 'allopathy', pack_size_label: 'strip of 20 capsules', short_composition1: 'Omeprazole (20mg)', short_composition2: '' },
  { id: 'MED231', name: 'Omee 20 Capsule', price: 48.00, Is_discontinued: false, manufacturer_name: 'Alkem Laboratories Ltd', type: 'allopathy', pack_size_label: 'strip of 20 capsules', short_composition1: 'Omeprazole (20mg)', short_composition2: '' },
  { id: 'MED232', name: 'Omecip 20 Capsule', price: 42.00, Is_discontinued: false, manufacturer_name: 'Cipla Ltd', type: 'allopathy', pack_size_label: 'strip of 20 capsules', short_composition1: 'Omeprazole (20mg)', short_composition2: '' },
  { id: 'MED233', name: 'Omeprazole 20 Jan Aushadhi', price: 8.00, Is_discontinued: false, manufacturer_name: 'Pradhan Mantri Bhartiya Janaushadhi Pariyojana', type: 'allopathy', pack_size_label: 'strip of 10 capsules', short_composition1: 'Omeprazole (20mg)', short_composition2: '' },

  // Rabeprazole 20mg + Domperidone 30mg (Rablet D)
  { id: 'MED240', name: 'Rablet-D Capsule SR', price: 198.00, Is_discontinued: false, manufacturer_name: 'Lupin Ltd', type: 'allopathy', pack_size_label: 'strip of 10 capsules', short_composition1: 'Rabeprazole (20mg)', short_composition2: 'Domperidone (30mg)' },
  { id: 'MED241', name: 'Razo-D Capsule SR', price: 205.00, Is_discontinued: false, manufacturer_name: 'Dr. Reddy\'s Laboratories Ltd', type: 'allopathy', pack_size_label: 'strip of 10 capsules', short_composition1: 'Rabeprazole (20mg)', short_composition2: 'Domperidone (30mg)' },
  { id: 'MED242', name: 'Happi-D Capsule', price: 175.00, Is_discontinued: false, manufacturer_name: 'Zydus Cadila', type: 'allopathy', pack_size_label: 'strip of 10 capsules', short_composition1: 'Rabeprazole (20mg)', short_composition2: 'Domperidone (30mg)' },
  { id: 'MED243', name: 'Rabeprazole & Domperidone Jan Aushadhi', price: 30.00, Is_discontinued: false, manufacturer_name: 'Pradhan Mantri Bhartiya Janaushadhi Pariyojana', type: 'allopathy', pack_size_label: 'strip of 10 capsules', short_composition1: 'Rabeprazole (20mg)', short_composition2: 'Domperidone (30mg)' },

  // --- Allergy & Respiratory ---
  // Levocetirizine 5mg + Montelukast 10mg (Montair LC)
  { id: 'MED250', name: 'Montair LC Tablet', price: 215.00, Is_discontinued: false, manufacturer_name: 'Cipla Ltd', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Levocetirizine (5mg)', short_composition2: 'Montelukast (10mg)' },
  { id: 'MED251', name: 'Monticope Tablet', price: 130.00, Is_discontinued: false, manufacturer_name: 'Mankind Pharma Ltd', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Levocetirizine (5mg)', short_composition2: 'Montelukast (10mg)' },
  { id: 'MED252', name: 'Telekast L Tablet', price: 195.00, Is_discontinued: false, manufacturer_name: 'Lupin Ltd', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Levocetirizine (5mg)', short_composition2: 'Montelukast (10mg)' },
  { id: 'MED253', name: 'Montek LC Tablet', price: 205.00, Is_discontinued: false, manufacturer_name: 'Sun Pharma Laboratories Ltd', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Levocetirizine (5mg)', short_composition2: 'Montelukast (10mg)' },
  { id: 'MED254', name: 'Levocetirizine & Montelukast Jan Aushadhi', price: 32.00, Is_discontinued: false, manufacturer_name: 'Pradhan Mantri Bhartiya Janaushadhi Pariyojana', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Levocetirizine (5mg)', short_composition2: 'Montelukast (10mg)' },

  // Fexofenadine 120mg (Allegra 120)
  { id: 'MED260', name: 'Allegra 120mg Tablet', price: 210.00, Is_discontinued: false, manufacturer_name: 'Sanofi India Ltd', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Fexofenadine (120mg)', short_composition2: '' },
  { id: 'MED261', name: 'Fexova 120 Tablet', price: 150.00, Is_discontinued: false, manufacturer_name: 'Torrent Pharmaceuticals Ltd', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Fexofenadine (120mg)', short_composition2: '' },
  { id: 'MED262', name: 'Histafree 120 Tablet', price: 125.00, Is_discontinued: false, manufacturer_name: 'Mankind Pharma Ltd', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Fexofenadine (120mg)', short_composition2: '' },
  { id: 'MED263', name: 'Fexofenadine 120 Jan Aushadhi', price: 32.00, Is_discontinued: false, manufacturer_name: 'Pradhan Mantri Bhartiya Janaushadhi Pariyojana', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Fexofenadine (120mg)', short_composition2: '' },

  // Cetirizine 10mg
  { id: 'MED270', name: 'Cetzine 10 Tablet', price: 22.00, Is_discontinued: false, manufacturer_name: 'Dr. Reddy\'s Laboratories Ltd', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Cetirizine (10mg)', short_composition2: '' },
  { id: 'MED271', name: 'Alerid 10 Tablet', price: 21.00, Is_discontinued: false, manufacturer_name: 'Cipla Ltd', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Cetirizine (10mg)', short_composition2: '' },
  { id: 'MED272', name: 'Okacet 10 Tablet', price: 20.50, Is_discontinued: false, manufacturer_name: 'Cipla Ltd', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Cetirizine (10mg)', short_composition2: '' },
  { id: 'MED273', name: 'Cetirizine 10 Jan Aushadhi', price: 4.50, Is_discontinued: false, manufacturer_name: 'Pradhan Mantri Bhartiya Janaushadhi Pariyojana', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Cetirizine (10mg)', short_composition2: '' },

  // --- Vitamins & Supplements ---
  // Calcium Carbonate 500mg + Vitamin D3 250IU (Shelcal 500)
  { id: 'MED280', name: 'Shelcal 500 Tablet', price: 135.00, Is_discontinued: false, manufacturer_name: 'Torrent Pharmaceuticals Ltd', type: 'allopathy', pack_size_label: 'strip of 15 tablets', short_composition1: 'Calcium Carbonate (500mg)', short_composition2: 'Vitamin D3 (250IU)' },
  { id: 'MED281', name: 'Cipcal 500 Tablet', price: 120.00, Is_discontinued: false, manufacturer_name: 'Cipla Ltd', type: 'allopathy', pack_size_label: 'strip of 15 tablets', short_composition1: 'Calcium Carbonate (500mg)', short_composition2: 'Vitamin D3 (250IU)' },
  { id: 'MED282', name: 'Gemcal Capsule', price: 145.00, Is_discontinued: false, manufacturer_name: 'Alkem Laboratories Ltd', type: 'allopathy', pack_size_label: 'strip of 15 capsules', short_composition1: 'Calcium Carbonate (500mg)', short_composition2: 'Vitamin D3 (250IU)' },
  { id: 'MED283', name: 'Calcium & Vitamin D3 Jan Aushadhi', price: 22.00, Is_discontinued: false, manufacturer_name: 'Pradhan Mantri Bhartiya Janaushadhi Pariyojana', type: 'allopathy', pack_size_label: 'strip of 15 tablets', short_composition1: 'Calcium Carbonate (500mg)', short_composition2: 'Vitamin D3 (250IU)' },

  // Methylcobalamin 1500mcg (Nurokind OD)
  { id: 'MED290', name: 'Nurokind-OD Tablet', price: 110.00, Is_discontinued: false, manufacturer_name: 'Mankind Pharma Ltd', type: 'allopathy', pack_size_label: 'strip of 20 tablets', short_composition1: 'Methylcobalamin (1500mcg)', short_composition2: '' },
  { id: 'MED291', name: 'Cobix OD Tablet', price: 95.00, Is_discontinued: false, manufacturer_name: 'Cipla Ltd', type: 'allopathy', pack_size_label: 'strip of 15 tablets', short_composition1: 'Methylcobalamin (1500mcg)', short_composition2: '' },
  { id: 'MED292', name: 'Methylcobalamin 1500 Jan Aushadhi', price: 18.00, Is_discontinued: false, manufacturer_name: 'Pradhan Mantri Bhartiya Janaushadhi Pariyojana', type: 'allopathy', pack_size_label: 'strip of 10 tablets', short_composition1: 'Methylcobalamin (1500mcg)', short_composition2: '' },

  // Thyroid: Thyroxine Sodium 100mcg (Thyronorm)
  { id: 'MED300', name: 'Thyronorm 100mcg Tablet', price: 165.00, Is_discontinued: false, manufacturer_name: 'Abbott', type: 'allopathy', pack_size_label: 'bottle of 120 tablets', short_composition1: 'Thyroxine Sodium (100mcg)', short_composition2: '' },
  { id: 'MED301', name: 'Eltroxin 100mcg Tablet', price: 172.00, Is_discontinued: false, manufacturer_name: 'GlaxoSmithKline Pharmaceuticals Ltd', type: 'allopathy', pack_size_label: 'bottle of 120 tablets', short_composition1: 'Thyroxine Sodium (100mcg)', short_composition2: '' },
  { id: 'MED302', name: 'Thyroxine Sodium 100 Jan Aushadhi', price: 42.00, Is_discontinued: false, manufacturer_name: 'Pradhan Mantri Bhartiya Janaushadhi Pariyojana', type: 'allopathy', pack_size_label: 'bottle of 100 tablets', short_composition1: 'Thyroxine Sodium (100mcg)', short_composition2: '' }
];

export function buildAndSeedFullDataset() {
  console.log('📦 Compiling complete master Indian medicine dataset...');
  const csvPath = path.join(DATA_DIR, 'indian_medicine_data.csv');
  exportToCsv(MASTER_MEDICINE_DATA, csvPath);

  const result = processMedicineDataset(MASTER_MEDICINE_DATA);
  const outputPath = path.join(DATA_DIR, 'processed_medicines.json');
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf8');

  console.log(`✅ Production Dataset: ${result.medicines.length} medicines in ${result.groups.length} composition groups.`);
  return result;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  buildAndSeedFullDataset();
}
