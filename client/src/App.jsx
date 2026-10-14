import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import SearchBar from './components/SearchBar';
import CategoryBrowse from './components/CategoryBrowse';
import ComparisonView from './components/ComparisonView';
import StoreLocator from './components/StoreLocator';
import SavedSwapsDrawer from './components/SavedSwapsDrawer';
import HowItWorksModal from './components/HowItWorksModal';
import ReportErrorModal from './components/ReportErrorModal';
import { api } from './services/api';
import { 
  ShieldCheck, 
  TrendingDown, 
  Store, 
  Loader2, 
  ArrowLeft,
  Search,
  BookmarkCheck,
  HelpCircle,
  Sparkles,
  ArrowRight,
  Pill,
  CheckCircle2,
  Heart,
  AlertTriangle
} from 'lucide-react';

const STORAGE_KEY = 'medicompare_saved_swaps_v1';

export default function App() {
  const [selectedMedicineId, setSelectedMedicineId] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);
  const [loadingComparison, setLoadingComparison] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSavedDrawerOpen, setIsSavedDrawerOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportingMedicine, setReportingMedicine] = useState(null);
  
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
          window.scrollTo({ top: 100, behavior: 'smooth' });
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
    <div className="min-h-screen flex flex-col bg-[#f4f8fe] text-slate-900 pb-20 md:pb-0">
      
      {/* Top Colorful Navigation */}
      <Navbar
        onOpenSavedSwaps={() => setIsSavedDrawerOpen(true)}
        savedSwapsCount={savedSwaps.length}
        totalSavedAmount={totalSavedAmount}
        onOpenInfo={() => setIsInfoModalOpen(true)}
        onResetToHome={handleResetToHome}
        onOpenReportError={() => {
          setReportingMedicine(comparisonData?.medicine || null);
          setIsReportModalOpen(true);
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        
        {/* Hero & Search Header */}
        <section className="text-center max-w-3xl mx-auto space-y-3 pt-2 sm:pt-4">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/70 border border-blue-200 text-blue-700 text-xs font-bold shadow-sm">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <span>Govt. Jan Aushadhi (PMBJP) & CDSCO Verified Database</span>
          </div>

          {/* Exact Headline Requested */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Stop Overpaying for <span className="text-blue-600">Medicine Brands</span>
          </h1>

          {/* Exact Subtitle Requested */}
          <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto leading-relaxed font-normal">
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
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-3" />
            <p className="text-sm font-bold text-slate-700">Matching chemical salt formula & unit prices...</p>
          </div>
        )}

        {/* Comparison Screen */}
        {!loadingComparison && comparisonData && (
          <div className="space-y-6 sm:space-y-8 animate-fade-in">
            
            {/* Back to Home Button */}
            <div className="flex items-center justify-between">
              <button
                onClick={handleResetToHome}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-blue-600 bg-white hover:bg-blue-50 px-3.5 py-2 rounded-xl border border-blue-100 shadow-sm transition-all"
              >
                <ArrowLeft className="w-4 h-4 text-blue-600" />
                <span>Search another medicine</span>
              </button>

              <span className="text-xs text-slate-500 hidden sm:inline">
                Active Salt: <strong className="text-slate-900 bg-white px-2 py-1 rounded-md border border-slate-200">{comparisonData.shared_composition}</strong>
              </span>
            </div>

            <ComparisonView
              comparisonData={comparisonData}
              onSaveSwap={handleSaveSwap}
              isSwapSaved={isSwapSaved}
              onScrollToStores={handleScrollToStores}
              onSelectAlternative={(altId) => setSelectedMedicineId(altId)}
              onReportError={(med) => {
                setReportingMedicine(med);
                setIsReportModalOpen(true);
              }}
            />

            {/* Store Locator Section */}
            <StoreLocator
              forwardRef={storeSectionRef}
              activeMedicineName={comparisonData.medicine.name}
              cheapestGenericName={comparisonData.cheapest_option?.name}
            />
          </div>
        )}

        {/* Home Screen (when no medicine is selected) */}
        {!loadingComparison && !comparisonData && (
          <div className="space-y-8">
            
            {/* Interactive Colorful Doctor & Medicine Hero Card (Inspired by reference designs) */}
            <section className="max-w-5xl mx-auto rounded-3xl bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 text-white p-6 sm:p-8 shadow-xl shadow-blue-500/15 relative overflow-hidden">
              {/* Subtle light circles */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
              <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-blue-400/20 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* Left Text & Interactive Buttons */}
                <div className="md:col-span-7 space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                    <span>WHO-GMP Certified Salt Substitutions</span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black leading-tight tracking-tight">
                    Same Quality Salt. <br />
                    <span className="text-yellow-300">Up to 90% Less Price.</span>
                  </h2>

                  <p className="text-xs sm:text-sm text-blue-100 max-w-lg leading-relaxed font-normal">
                    In India, government Jan Aushadhi Kendras and certified generic manufacturers provide identical chemical formulations for common chronic illnesses like Diabetes, BP, and Antibiotics.
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      onClick={() => setSelectedMedicineId('MED001')}
                      className="px-4 py-2.5 bg-white hover:bg-blue-50 text-blue-600 rounded-xl font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 group"
                    >
                      <span>Try Dolo 650 Comparison</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>

                    <button
                      onClick={() => setIsInfoModalOpen(true)}
                      className="px-4 py-2.5 bg-blue-700/60 hover:bg-blue-700/80 text-white border border-white/25 rounded-xl font-semibold text-xs sm:text-sm backdrop-blur-sm transition-all"
                    >
                      How It Works
                    </button>
                  </div>
                </div>

                {/* Right Interactive Image Card with Doctor & Blister */}
                <div className="md:col-span-5 flex items-center justify-center relative">
                  <div className="relative w-full max-w-xs sm:max-w-sm">
                    {/* Doctor Card with Pop Hover */}
                    <div className="pop-card bg-white rounded-3xl p-3 shadow-2xl overflow-hidden border-2 border-white/40">
                      <div className="relative rounded-2xl overflow-hidden aspect-square bg-slate-100">
                        <img 
                          src="/images/doctor_hero.jpg" 
                          alt="Doctor reviewing prescription" 
                          className="w-full h-full object-cover object-top"
                          loading="eager"
                        />
                        {/* Rating floating badge */}
                        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full shadow-md flex items-center gap-1.5 text-xs font-black text-slate-800">
                          <span className="text-amber-500">★</span> 4.9 Verified
                        </div>
                      </div>

                      {/* Doctor info snippet */}
                      <div className="p-3 flex items-center justify-between text-slate-800">
                        <div>
                          <div className="font-bold text-sm text-slate-900">Dr. Recommended Generics</div>
                          <div className="text-[11px] text-slate-500">Indian Pharmacopoeia Standards</div>
                        </div>
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        </div>
                      </div>
                    </div>

                    {/* Floating 3D Medicine blister badge */}
                    <div className="pop-card absolute -bottom-4 -left-4 bg-white rounded-2xl p-2 shadow-xl border border-blue-100 flex items-center gap-2.5 hidden sm:flex">
                      <img 
                        src="/images/medicine_blister.jpg" 
                        alt="Generic Medicine" 
                        className="w-12 h-12 rounded-xl object-cover"
                      />
                      <div className="pr-2">
                        <div className="text-[10px] font-bold text-emerald-700 uppercase">Govt PMBJP</div>
                        <div className="text-xs font-black text-slate-900">₹8.50 / Strip</div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </section>

            {/* Health Category Browsing (Exact Image 4 Layout with Pop Hover Animation) */}
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

            {/* Value Pillars in Clean Colorful Cards */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto pt-2">
              <div className="pop-card bg-white rounded-2xl p-5 border border-blue-100 shadow-sm flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">100% Salt Equivalence</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Same active chemical molecule and dosage strength verified against Indian Pharmacopoeia standards.
                  </p>
                </div>
              </div>

              <div className="pop-card bg-white rounded-2xl p-5 border border-emerald-100 shadow-sm flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <TrendingDown className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">True Unit Pricing</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Standardizes strip sizes (10s, 15s) into exact cost-per-tablet so you see true apples-to-apples savings.
                  </p>
                </div>
              </div>

              <div className="pop-card bg-white rounded-2xl p-5 border border-indigo-100 shadow-sm flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Jan Aushadhi Kendra Locator</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Locate nearest government PMBJP Kendras and licensed retail pharmacies with live Google Maps directions.
                  </p>
                </div>
              </div>
            </section>

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-blue-100/80 py-6 mt-12 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">MediCompare</span>
            <span>— Open Indian Medicine & Price Comparison Directory</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-500 flex-wrap justify-center">
            <span>Data: CDSCO / PMBJP & NLM RxNorm</span>
            <button
              onClick={() => {
                setReportingMedicine(null);
                setIsReportModalOpen(true);
              }}
              className="text-blue-600 hover:text-blue-800 font-bold hover:underline flex items-center gap-1"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span>Report Data Discrepancy</span>
            </button>
            <button
              onClick={() => setIsInfoModalOpen(true)}
              className="text-slate-600 hover:text-blue-600 font-medium hover:underline"
            >
              Methodology & Safety
            </button>
          </div>
        </div>
      </footer>

      {/* Floating Mobile Bottom Navigation Bar (Inspired by Reference Mockup 1) */}
      <nav 
        aria-label="Mobile Navigation Dock"
        className="fixed bottom-3 left-4 right-4 z-50 floating-dock rounded-2xl md:hidden flex items-center justify-around h-14 px-2 border border-blue-200/60 shadow-xl"
      >
        <button
          onClick={handleResetToHome}
          className="flex flex-col items-center justify-center flex-1 h-full text-slate-600 hover:text-blue-600 transition-colors"
        >
          <Search className="w-4 h-4" />
          <span className="text-[10px] font-bold mt-0.5">Search</span>
        </button>

        <button
          onClick={() => {
            if (comparisonData) {
              handleScrollToStores();
            } else {
              window.scrollTo({ top: 350, behavior: 'smooth' });
            }
          }}
          className="flex flex-col items-center justify-center flex-1 h-full text-slate-600 hover:text-blue-600 transition-colors"
        >
          <Store className="w-4 h-4" />
          <span className="text-[10px] font-bold mt-0.5">Stores</span>
        </button>

        <button
          onClick={() => setIsSavedDrawerOpen(true)}
          className="relative flex flex-col items-center justify-center flex-1 h-full text-slate-600 hover:text-blue-600 transition-colors"
        >
          <BookmarkCheck className="w-4 h-4" />
          <span className="text-[10px] font-bold mt-0.5">Saved</span>
          {savedSwaps.length > 0 && (
            <span className="absolute top-1.5 right-4 w-4 h-4 bg-blue-600 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-sm">
              {savedSwaps.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setIsInfoModalOpen(true)}
          className="flex flex-col items-center justify-center flex-1 h-full text-slate-600 hover:text-blue-600 transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
          <span className="text-[10px] font-bold mt-0.5">Guide</span>
        </button>
      </nav>

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

      <ReportErrorModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        medicine={reportingMedicine}
      />

    </div>
  );
}
