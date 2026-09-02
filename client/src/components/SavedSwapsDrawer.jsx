import React from 'react';
import { 
  X, 
  Trash2, 
  BookmarkCheck, 
  ArrowRight, 
  Printer, 
  Sparkles, 
  Building2, 
  Pill, 
  TrendingDown,
  ShoppingBag
} from 'lucide-react';

export default function SavedSwapsDrawer({
  isOpen,
  onClose,
  savedSwaps,
  onRemoveSwap,
  onClearAll,
  onSelectSavedMedicine
}) {
  if (!isOpen) return null;

  // Calculate monthly accumulated savings (assuming 1 pack per month for chronic meds)
  const totalSavingsPerPack = savedSwaps.reduce((acc, item) => {
    const savings = Math.max(0, item.original.price - item.alternative.price);
    return acc + savings;
  }, 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
      />

      {/* Drawer Container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
          
          {/* Header */}
          <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-sm">
                <BookmarkCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-base text-slate-900">My Saved Swaps</h2>
                <p className="text-xs text-slate-500">{savedSwaps.length} medicines bookmarked</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
            {savedSwaps.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <div className="w-14 h-14 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <BookmarkCheck className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">No Saved Swaps Yet</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Search any medicine and click the bookmark icon on any cheaper alternative to save it to your prescription list.
                </p>
              </div>
            ) : (
              <>
                {/* Total Savings Tally Card */}
                <div className="bg-gradient-to-tr from-emerald-700 to-teal-800 text-white rounded-2xl p-4 shadow-md">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-emerald-200 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> Total Prescription Savings
                    </span>
                    <span className="text-[11px] bg-emerald-600/80 px-2 py-0.5 rounded-full font-bold">
                      Per Refill
                    </span>
                  </div>
                  <div className="text-3xl font-black tracking-tight text-white mt-1">
                    ₹{totalSavingsPerPack.toFixed(2)}
                  </div>
                  <p className="text-xs text-emerald-100/80 mt-1">
                    You save this much every month by choosing verified generic alternatives!
                  </p>
                </div>

                {/* List of Swaps */}
                <div className="space-y-3 pt-2">
                  {savedSwaps.map((item) => {
                    const savingsAmount = Math.max(0, item.original.price - item.alternative.price);
                    const savingsPct = item.original.price > 0 
                      ? Math.round((savingsAmount / item.original.price) * 100) 
                      : 0;

                    return (
                      <div
                        key={item.id}
                        className="bg-slate-50 border border-slate-200 rounded-2xl p-4 relative group hover:border-teal-300 transition-all"
                      >
                        {/* Delete Button */}
                        <button
                          onClick={() => onRemoveSwap(item.id)}
                          className="absolute top-3 right-3 text-slate-300 hover:text-rose-600 p-1 transition-colors"
                          title="Remove from saved"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <div className="pr-6">
                          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                            Salt: {item.original.display_composition}
                          </div>

                          {/* Swap Comparison Flow */}
                          <div className="mt-2 space-y-2">
                            {/* Original */}
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-500 line-through">
                                {item.original.name}
                              </span>
                              <span className="text-slate-400 font-medium line-through">
                                ₹{item.original.price.toFixed(2)}
                              </span>
                            </div>

                            {/* Alternative */}
                            <div className="flex items-center justify-between text-xs font-bold text-slate-900 bg-white p-2 rounded-xl border border-slate-200">
                              <div className="flex items-center gap-1.5 truncate">
                                <span className="text-teal-600">→</span>
                                <span className="truncate">{item.alternative.name}</span>
                              </div>
                              <span className="text-emerald-700 flex-shrink-0">
                                ₹{item.alternative.price.toFixed(2)}
                              </span>
                            </div>
                          </div>

                          {/* Savings pill */}
                          <div className="mt-2.5 flex items-center justify-between text-xs">
                            <span className="font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                              Save ₹{savingsAmount.toFixed(2)} ({savingsPct}%)
                            </span>

                            <button
                              onClick={() => {
                                onSelectSavedMedicine(item.original.id);
                                onClose();
                              }}
                              className="text-teal-700 hover:underline font-semibold flex items-center gap-1 text-[11px]"
                            >
                              <span>View Details</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Footer Actions */}
          {savedSwaps.length > 0 && (
            <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-2">
              <button
                onClick={handlePrint}
                className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Show to Doctor & Chemist</span>
              </button>

              <button
                onClick={onClearAll}
                className="w-full py-2 text-slate-500 hover:text-rose-600 text-xs font-semibold transition-colors"
              >
                Clear All Saved Swaps
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
