# Chrome Web Store Listing — ValueBuy

Single source of truth for the ValueBuy Chrome Extension Web Store submission.

---

## 1. Store Listing Metadata

| Field | Value |
| :--- | :--- |
| **Extension Name** | ValueBuy — Indian Medicine Generic Finder |
| **Short Description** (Max 132 chars) | Compare Indian medicine prices by exact salt composition. Discover cheaper Jan Aushadhi generic alternatives and save up to 90%. |
| **Category** | Accessibility / Shopping & Healthcare |
| **Primary Language** | English |
| **Support URL** | http://localhost:5173 |

---

## 2. Detailed Description

```markdown
Save up to 90% on your Indian prescription medicines with ValueBuy!

When you search for medicines or browse Indian pharmacy websites (Tata 1mg, Apollo Pharmacy, Netmeds, PharmEasy), ValueBuy automatically matches the exact active chemical salt formulation (API) and shows you the verified lower-cost generic equivalent, including Pradhan Mantri Bhartiya Janaushadhi Pariyojana (PMBJP) products.

### Key Features:
✨ Instant Salt-by-Salt Comparison: Check identical chemical salt compositions across Indian manufacturers.
✨ Live Savings Calculator: See exactly how many rupees you save per unit and per pack.
✨ E-Pharmacy Generic Alerts: Floating discreet alerts on popular pharmacy sites showing verified generic options.
✨ Nearby Store Locator: Find nearby Jan Aushadhi Kendras and retail pharmacies with Google Maps directions.
✨ My Saved Swaps: Keep a list of your chronic medication swaps with total monthly prescription savings.

### Why Switch to Generics?
Generic medicines in India contain the identical active pharmaceutical ingredient (e.g. Paracetamol 650mg, Metformin 500mg, Amoxycillin 500mg + Clavulanic Acid 125mg) and must meet the exact same CDSCO bio-equivalence standards as branded drugs, without the expensive marketing and promotion costs.

*Always consult your licensed physician or registered pharmacist before switching prescription medications.*
```

---

## 3. Permissions Justification

| Permission | Justification |
| :--- | :--- |
| `storage` | Required to store the user's bookmarked medicine swaps and preference settings locally in `chrome.storage.local`. |
| `activeTab` | Required to detect the active medicine name on supported Indian e-pharmacy websites when the user clicks the extension. |
| `host_permissions` (`https://*.1mg.com/*`, `https://*.apollopharmacy.in/*`, `https://*.netmeds.com/*`, `https://*.pharmeasy.in/*`) | Required for the content script to detect the prescribed medicine title on Indian online pharmacy product pages and show the bio-equivalent generic alternative. |
| `host_permissions` (`http://localhost:3001/*`) | Required for the extension to communicate with the local MediCompare API backend for instant medicine composition lookups. |

---

## 4. Privacy & Data Handling Disclosures

- **Personally Identifiable Information (PII)**: None collected.
- **Health Data**: Search queries and saved swaps are stored strictly locally in browser memory (`chrome.storage.local`) and are never tracked or shared with third parties.
- **User Authentication**: No user account or login is required.
- **Website Content**: The content script reads only the product title element on pharmacy product pages to query matching generic compositions.

---

## 5. Version History

- **v1.0.0** (2026-09-02): Initial release featuring Manifest V3 support, type-ahead medicine search popup, e-pharmacy generic alert badge, and Jan Aushadhi price comparisons.
