import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import SearchBar from './components/SearchBar';
import CategoryBrowse from './components/CategoryBrowse';
import ComparisonView from './components/ComparisonView';
import StoreLocator from './components/StoreLocator';
import SavedSwapsDrawer from './components/SavedSwapsDrawer';
import HowItWorksModal from './components/HowItWorksModal';
import { api } from './services/api';
import { 
  ShieldCheck, 
  Sparkles, 
  TrendingDown, 
  Store, 
  HeartHandshake, 
  Loader2
} from 'lucide-react';

const STORAGE_KEY = 'medicompare_saved_swaps_v1';

export default function App() {
  const [selectedMedicineId, setSelectedMedicineId] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);
  const [loadingComparison, setLoadingComparison] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSavedDrawerOpen, setIsSavedDrawerOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [stats, setStats] = useState(null);
  
  const storeSectionRef = useRef(null);

  // Saved swaps persisted in localStorage
  const [savedSwaps, setSavedSwaps] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedSwaps));
    } catch (e) {
      console.error('LocalStorage write error:', e);
    }
  }, [savedSwaps]);

  // Fetch initial system stats
  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await api.getStats();
        setStats(data);
      } catch (err) {
        console.error('Stats fetch error:', err);
      }
    }
    fetchStats();
  }, []);

  // Fetch medicine comparison whenever selectedMedicineId changes
  useEffect(() => {
    if (!selectedMedicineId) {
      setComparisonData(null);
      return;
    }

    async function fetchComparison() {
      setLoadingComparison(true);
      try {
        const data = await api.getMedicineDetails(selectedMedicineId);
        if (data) {
          setComparisonData(data);
          window.scrollTo({ top: 180, behavior: 'smooth' });
        }
      } catch (err) {
        console.error('Error fetching comparison:', err);
      } finally {
        setLoadingComparison(false);
      }
    }

    fetchComparison();
  }, [selectedMedicineId]);

  // Handle saving a swap
  const handleSaveSwap = (originalMed, alternativeMed) => {
    setSavedSwaps((prev) => {
      const exists = prev.some(s => s.alternative.id === alternativeMed.id);
      if (exists) {
        return prev.filter(s => s.alternative.id !== alternativeMed.id);
      } else {
        const newSwap = {
          id: `${originalMed.id}-${alternativeMed.id}-${Date.now()}`,
          original: originalMed,
          alternative: alternativeMed,
          timestamp: new Date().toISOString()
        };
        return [newSwap, ...prev];
      }
    });
  };

  const isSwapSaved = (altId) => {
    return savedSwaps.some(s => s.alternative.id === altId);
  };

  const handleRemoveSwap = (swapId) => {
    setSavedSwaps(prev => prev.filter(s => s.id !== swapId));
  };

  const handleClearAllSwaps = () => {
    setSavedSwaps([]);
  };

  const handleScrollToStores = () => {
    if (storeSectionRef.current) {
      storeSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleResetToHome = () => {
    setSelectedMedicineId(null);
    setComparisonData(null);
    setSearchQuery('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalSavedAmount = Math.round(
    savedSwaps.reduce((acc, item) => {
      const diff = Math.max(0, item.original.price - item.alternative.price);
      return acc + diff;
    }, 0)
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      
      {/* Top Navigation */}
      <Navbar
        onOpenSavedSwaps={() => setIsSavedDrawerOpen(true)}
        savedSwapsCount={savedSwaps.length}
        totalSavedAmount={totalSavedAmount}
        onOpenInfo={() => setIsInfoModalOpen(true)}
        onResetToHome={handleResetToHome}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Hero & Search Header */}
        <section className="text-center max-w-3xl mx-auto space-y-4 pt-2 sm:pt-4">
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Discover Identical Salt Generics at up to 90% Lower Price</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Stop Overpaying for <span className="bg-gradient-to-r from-teal-700 via-emerald-600 to-teal-700 bg-clip-text text-transparent">Medicine Brands</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
            Enter the brand name on your prescription. We'll match the exact chemical salt composition and show you cheaper verified generic options and nearest Jan Aushadhi stores.
          </p>

          {/* Prominent Search Bar */}
          <div className="pt-2">
            <SearchBar
              onSelectMedicine={(id) => setSelectedMedicineId(id)}
              initialQuery={searchQuery}
            />
          </div>
        </section>

        {/* Loading State */}
        {loadingComparison && (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500">
            <Loader2 className="w-10 h-10 text-teal-600 animate-spin mb-3" />
            <p className="text-sm font-semibold">Comparing salt formulations & unit prices...</p>
          </div>
        )}

        {/* Comparison Screen */}
        {!loadingComparison && comparisonData && (
          <div className="space-y-10">
            <ComparisonView
              comparisonData={comparisonData}
              onSaveSwap={handleSaveSwap}
              isSwapSaved={isSwapSaved}
              onScrollToStores={handleScrollToStores}
              onSelectAlternative={(altId) => setSelectedMedicineId(altId)}
            />

            {/* Store Locator Section */}
            <StoreLocator
              forwardRef={storeSectionRef}
              activeMedicineName={comparisonData.medicine.name}
              cheapestGenericName={comparisonData.cheapest_option?.name}
            />
          </div>
        )}

        {/* Home Screen Widgets (when no medicine selected) */}
        {!loadingComparison && !comparisonData && (
          <div className="space-y-12">
            
            {/* Health Category Browsing */}
            <CategoryBrowse
              onSelectQuery={async (query) => {
                setSearchQuery(query);
                try {
                  const res = await api.searchMedicines(query, 1);
                  if (res && res.results && res.results[0]) {
                    setSelectedMedicineId(res.results[0].id);
                  }
                } catch (e) {
                  console.error('Category selection error:', e);
                }
              }}
            />

            {/* Trust & Transparency Value Pillars */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4">
              
              <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">100% Salt Equivalence</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Comparisons strictly match active chemical molecules and strength, verified against Indian Pharmacopoeia standards.
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
                  <TrendingDown className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Apples-to-Apples Unit Pricing</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    We normalize pack sizes (10s, 15s, bottles) into exact cost-per-tablet so you see true real-world savings.
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center flex-shrink-0">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Jan Aushadhi Locator</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Find nearest government Jan Aushadhi Kendras and retail pharmacies with live Google Maps directions.
                  </p>
                </div>
              </div>

            </section>

            {/* General Public Health Mission Callout */}
            <section className="bg-gradient-to-r from-teal-900 via-slate-900 to-teal-950 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-elevated">
              <div className="max-w-2xl relative z-10 space-y-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-teal-800 text-teal-200 text-xs font-semibold">
                  <HeartHandshake className="w-3.5 h-3.5" /> Public Health Mission
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                  Empowering Patients with Transparent Healthcare Data
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Millions of Indian households spend a substantial share of income on chronic prescription medicines (diabetes, hypertension, cardiac care). Knowing that an identical generic medicine exists at a fraction of the cost can save thousands of rupees every year.
                </p>
                <div className="pt-2 flex items-center gap-3">
                  <button
                    onClick={() => setIsInfoModalOpen(true)}
                    className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs sm:text-sm font-bold rounded-xl transition-colors"
                  >
                    Learn How Generic Swaps Work
                  </button>
                </div>
              </div>
            </section>

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">MediCompare</span>
            <span>— Open Public Medicine Price Directory</span>
          </div>

          <div>
            Built with verified Indian medicine dataset schemas • Not a substitute for professional medical advice.
          </div>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <SavedSwapsDrawer
        isOpen={isSavedDrawerOpen}
        onClose={() => setIsSavedDrawerOpen(false)}
        savedSwaps={savedSwaps}
        onRemoveSwap={handleRemoveSwap}
        onClearAll={handleClearAllSwaps}
        onSelectSavedMedicine={(id) => setSelectedMedicineId(id)}
      />

      <HowItWorksModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
      />

    </div>
  );
}
