# MediCompare (India Rx) — Healthcare Data & Medicine Price Comparison Platform

> **CEPL Final Evaluation Submission**  
> A clinical-grade, mobile-first web application designed to help patients in India safely compare branded prescription medicines against verified low-cost generic alternatives and government **Pradhan Mantri Bhartiya Janaushadhi Pariyojana (PMBJP)** formulations.

---

## 1. Executive Summary & Objective

In India, branded medicines are frequently sold at 50% to 90% markups over identical generic chemical equivalents due to commercial marketing, medical representative networks, and distributor margins. 

**MediCompare** empowers patients and healthcare professionals to:
1. **Search & Autocomplete** medicines across Indian and international regulatory databases in real time.
2. **Match Exact Active Pharmaceutical Ingredients (APIs)** using standardized Indian Pharmacopoeia (IP) and WHO-GMP bioequivalence guidelines.
3. **Verify Formulation Compatibility** (preventing dangerous cross-formulation substitutions like immediate-release vs sustained-release, or tablets vs pediatric syrups).
4. **Calculate True Apples-to-Apples Unit Pricing** (normalizing varying strip sizes into exact cost-per-tablet).
5. **Locate Nearby PMBJP Jan Aushadhi Kendras** and licensed retail pharmacies with interactive Google Maps navigation.
6. **Report Clinical or Pricing Discrepancies** via an audited peer-review error workflow.

---

## 2. Regulatory Datasets & API Integration

MediCompare adheres to strict medical data integrity standards. It distinguishes regulatory product approval from commercial pricing and never hallucinates medical data or prices.

| Data Source | Authority / Country | Integration Method | Role & Scope | Verification Status |
| :--- | :--- | :--- | :--- | :--- |
| **PMBJP Jan Aushadhi** | Dept. of Pharmaceuticals, Govt. of India (`IN`) | Structured Registry Adapter (`IndianMedicineAdapter.js`) | Official government generic product catalog with notified retail maximum retail prices (MRP). | `OFFICIAL_PRICE_REFERENCE` |
| **CDSCO** | Central Drugs Standard Control Organisation (`IN`) | Regulatory Formulation Mapping | Indian drug approval register, Schedule H prescription mandates, and banned drug lists. | `OFFICIAL_REGULATORY_RECORD` |
| **NPPA** | National Pharmaceutical Pricing Authority (`IN`) | Price Ceiling Normalization Engine | Price ceiling references. *(Note: Government ceiling prices are never treated as pharmacy selling prices).* | `REGULATORY_CEILING_REFERENCE` |
| **NLM RxNorm / RxNav** | National Library of Medicine (`US`) | Live REST API (`https://rxnav.nlm.nih.gov/REST/drugs.json`) with LRU caching | Standardized clinical drug names, active ingredients, and RxCUIs. Concept-only, non-commercial. | `OFFICIAL_REGULATORY_CONCEPT` |
| **openFDA NDC** | US Food & Drug Administration (`US`) | Live REST API (`https://api.fda.gov/drug/ndc.json`) with LRU caching | National Drug Code Directory labelers, NDA/ANDA approvals, and package descriptions. | `OFFICIAL_REGULATORY_RECORD` |

### Critical Regulatory Data Boundaries
- **Zero Price Fabrication:** openFDA and RxNorm do not publish retail pharmacy prices. The platform strictly refuses to invent prices or calculate false savings for international regulatory records.
- **Jurisdiction Isolation:** US FDA and RxNorm listings are never used to claim Indian CDSCO approval, nor is Indian availability inferred from US records.
- **Field-Level Provenance:** Provenance metadata (data authority, retrieval date, verification status, price type, jurisdiction) is preserved on each individual record.

---

## 3. Clinical Match Engine & Safety Rules

Clinical interchangeability cannot be inferred simply from similar brand names or loose ingredient overlap. MediCompare employs a multi-gate `ClinicalComparator` service:

### A. Formulation Compatibility Rules
1. **Dosage Form Matching:** Tablets, Capsules, Syrups, Injections, and Drops are categorized separately. A tablet is never matched as a substitute for an oral syrup.
2. **Release Characteristics:** Sustained Release (SR), Extended Release (ER), and Prolonged Release (PR) formulations are strictly segregated from Immediate Release (IR) products to prevent dose dumping or subtherapeutic plasma concentrations.
3. **Strength Parity:** A 500mg formulation is never presented as an automatic substitute for a 650mg tablet.

### B. Narrow Therapeutic Index (NTI) Safety Warnings
For narrow therapeutic index medications (such as anti-epileptics, levothyroxine, lithium, digoxin, and immunosuppressants), minor bioavailability variations between manufacturers can be clinically significant. MediCompare automatically attaches high-priority clinical advisories requiring direct physician supervision before brand switching.

### C. Safe Pricing & Savings Bounds
- Price comparisons are only computed when both items share identical bioequivalent active salts, dosage forms, release profiles, and verified retail prices in the same currency (`INR`).
- Zero division and floating-point errors are prevented with explicit unit-cost guards.

---

## 4. System Architecture

MediCompare is structured into an extensible, decoupled full-stack architecture:

```
medicompare/
├── client/                     # Frontend (React 18, Vite, Tailwind CSS, Lucide Icons)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx              # Navigation with saved count & error modal trigger
│   │   │   ├── SearchBar.jsx           # Accessible debounced search with country badges
│   │   │   ├── ComparisonView.jsx      # Clinical comparison view with formulation evaluation
│   │   │   ├── StoreLocator.jsx        # Jan Aushadhi Kendra locator with live directions
│   │   │   ├── ReportErrorModal.jsx    # Peer-review error reporting modal
│   │   │   ├── HowItWorksModal.jsx     # Clinical methodology and data sources guide
│   │   │   ├── SavedSwapsDrawer.jsx    # Offline-persisted bookmark drawer
│   │   │   └── PrescriptionScanner.jsx # Optical character recognition Rx scanner
│   │   └── services/api.js             # API client with error handling and normalization
├── server/                     # Backend API (Node.js, Express, ES Modules)
│   ├── adapters/
│   │   ├── IndianMedicineAdapter.js    # Indian Pharmacopoeia & PMBJP catalog normalizer
│   │   ├── RxNormAdapter.js            # Live NLM RxNav REST API connector (5s timeout)
│   │   ├── OpenFdaAdapter.js           # Live openFDA NDC API connector
│   │   └── SearchManager.js            # Multi-source parallel orchestrator with deduplication
│   ├── services/
│   │   ├── comparator.js               # Clinical formulation & bioequivalence comparator
│   │   └── reportService.js            # Persistent audit trail storage for reported discrepancies
│   ├── data/
│   │   ├── processed_medicines.json    # Standardized master Indian medicine database
│   │   ├── pharmacies.js               # Jan Aushadhi Kendra geographic coordinates
│   │   └── error_reports.json          # Persistent clinical review queue
│   ├── scripts/
│   │   ├── test_integration.js         # End-to-end API and search test suite
│   │   └── test_evaluation.js          # CEPL evaluation test suite
│   └── server.js                       # Express application server and route controllers
```

---

## 5. API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/search?q=:query&country=all&limit=10` | Multi-source autocomplete across Indian and international databases with deduplication and caching. |
| `GET` | `/api/medicine/:id` | Detailed medicine view with clinical formulation matching and unit-cost comparison. |
| `GET` | `/api/provenance/:id` | Field-level regulatory provenance, source authority, retrieval date, and verification status. |
| `GET` | `/api/stores?lat=:lat&lng=:lng&radius=:km` | Geo-located Jan Aushadhi Kendras and retail pharmacies sorted by distance. |
| `POST` | `/api/report-error` | Submits a data inaccuracy report with unique reference ID (`ERR-XXXXX`). |
| `GET` | `/api/reports?status=PENDING_REVIEW` | Retrieves clinical review queue reports for audit and moderation. |
| `GET` | `/api/categories` | Returns curated therapeutic health categories. |
| `GET` | `/api/stats` | Database records count, total generic groups, and store locator stats. |

---

## 6. Setup and Installation

### Prerequisites
- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 9.0.0 or higher

### Step 1: Clone Repository
```bash
git clone https://github.com/saraswani/medicompare.git
cd medicompare
```

### Step 2: Install Dependencies
```bash
# Install root, backend, and frontend dependencies
npm run build
```

### Step 3: Configure Environment Variables
Create a `.env` file in the `server/` directory:
```env
PORT=3001
# Optional: Google Gemini API key for accelerated vision OCR (default uses free local Tesseract OCR & Pharmacopoeia matcher)
GEMINI_API_KEY=your_gemini_api_key_here
```
*(Note: Zero API keys are required. The prescription scanner runs out of the box using built-in Tesseract OCR and pharmaceutical lexicon matching. `GEMINI_API_KEY` is completely optional).*

### Step 4: Run Locally in Development Mode
```bash
npm run dev
```
- **Frontend App**: `http://localhost:5173`
- **Backend API Server**: `http://localhost:3001`

---

## 7. Verification & Automated Test Suites

MediCompare includes two comprehensive automated test suites:

### 1. Evaluation Test Suite (`test:eval`)
Validates clinical safety gates, formulation mismatch detection, price bounds, and error logging:
```bash
npm run test:eval
```
**Test Results:**
- `[PASS]` Search Manager autocompletes Indian and international sources
- `[PASS]` Result deduplication and uniqueness across connected datasets
- `[PASS]` Schema normalization of all medicine fields and provenance metadata
- `[PASS]` Clinical Comparator flags formulation mismatch (Tablet vs Syrup)
- `[PASS]` Clinical Comparator flags release profile mismatch (SR vs IR)
- `[PASS]` Clinical Comparator flags strength mismatch (500mg vs 650mg)
- `[PASS]` Clinical Comparator strictly guards pricing calculations (no zero divisions)
- `[PASS]` Report-An-Error submission, persistence, and status indexing

### 2. Integration Test Suite (`test`)
Validates end-to-end API response, real salt matching (e.g. Dolo 650, Augmentin 625), and store geolocation:
```bash
npm test
```
**Test Results: 7/7 Passed (100%)**

---

## 8. Limitations & External Integration Notes

1. **CDSCO REST API Availability:** CDSCO (India) currently publishes regulatory drug approvals and banned formulations as periodic gazettes and portal tables without an authenticated public REST API. MediCompare uses a standardized, repeatable offline ingestion pipeline (`server/scripts/build_full_dataset.js`) with explicit retrieval dates and verification badges.
2. **Real-Time Pharmacy Stock:** While PMBJP prices and maximum retail prices (MRP) are strictly bounded by government notification, individual physical Jan Aushadhi store inventory fluctuates locally. The app displays phone numbers and directions for advance verification.
3. **External API Latency:** RxNorm and openFDA servers are located in North America. Network latency on initial requests is mitigated with an in-memory LRU cache and a strict `AbortSignal.timeout(5000)` fallback so local Indian queries are never delayed.
