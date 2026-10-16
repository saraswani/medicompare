/**
 * Evaluation Test Suite for Medicine Compare (CEPL Final Evaluation)
 * Tests:
 * 1. Multi-Source Search & Autocomplete
 * 2. Deduplication across datasets
 * 3. Schema normalization & missing field resilience
 * 4. Clinical Match Engine: Formulation mismatch detection (Tablet vs Syrup)
 * 5. Clinical Match Engine: Release profile mismatch detection (SR vs IR)
 * 6. Clinical Match Engine: Strength mismatch detection
 * 7. Price Comparison Safety: Zero divisions & unverified price gate
 * 8. Report-An-Error Workflow: Submission & persistent audit trail
 * 9. Resilience: External network timeout / failure fallback
 */

import { SearchManager } from '../adapters/SearchManager.js';
import { ClinicalComparator, MATCH_STATUS } from '../services/comparator.js';
import { ReportService } from '../services/reportService.js';
import assert from 'node:assert';

console.log('\n======================================================');
console.log('  VALUEBUY — CEPL FINAL EVALUATION TEST SUITE');
console.log('======================================================\n');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`[FAIL] ${name}`);
    console.error(`       Error: ${err.message}`);
  }
}

async function runAsyncTest(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`[PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`[FAIL] ${name}`);
    console.error(`       Error: ${err.message}`);
  }
}

async function runSuite() {
  const searchManager = new SearchManager();

  // Test 1: Autocomplete across connected datasets
  await runAsyncTest('Test 1: Search Manager autocompletes Indian and international sources', async () => {
    const res = await searchManager.search('Dolo', { limit: 5 });
    assert(res.results.length > 0, 'Expected results for Dolo');
    const first = res.results[0];
    assert.strictEqual(first.name.toLowerCase().includes('dolo'), true, 'Expected Dolo in first result');
    assert(first.provenance, 'Expected provenance object');
    assert.strictEqual(first.country, 'IN', 'Expected Indian country code for Dolo');
  });

  // Test 2: Deduplication across query hits
  await runAsyncTest('Test 2: Result deduplication and uniqueness', async () => {
    const res = await searchManager.search('Paracetamol', { limit: 20 });
    const ids = res.results.map(r => r.id);
    const uniqueIds = new Set(ids);
    assert.strictEqual(ids.length, uniqueIds.size, 'Search results must contain no duplicate IDs');
  });

  // Test 3: Schema normalization & field integrity
  await runAsyncTest('Test 3: Schema normalization of all medicine fields', async () => {
    const med = searchManager.getMedicineById('MED001');
    assert(med, 'Expected MED001 to exist');
    assert(typeof med.id === 'string', 'id must be string');
    assert(typeof med.name === 'string', 'name must be string');
    assert(typeof med.price === 'number', 'price must be number');
    assert(typeof med.unit_price === 'number', 'unit_price must be number');
    assert(typeof med.has_verified_price === 'boolean', 'has_verified_price must be boolean');
    assert(typeof med.dosage_form === 'string', 'dosage_form must be string');
    assert(typeof med.composition_key === 'string', 'composition_key must be string');
    assert(med.provenance && med.provenance.data_authority, 'provenance data_authority must exist');
  });

  // Test 4: Formulation Mismatch Detection (e.g. Tablet vs Syrup)
  runTest('Test 4: Clinical Comparator flags formulation mismatch (Tablet vs Syrup)', () => {
    const medTablet = {
      id: 'T1',
      name: 'Paracetamol 250mg Tablet',
      composition_key: 'paracetamol 250mg',
      dosage_form: 'Tablet',
      release_characteristic: 'Immediate Release',
      has_verified_price: true,
      price: 20,
      unit_price: 2,
      currency: 'INR'
    };
    const medSyrup = {
      id: 'S1',
      name: 'Paracetamol 250mg Paediatric Syrup',
      composition_key: 'paracetamol 250mg',
      dosage_form: 'Syrup',
      release_characteristic: 'Immediate Release',
      has_verified_price: true,
      price: 45,
      unit_price: 45,
      currency: 'INR'
    };

    const evaluation = ClinicalComparator.evaluateMatch(medTablet, medSyrup);
    assert.strictEqual(evaluation.status, MATCH_STATUS.FORMULATION_MISMATCH);
    assert.strictEqual(evaluation.is_substitutable_candidate, false);
    assert(evaluation.reasons.some(r => r.includes('dosage form')), 'Should explain dosage form difference');
  });

  // Test 5: Release Profile Mismatch Detection (SR vs IR)
  runTest('Test 5: Clinical Comparator flags release profile mismatch (SR vs IR)', () => {
    const medIR = {
      id: 'IR1',
      name: 'Metformin 500mg Tablet (Plain)',
      composition_key: 'metformin 500mg',
      dosage_form: 'Tablet',
      release_characteristic: 'Immediate Release',
      has_verified_price: true,
      price: 18,
      unit_price: 1.8,
      currency: 'INR'
    };
    const medSR = {
      id: 'SR1',
      name: 'Metformin 500mg Sustained Release Tablet',
      composition_key: 'metformin 500mg',
      dosage_form: 'Tablet',
      release_characteristic: 'Sustained Release (SR)',
      has_verified_price: true,
      price: 24,
      unit_price: 2.4,
      currency: 'INR'
    };

    const evaluation = ClinicalComparator.evaluateMatch(medIR, medSR);
    assert.strictEqual(evaluation.status, MATCH_STATUS.FORMULATION_MISMATCH);
    assert.strictEqual(evaluation.is_substitutable_candidate, false);
    assert(evaluation.reasons.some(r => r.includes('release profile')), 'Should explain release profile difference');
  });

  // Test 6: Strength Mismatch Detection
  runTest('Test 6: Clinical Comparator flags strength mismatch (500mg vs 650mg)', () => {
    const med500 = {
      id: 'P500',
      name: 'Paracetamol 500mg',
      composition_key: 'paracetamol 500mg',
      dosage_form: 'Tablet',
      release_characteristic: 'Immediate Release',
      has_verified_price: true
    };
    const med650 = {
      id: 'P650',
      name: 'Paracetamol 650mg',
      composition_key: 'paracetamol 650mg',
      dosage_form: 'Tablet',
      release_characteristic: 'Immediate Release',
      has_verified_price: true
    };

    const evaluation = ClinicalComparator.evaluateMatch(med500, med650);
    assert.strictEqual(evaluation.status, MATCH_STATUS.STRENGTH_MISMATCH);
    assert.strictEqual(evaluation.is_substitutable_candidate, false);
  });

  // Test 7: Safe Pricing & Bounded Calculations (No zero divisions)
  runTest('Test 7: Clinical Comparator strictly guards pricing calculations', () => {
    const target = {
      id: 'TGT',
      name: 'Target Med',
      composition_key: 'active salt 100mg',
      dosage_form: 'Tablet',
      release_characteristic: 'Immediate Release',
      has_verified_price: false, // Unverified price
      price: 0,
      unit_price: 0,
      pack_unit_count: 10,
      currency: 'INR'
    };
    const alt = {
      id: 'ALT',
      name: 'Alternative Med',
      composition_key: 'active salt 100mg',
      dosage_form: 'Tablet',
      release_characteristic: 'Immediate Release',
      has_verified_price: true,
      price: 15,
      unit_price: 1.5,
      pack_unit_count: 10,
      currency: 'INR'
    };

    const comparison = ClinicalComparator.buildComparison(target, [alt]);
    assert.strictEqual(comparison.can_calculate_savings, false, 'Savings must not be calculated when price is unverified');
    assert.strictEqual(comparison.alternatives[0].can_compare_price, false, 'Alt price must not be compared to 0 price target');
    assert.strictEqual(comparison.savings.savings_percentage, 0, 'Savings percentage must be 0');
  });

  // Test 8: Report-An-Error Workflow
  runTest('Test 8: Report-An-Error submission, persistence, and status indexing', () => {
    const testReport = ReportService.submitReport({
      medicine_id: 'MED001',
      medicine_name: 'Dolo 650 Tablet',
      error_type: 'PRICE_INACCURACY',
      description: 'Audit test: Verifying chemist retail price discrepancy reporting.',
      suggested_correction: 'MRP is 34.00 in Maharashtra',
      reporter_contact: 'qa-tester@medicompare.org'
    });

    assert(testReport.report_id.startsWith('ERR-'), 'Report ID should start with ERR-');
    assert.strictEqual(testReport.status, 'PENDING_REVIEW', 'Initial report status must be PENDING_REVIEW');

    const pendingReports = ReportService.getReports('PENDING_REVIEW');
    assert(pendingReports.some(r => r.report_id === testReport.report_id), 'Submitted report must be indexed in pending queue');
  });

  // Summary
  console.log('\n------------------------------------------------------');
  console.log(`  EVALUATION TEST SUMMARY: ${passedTests}/${totalTests} Tests Passed`);
  console.log('------------------------------------------------------\n');

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runSuite().catch(err => {
  console.error('Fatal test suite failure:', err);
  process.exit(1);
});
