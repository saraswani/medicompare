import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Sparkles, 
  Pill, 
  Building2, 
  Scale, 
  Bookmark, 
  BookmarkCheck, 
  MapPin, 
  ShieldCheck, 
  AlertCircle,
  TrendingDown,
  ArrowRight,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function ComparisonView({
  comparisonData,
  onSaveSwap,
  isSwapSaved,
  onScrollToStores,
  onSelectAlternative
}) {
  if (!comparisonData || !comparisonData.medicine) return null;

  const { medicine, cheapest_option, savings, alternatives, shared_composition, salts } = comparisonData;
  const isTargetAlreadyCheapest = !savings?.has_savings || medicine.id === cheapest_option.id;

  const handleCelebrateSwap = (alt) => {
    onSaveSwap(medicine, alt);
    // Fire confetti for big savings
    if (savings?.savings_percentage > 20) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.85 }
        });
      } catch (e) {
        // Safe fail
      }
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-24">
      
      {/* 1. Searched Medicine Hero Card */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-teal-50/50 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                Prescribed / Searched Medicine
              </span>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                medicine.generic_flag 
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' 
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}>
                <Pill className="w-3 h-3" />
                {medicine.badge_type}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {medicine.name}
            </h1>
            
            <p className="text-xs sm:text-sm text-slate-500 mt-1 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-slate-400" />
              <span>{medicine.manufacturer_name}</span>
              <span>•</span>
              <span className="font-medium text-slate-700">{medicine.pack_size_label}</span>
            </p>
          </div>

          {/* Searched Medicine Price */}
          <div className="flex items-center md:flex-col md:items-end justify-between border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
            <div>
              <span className="text-xs text-slate-400 block md:text-right">Searched MRP</span>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">
                ₹{medicine.price.toFixed(2)}
              </div>
            </div>
            <div className="text-xs text-slate-500 font-medium md:mt-0.5">
              ₹{medicine.unit_price.toFixed(2)} / unit
            </div>
          </div>
        </div>
      </div>

      {/* 2. Trust & Proof Element: Shared Salt Composition */}
      <div className="bg-gradient-to-r from-teal-50 via-emerald-50 to-teal-50 border border-teal-200 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 bg-teal-600 text-white rounded-xl shadow-sm flex-shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-900 bg-teal-200/60 px-2 py-0.5 rounded">
                Active Salt Proof
              </span>
              <span className="text-xs text-teal-700 font-medium">
                100% Identical Chemical Composition
              </span>
            </div>
            
            <p className="text-sm sm:text-base font-bold text-teal-950 mt-1">
              All alternatives below contain: <span className="underline decoration-teal-400 underline-offset-2">{shared_composition}</span>
            </p>

            <p className="text-xs text-teal-800/80 mt-1 leading-relaxed">
              In India, medicines sharing the exact same active pharmaceutical ingredient (API) and strength deliver identical therapeutic bio-equivalence. The main difference is brand marketing and pricing markup.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Comparison Cards Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Scale className="w-5 h-5 text-teal-600" />
              <span>Available Equivalents ({alternatives.length})</span>
            </h2>
            <p className="text-xs text-slate-500">Sorted from lowest cost per unit</p>
          </div>

          <button
            onClick={onScrollToStores}
            className="flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg border border-teal-200 transition-colors"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Find Stores</span>
          </button>
        </div>

        {/* Mobile Horizontal Scroll + Desktop Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {alternatives.map((alt) => {
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
                className={`relative rounded-2xl bg-white p-5 border transition-all flex flex-col justify-between ${
                  isSearched 
                    ? 'border-slate-300 ring-2 ring-slate-400/20 bg-slate-50/40' 
                    : isCheapest 
                      ? 'border-emerald-400 ring-2 ring-emerald-500/20 shadow-card hover:shadow-elevated' 
                      : 'border-slate-200 hover:border-teal-300 hover:shadow-card'
                }`}
              >
                {/* Top Ribbons & Badges */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex flex-wrap gap-1.5">
                      {isCheapest && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 shadow-sm">
                          <Sparkles className="w-3 h-3 text-emerald-600" />
                          Cheapest Swap
                        </span>
                      )}

                      {isSearched && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 border border-slate-300">
                          Current Choice
                        </span>
                      )}

                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        alt.generic_flag
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        <Pill className="w-3 h-3" />
                        {alt.badge_type}
                      </span>
                    </div>

                    {/* Bookmark / Save Swap button */}
                    <button
                      onClick={() => handleCelebrateSwap(alt)}
                      className={`p-1.5 rounded-lg border transition-colors ${
                        isSaved
                          ? 'bg-teal-600 text-white border-teal-600'
                          : 'bg-slate-50 text-slate-400 hover:text-teal-600 hover:bg-teal-50 border-slate-200'
                      }`}
                      title={isSaved ? 'Swap saved' : 'Save swap to list'}
                    >
                      {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Brand & Manufacturer Info */}
                  <h3 className="font-bold text-base text-slate-900 leading-snug">
                    {alt.name}
                  </h3>

                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{alt.manufacturer_name}</span>
                  </p>

                  <p className="text-xs text-slate-400 mt-0.5">
                    Pack: <span className="text-slate-600 font-medium">{alt.pack_size_label}</span>
                  </p>
                </div>

                {/* Price & Unit Comparison Section */}
                <div className="mt-5 pt-4 border-t border-slate-100">
                  <div className="flex items-baseline justify-between mb-2">
                    <div>
                      <div className="text-xs text-slate-400">Total Price</div>
                      <div className="text-xl font-extrabold text-slate-900">
                        ₹{alt.price.toFixed(2)}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-slate-400">Apples-to-Apples</div>
                      <div className="text-sm font-bold text-slate-700">
                        ₹{alt.unit_price.toFixed(2)} <span className="text-[11px] font-normal text-slate-400">/ unit</span>
                      </div>
                    </div>
                  </div>

                  {/* Savings Callout vs Prescribed */}
                  {savingsPercent > 0 ? (
                    <div className="bg-emerald-50 rounded-xl p-2.5 border border-emerald-200 flex items-center justify-between text-xs font-semibold text-emerald-900 mt-2">
                      <span className="flex items-center gap-1">
                        <TrendingDown className="w-4 h-4 text-emerald-600" />
                        Save {savingsPercent}% vs searched
                      </span>
                      <span className="font-bold text-emerald-700">
                        -₹{(savingsVsTarget * medicine.pack_unit_count).toFixed(2)}/pack
                      </span>
                    </div>
                  ) : isSearched ? (
                    <div className="bg-slate-100 rounded-xl p-2 text-center text-xs text-slate-500 font-medium mt-2">
                      Baseline for comparison
                    </div>
                  ) : (
                    <div className="bg-slate-50 rounded-xl p-2 text-center text-xs text-slate-500 mt-2">
                      Same or higher price
                    </div>
                  )}

                  {/* Switch to this medicine button */}
                  {!isSearched && (
                    <button
                      onClick={() => onSelectAlternative(alt.id)}
                      className="w-full mt-3 py-2 text-xs font-semibold text-teal-700 bg-teal-50/70 hover:bg-teal-100 border border-teal-200 rounded-xl transition-colors flex items-center justify-center gap-1"
                    >
                      <span>Compare against this</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Mandatory Clinical Disclaimer */}
      <div className="bg-slate-100/80 border border-slate-200 rounded-xl p-4 flex items-start gap-3 text-slate-600 text-xs leading-relaxed">
        <AlertCircle className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-800">Important Medical Disclaimer: </span>
          All comparisons are based on published chemical composition data. While generic equivalents contain the exact same salt molecule, always verify dosage, brand availability, and physician instructions with your licensed doctor or registered pharmacist before switching medications.
        </div>
      </div>

      {/* 5. Sticky Live Savings Bar (Desktop bottom / Mobile fixed bottom) */}
      {!isTargetAlreadyCheapest && savings?.savings_percentage > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900 text-white px-4 py-3 sm:py-3.5 shadow-sticky-bar border-t border-slate-800 animate-slide-up">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm font-bold">
                ₹
              </div>
              <div className="text-center sm:text-left">
                <div className="text-xs text-slate-300">
                  Instant Savings Opportunity
                </div>
                <div className="text-sm sm:text-base font-bold text-white">
                  You can save <span className="text-emerald-400 font-extrabold">₹{savings.savings_per_pack.toFixed(2)} ({savings.savings_percentage}%)</span> by switching to <span className="text-teal-300">{cheapest_option.name}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => handleCelebrateSwap(cheapest_option)}
                className="flex-1 sm:flex-none px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
              >
                <BookmarkCheck className="w-4 h-4" />
                <span>Save This Swap</span>
              </button>

              <button
                onClick={onScrollToStores}
                className="flex-1 sm:flex-none px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs sm:text-sm font-semibold rounded-xl border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
              >
                <MapPin className="w-4 h-4 text-teal-400" />
                <span>Find Nearby Stores</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fallback note if target is already cheapest */}
      {isTargetAlreadyCheapest && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center text-xs sm:text-sm font-medium text-emerald-800">
          🎉 Great news! You are already viewing the most affordable option (₹{medicine.unit_price.toFixed(2)}/unit) for this salt composition in our database.
        </div>
      )}

    </div>
  );
}
