async function runTests() {
  console.log('🧪 Starting MediCompare API & Integration Tests...\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } catch (e) {
      console.error(`❌ [FAIL] ${name}:`, e.message);
      failed++;
    }
  }

  // 1. Test Search
  await test('Search for "dolo" returns autocomplete results', async () => {
    const res = await fetch('http://localhost:3001/api/search?q=dolo');
    const data = await res.json();
    if (!data.results || data.results.length === 0) throw new Error('No results returned');
    const hasDolo = data.results.some(r => r.name.toLowerCase().includes('dolo'));
    if (!hasDolo) throw new Error('Dolo not in search results');
  });

  // 2. Test Search by Salt Name
  await test('Search by salt "amoxycillin" returns matching combination medicines', async () => {
    const res = await fetch('http://localhost:3001/api/search?q=amoxycillin');
    const data = await res.json();
    if (!data.results || data.results.length === 0) throw new Error('No salt matches returned');
  });

  // 3. Test Comparison Endpoint
  await test('Medicine comparison endpoint computes exact savings & cheapest alternative', async () => {
    const res = await fetch('http://localhost:3001/api/medicine/MED001'); // Dolo 650
    const data = await res.json();
    
    if (data.medicine.name !== 'Dolo 650 Tablet') throw new Error('Incorrect medicine returned');
    if (!data.cheapest_option) throw new Error('Missing cheapest_option');
    if (data.cheapest_option.name !== 'Paracetamol 650 Jan Aushadhi') {
      throw new Error(`Expected Jan Aushadhi as cheapest, got ${data.cheapest_option.name}`);
    }
    if (!data.savings.has_savings) throw new Error('Expected has_savings to be true for Dolo 650');
    if (data.savings.savings_percentage <= 0) throw new Error('Savings percentage must be > 0');
    if (!data.shared_composition.includes('Paracetamol')) throw new Error('Missing shared composition string');
    if (data.alternatives.length < 2) throw new Error('Expected multiple alternatives in group');
    
    console.log(`   ℹ️ Dolo 650 (₹${data.medicine.price}) vs ${data.cheapest_option.name} (₹${data.cheapest_option.price}) -> Savings: ${data.savings.savings_percentage}% (Save ₹${data.savings.savings_per_pack})`);
  });

  // 4. Test Augmentin 625 Duo Comparison
  await test('Augmentin 625 comparison against Jan Aushadhi Amoxyclav', async () => {
    const res = await fetch('http://localhost:3001/api/medicine/MED070'); // Augmentin 625
    const data = await res.json();
    
    if (data.medicine.name !== 'Augmentin 625 Duo Tablet') throw new Error('Incorrect medicine returned');
    if (data.savings.savings_percentage < 50) throw new Error('Expected > 50% savings for Augmentin vs generic');
    
    console.log(`   ℹ️ Augmentin 625 (₹${data.medicine.price}) vs ${data.cheapest_option.name} (₹${data.cheapest_option.price}) -> Savings: ${data.savings.savings_percentage}% (Save ₹${data.savings.savings_per_pack})`);
  });

  // 5. Test Categories
  await test('Categories endpoint returns health domains', async () => {
    const res = await fetch('http://localhost:3001/api/categories');
    const data = await res.json();
    if (!data.categories || data.categories.length < 5) throw new Error('Expected at least 5 categories');
  });

  // 6. Test Store Locator with GPS & City
  await test('Store locator returns Jan Aushadhi Kendras and General Pharmacies with calculated distance', async () => {
    const res = await fetch('http://localhost:3001/api/stores/nearby?lat=28.6139&lng=77.2090&city=Delhi');
    const data = await res.json();
    
    if (!data.jan_aushadhi_kendras || data.jan_aushadhi_kendras.length === 0) {
      throw new Error('No Jan Aushadhi Kendras returned');
    }
    if (!data.general_pharmacies || data.general_pharmacies.length === 0) {
      throw new Error('No General Pharmacies returned');
    }
    if (typeof data.jan_aushadhi_kendras[0].distance_km !== 'number') {
      throw new Error('Missing distance_km in store response');
    }
    if (!data.jan_aushadhi_kendras[0].directions_url.includes('google.com/maps')) {
      throw new Error('Invalid Google Maps directions URL');
    }
  });

  // 7. Test Stats
  await test('System stats returns database counts', async () => {
    const res = await fetch('http://localhost:3001/api/stats');
    const data = await res.json();
    if (data.total_medicines < 50) throw new Error('Expected > 50 medicines in dataset');
  });

  console.log(`\n📊 Test Summary: ${passed} Passed, ${failed} Failed\n`);
  if (failed > 0) process.exit(1);
}

runTests();
