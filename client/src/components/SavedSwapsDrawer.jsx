import React from 'react';
import { 
  X, 
  Trash2, 
  BookmarkCheck, 
  ArrowRight, 
  Printer, 
  Building2, 
  Pill, 
  TrendingDown,
  Share2,
  FileText
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

  // Monthly chronic savings estimate (assuming 1 pack per month)
  const totalSavingsPerPack = savedSwaps.reduce((acc, item) => {
    const savings = Math.max(0, item.original.price - item.alternative.price);
    return acc + savings;
  }, 0);

  const handlePrint = () => {
    window.print();
  };

  const handleShareList = () => {
    if (navigator.share) {
      const summary = savedSwaps.map(s => 
        `• ${s.original.name} (₹${s.original.price}) ➔ ${s.alternative.name} (₹${s.alternative.price}) [Salt: ${s.original.display_composition}]`
      ).join('\n');
      navigator.share({
        title: 'MediCompare - My Saved Generic Swaps',
        text: `My medicine generic alternatives:\n${summary}\nEstimated savings: ₹${totalSavingsPerPack.toFixed(2)}/pack.`
      }).catch(() => {});
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
      />

      {/* Drawer Container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
          
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-teal-700 text-white flex items-center justify-center shadow-sm">
                <BookmarkCheck className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-bold text-sm sm:text-base text-slate-900">Saved Generic Substitutions</h2>
                <p className="text-[11px] text-slate-500">{savedSwaps.length} medicines bookmarked</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
              aria-label="Close saved swaps drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 custom-scrollbar">
            {savedSwaps.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
                  <BookmarkCheck className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-700 text-sm">No Saved Medicines</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Search any medicine and click the bookmark icon on any alternative to save it to your prescription list.
                </p>
              </div>
            ) : (
              <>
                {/* Savings Summary Banner */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-semibold uppercase text-emerald-800">
                      Calculated Savings
                    </div>
                    <div className="text-lg font-bold text-emerald-950">
                      ₹{totalSavingsPerPack.toFixed(2)} <span className="text-xs font-normal text-emerald-800">/ pack cycle</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-emerald-700 font-medium block">Annual (Chronic)</span>
                    <span className="text-xs font-bold text-emerald-900">₹{(totalSavingsPerPack * 12).toFixed(2)}/yr</span>
                  </div>
                </div>

                {/* Swaps List */}
                <div className="space-y-3">
                  {savedSwaps.map((item) => {
                    const savings = Math.max(0, item.original.price - item.alternative.price);
                    const pct = item.original.price > 0 ? Math.round((savings / item.original.price) * 100) : 0;

                    return (
                      <div
                        key={item.id}
                        className="border border-slate-200 rounded-xl p-3.5 bg-white space-y-2 hover:border-slate-300 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-semibold text-slate-400 uppercase">Prescribed Brand</span>
                            <div className="font-bold text-sm text-slate-800 line-through decoration-slate-400">
                              {item.original.name}
                            </div>
                            <div className="text-xs text-slate-500 font-medium">
                              ₹{item.original.price.toFixed(2)} ({item.original.pack_size_label})
                            </div>
                          </div>

                          <button
                            onClick={() => onRemoveSwap(item.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100 transition-colors"
                            aria-label="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Salt indicator */}
                        <div className="text-[11px] font-medium text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 flex items-center gap-1">
                          <Pill className="w-3 h-3 text-teal-700" />
                          <span className="truncate">{item.original.display_composition}</span>
                        </div>

                        {/* Alternative */}
                        <div className="bg-teal-50/50 rounded-lg p-2 border border-teal-100 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-bold text-teal-800 uppercase">Generic Swap</span>
                            <div className="font-bold text-xs text-slate-900">
                              {item.alternative.name}
                            </div>
                            <div className="text-[11px] text-slate-600">
                              ₹{item.alternative.price.toFixed(2)} • {item.alternative.manufacturer_name}
                            </div>
                          </div>

                          {pct > 0 && (
                            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                              Save {pct}%
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => {
                            onSelectSavedMedicine(item.original.id);
                            onClose();
                          }}
                          className="w-full pt-1 text-[11px] font-semibold text-teal-800 hover:text-teal-900 flex items-center justify-center gap-1"
                        >
                          <span>View Full Comparison</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
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
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handlePrint}
                  className="py-2 px-3 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Slip</span>
                </button>

                <button
                  onClick={handleShareList}
                  className="py-2 px-3 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share</span>
                </button>
              </div>

              <button
                onClick={onClearAll}
                className="w-full py-1.5 text-center text-[11px] font-medium text-slate-400 hover:text-rose-600 transition-colors"
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
