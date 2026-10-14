import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Pill, 
  Building2, 
  Scale, 
  Bookmark, 
  BookmarkCheck, 
  MapPin, 
  ShieldCheck, 
  AlertTriangle,
  TrendingDown,
  ArrowRight,
  Info,
  FileText,
  X,
  Share2,
  Sparkles
} from 'lucide-react';

export default function ComparisonView({
  comparisonData,
  onSaveSwap,
  isSwapSaved,
  onScrollToStores,
  onSelectAlternative,
  onReportError
}) {
  const [filterType, setFilterType] = useState('all'); // 'all' | 'janaushadhi' | 'generic'
  const [chemistModalMed, setChemistModalMed] = useState(null);

  if (!comparisonData || !comparisonData.medicine) return null;

  const { medicine, cheapest_option, savings, alternatives, shared_composition } = comparisonData;
  const isTargetAlreadyCheapest = !savings?.has_savings || medicine.id === cheapest_option.id;

  const filteredAlternatives = alternatives.filter((alt) => {
    if (filterType === 'janaushadhi') {
      return alt.badge_type === 'PMBJP Generic' || alt.name.toLowerCase().includes('jan aushadhi');
    }
    if (filterType === 'generic') {
      return alt.generic_flag === true;
    }
    return true;
  });

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-28">
      
      {/* 1. Prescribed Medicine Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-blue-100 shadow-[0_4px_20px_rgba(37,99,235,0.06)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                Prescribed Drug
              </span>

              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-600" />
                Schedule H (Rx Required)
              </span>

              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                medicine.generic_flag 
                  ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                  : 'bg-slate-100 text-slate-700 border border-slate-200'
              }`}>
                {medicine.badge_type}
              </span>

              {medicine.country && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-50 text-slate-700 border border-slate-200">
                  {medicine.country === 'IN' ? '🇮🇳 India' : medicine.country === 'US' ? '🇺🇸 United States' : medicine.country}
                </span>
              )}

              {medicine.provenance?.data_authority && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
                  {medicine.provenance.data_authority}
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {medicine.name}
            </h1>
            
            <p className="text-xs sm:text-sm text-slate-600 flex items-center gap-2 flex-wrap font-medium">
              <span className="text-slate-900 font-semibold">{medicine.manufacturer_name}</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-600">{medicine.pack_size_label}</span>
              {medicine.dosage_form && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                    {medicine.dosage_form} ({medicine.release_characteristic || 'Immediate Release'})
                  </span>
                </>
              )}
            </p>
          </div>

          {/* Searched Price Reference & Report Discrepancy Action */}
          <div className="flex items-center md:flex-col md:items-end justify-between border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 bg-blue-50/50 md:bg-transparent p-3.5 md:p-0 rounded-2xl">
            {(medicine.has_verified_price !== false && medicine.price > 0) ? (
              <>
                <div>
                  <span className="text-xs text-slate-500 block md:text-right font-medium">Standard MRP</span>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900">
                    ₹{medicine.price.toFixed(2)}
                  </div>
                </div>
                <div className="text-xs text-blue-700 font-bold md:mt-0.5">
                  ₹{medicine.unit_price.toFixed(2)} / unit
                </div>
              </>
            ) : (
              <div className="text-right">
                <span className="text-xs font-semibold text-slate-500 block">Registry Reference</span>
                <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 inline-block mt-1">
                  Non-Commercial Concept
                </span>
              </div>
            )}

            {onReportError && (
              <button
                onClick={() => onReportError(medicine)}
                className="mt-2 text-[11px] font-bold text-slate-500 hover:text-amber-700 hover:underline flex items-center gap-1"
                title="Report incorrect pricing or formulation"
              >
                <AlertTriangle className="w-3 h-3 text-amber-500" />
                <span>Report Discrepancy</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Active Salt Equivalence Certificate */}
      <div className="bg-gradient-to-r from-blue-50 via-sky-50 to-indigo-50 border border-blue-200 rounded-3xl p-4 sm:p-5 shadow-sm">
        <div className="flex items-start gap-3.5">
          <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-md shadow-blue-500/25 flex-shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-black uppercase tracking-wider text-blue-900 bg-blue-200/70 px-2.5 py-0.5 rounded-full">
                Active Chemical Salt Match
              </span>
              <span className="text-xs text-blue-800 font-bold">
                100% Bioequivalent API
              </span>
            </div>
            
            <p className="text-sm sm:text-base font-black text-slate-900">
              Active Chemical Formula: <span className="text-blue-700 font-mono bg-white px-2.5 py-0.5 rounded-lg border border-blue-200 shadow-sm">{shared_composition}</span>
            </p>

            <p className="text-xs text-slate-600 leading-relaxed font-normal pt-0.5">
              Under Indian Pharmacopoeia (IP) standards, medicines sharing identical active molecules and strength produce equal clinical therapeutic efficacy. Branded drugs cost more due to proprietary marketing, representative networks, and distributor margins.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Filter Tabs & Available Alternatives Grid with Pop Cards */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <Scale className="w-5 h-5 text-blue-600" />
              <span>Bioequivalent Alternatives ({alternatives.length})</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium">Ranked from lowest cost per tablet/unit</p>
          </div>

          {/* Quick Filter Segmented Control */}
          <div className="inline-flex rounded-xl p-1 bg-white border border-blue-200/80 text-xs font-bold shadow-sm self-start sm:self-auto">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filterType === 'all' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-blue-600'
              }`}
            >
              All ({alternatives.length})
            </button>
            <button
              onClick={() => setFilterType('janaushadhi')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filterType === 'janaushadhi' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              Jan Aushadhi (PMBJP)
            </button>
            <button
              onClick={() => setFilterType('generic')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filterType === 'generic' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-blue-600'
              }`}
            >
              Low-Cost Generics
            </button>
          </div>
        </div>

        {/* Alternative Cards Grid with Pop Animation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAlternatives.map((alt) => {
            const isSearched = alt.id === medicine.id;
            const isCheapest = alt.id === cheapest_option.id;
            const isSaved = isSwapSaved(alt.id);
            const savingsVsTarget = Math.max(0, medicine.unit_price - alt.unit_price);
            const savingsPercent = medicine.unit_price > 0 
              ? Math.round((savingsVsTarget / medicine.unit_price) * 100)
              : 0;

            return (
              <div
                key={alt.id}
                className={`pop-card rounded-3xl p-5 border transition-all flex flex-col justify-between ${
                  isSearched 
                    ? 'bg-slate-50/80 border-slate-300' 
                    : isCheapest 
                      ? 'bg-white border-emerald-400 ring-2 ring-emerald-400/25 shadow-md hover:border-emerald-500' 
                      : 'bg-white border-blue-100 hover:border-blue-300 shadow-sm'
                }`}
              >
                <div>
                  {/* Badges & Save Action */}
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className="flex flex-wrap gap-1.5">
                      {isCheapest && (
                        <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 shadow-sm">
                          <Sparkles className="w-3 h-3 text-emerald-600" />
                          Lowest Price Choice
                        </span>
                      )}

                      {isSearched && (
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-800">
                          Searched Baseline
                        </span>
                      )}

                      {alt.evaluation?.status_label && (
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                          alt.evaluation.badge_color || 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {alt.evaluation.status_label}
                        </span>
                      )}

                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        alt.badge_type === 'PMBJP Generic'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : alt.generic_flag
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {alt.badge_type}
                      </span>

                      {alt.country && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          {alt.country === 'IN' ? '🇮🇳 IN' : alt.country === 'US' ? '🇺🇸 US' : alt.country}
                        </span>
                      )}
                    </div>

                    {/* Bookmark Button */}
                    <button
                      onClick={() => onSaveSwap(medicine, alt)}
                      className={`p-2 rounded-xl border transition-all duration-150 ${
                        isSaved
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 border-slate-200'
                      }`}
                      aria-label={isSaved ? 'Remove saved swap' : 'Save swap to list'}
                      title={isSaved ? 'Saved to list' : 'Bookmark this alternative'}
                    >
                      {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Medicine Name & Details */}
                  <h3 className="font-extrabold text-base text-slate-900 leading-snug">
                    {alt.name}
                  </h3>

                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 font-medium">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{alt.manufacturer_name}</span>
                  </p>

                  <p className="text-xs text-slate-500 mt-0.5">
                    Pack: <span className="text-slate-800 font-bold">{alt.pack_size_label}</span>
                    {alt.dosage_form && (
                      <span className="text-slate-500 ml-2 font-medium">
                        • {alt.dosage_form}
                      </span>
                    )}
                  </p>

                  <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 font-medium">
                    <span>Source:</span>
                    <span className="text-slate-600">{alt.provenance?.data_authority || alt.source || 'CDSCO / PMBJP'}</span>
                  </p>
                </div>

                {/* Price Math & Savings Callout */}
                <div className="mt-5 pt-3.5 border-t border-slate-100">
                  {(alt.can_compare_price !== false && alt.price > 0) ? (
                    <>
                      <div className="flex items-baseline justify-between mb-2">
                        <div>
                          <span className="text-[11px] text-slate-400 block font-medium">Total MRP</span>
                          <div className="text-xl font-black text-slate-900">
                            ₹{alt.price.toFixed(2)}
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[11px] text-slate-400 block font-medium">Unit Cost</span>
                          <div className="text-sm font-extrabold text-blue-700">
                            ₹{alt.unit_price.toFixed(2)} <span className="text-[11px] font-normal text-slate-400">/ unit</span>
                          </div>
                        </div>
                      </div>

                      {/* Savings Calculation */}
                      {savingsPercent > 0 ? (
                        <div className="bg-emerald-50 rounded-xl p-2.5 border border-emerald-200 flex items-center justify-between text-xs font-bold text-emerald-900 mt-2">
                          <span className="flex items-center gap-1">
                            <TrendingDown className="w-4 h-4 text-emerald-600" />
                            Save {savingsPercent}%
                          </span>
                          <span className="font-black text-emerald-700">
                            -₹{(savingsVsTarget * medicine.pack_unit_count).toFixed(2)} / strip
                          </span>
                        </div>
                      ) : isSearched ? (
                        <div className="bg-slate-100 rounded-xl p-2 text-center text-xs text-slate-500 font-semibold mt-2">
                          Reference price
                        </div>
                      ) : (
                        <div className="bg-slate-50 rounded-xl p-2 text-center text-xs text-slate-400 mt-2">
                          Equivalent price
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-600 mb-2">
                      <div className="font-bold text-slate-800 flex items-center gap-1 text-[11px]">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        <span>Price Comparison Ineligible</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                        {alt.evaluation?.reasons?.[0] || 'Official registry concept without verified pharmacy retail price.'}
                      </p>
                    </div>
                  )}

                  {/* Action Row */}
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-1">
                    <button
                      onClick={() => setChemistModalMed(alt)}
                      className="w-full py-2 px-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center justify-center gap-1 min-h-[38px]"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                      <span>Chemist Slip</span>
                    </button>

                    {!isSearched ? (
                      <button
                        onClick={() => onSelectAlternative(alt.id)}
                        className="w-full py-2 px-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-500/25 rounded-xl transition-colors flex items-center justify-center gap-1 min-h-[38px]"
                      >
                        <span>Compare</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={onScrollToStores}
                        className="w-full py-2 px-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center justify-center gap-1 min-h-[38px]"
                      >
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        <span>Find Stores</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Clinical Safety & Regulatory Advisory */}
      <div className="bg-white border border-blue-100 rounded-2xl p-4 text-xs text-slate-600 leading-relaxed space-y-1.5 shadow-sm">
        <div className="flex items-center gap-2 font-bold text-slate-900">
          <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span>Patient Health Safety & Regulatory Note</span>
        </div>
        <p>
          Medicines listed above share the identical chemical salt molecule and dosage formulation. Always verify with your registered pharmacist or prescribing doctor before substitution. For <strong>narrow therapeutic index</strong> drugs (such as anti-epileptic medications, lithium, thyroxine, or cardiac glycosides), brand substitution should only be done with direct physician supervision.
        </p>
      </div>

      {/* 5. Mobile & Desktop Slim Savings Sticky Bar */}
      {!isTargetAlreadyCheapest && savings?.savings_percentage > 0 && (
        <aside 
          aria-label="Medicine Savings Summary"
          className="fixed bottom-16 md:bottom-3 left-4 right-4 z-40 max-w-5xl mx-auto floating-dock text-slate-900 px-4 py-3 rounded-2xl border border-blue-200/80 shadow-2xl animate-slide-up"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[11px] text-slate-500 hidden xs:block font-semibold">
                Cheapest Generic Match
              </div>
              <div className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                Save <span className="text-emerald-600 font-black">₹{savings.savings_per_pack.toFixed(2)} ({savings.savings_percentage}%)</span> with <span className="text-blue-600">{cheapest_option.name}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setChemistModalMed(cheapest_option)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1"
              >
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">Chemist Slip</span>
              </button>

              <button
                onClick={() => onSaveSwap(medicine, cheapest_option)}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/25 transition-colors flex items-center gap-1"
              >
                <BookmarkCheck className="w-3.5 h-3.5" />
                <span>Save Swap</span>
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* 6. One-Tap 'Show Chemist Slip' Modal */}
      {chemistModalMed && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-blue-200 relative space-y-4 animate-scale-in">
            <button
              onClick={() => setChemistModalMed(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              aria-label="Close chemist slip"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-blue-600">
              <FileText className="w-5 h-5" />
              <h2 className="text-sm font-black uppercase tracking-wider">Chemist Counter Reference</h2>
            </div>

            <div className="bg-blue-50/60 border-2 border-dashed border-blue-200 rounded-2xl p-4 text-center space-y-1.5">
              <span className="text-[11px] font-bold text-blue-800 uppercase">
                Active Chemical Molecule & Strength
              </span>
              <div className="text-lg sm:text-xl font-black text-slate-900 font-mono">
                {shared_composition}
              </div>
              <div className="text-xs text-slate-600 font-medium">
                Identical to prescribed: <strong>{medicine.name}</strong>
              </div>
            </div>

            <div className="border border-slate-200 rounded-2xl p-4 bg-white space-y-2.5 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500">Requested Generic:</span>
                <span className="font-extrabold text-slate-900 text-sm">{chemistModalMed.name}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500">Manufacturer:</span>
                <span className="font-bold text-slate-800">{chemistModalMed.manufacturer_name}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500">Generic Unit MRP:</span>
                <span className="font-black text-emerald-600 text-sm">₹{chemistModalMed.unit_price.toFixed(2)} / unit</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">Classification:</span>
                <span className="font-bold text-blue-700">{chemistModalMed.badge_type}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 text-center font-medium">
              Hand this screen to the pharmacist to dispense the generic version containing this exact chemical formulation.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: `${chemistModalMed.name} - Generic Salt Match`,
                      text: `Generic substitute for ${medicine.name}: ${chemistModalMed.name} (${shared_composition}) at ₹${chemistModalMed.unit_price}/unit.`
                    }).catch(() => {});
                  }
                }}
                className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>

              <button
                onClick={() => setChemistModalMed(null)}
                className="flex-1 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-colors shadow-sm"
              >
                Close Slip
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
