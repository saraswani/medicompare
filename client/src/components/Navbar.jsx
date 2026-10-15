import React from 'react';
import { Pill, BookmarkCheck, HelpCircle, Activity, Heart, ShieldCheck, AlertTriangle, MapPin } from 'lucide-react';

export default function Navbar({ 
  onOpenSavedSwaps, 
  savedSwapsCount, 
  totalSavedAmount, 
  onOpenInfo, 
  onResetToHome,
  onOpenReportError,
  onLocateStore
}) {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-blue-100/80 shadow-[0_2px_15px_-3px_rgba(37,99,235,0.06)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo & Title with Colorful Medical Emblem */}
        <button 
          onClick={onResetToHome}
          className="flex items-center gap-3 text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-2xl p-1 -ml-1 transition-all"
        >
          {/* Colorful Emblem */}
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center text-white shadow-md shadow-blue-500/25 group-hover:scale-105 transition-transform duration-200">
            <div className="relative">
              <Pill className="w-5 h-5 -rotate-45" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full border border-white" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg text-slate-900 tracking-tight flex items-center">
                Medi<span className="text-blue-600">Compare</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200/60 rounded-full uppercase tracking-wider">
                India Rx
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block font-medium">Generic Medicine & Price Comparison</p>
          </div>
        </button>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Locate Store Button */}
          {onLocateStore && (
            <button
              onClick={onLocateStore}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50/70 rounded-xl transition-colors min-h-[40px]"
              title="Locate Nearby Jan Aushadhi Kendras & Pharmacies"
            >
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">Locate Store</span>
            </button>
          )}

          {/* Clinical Guide Button */}
          <button
            onClick={onOpenInfo}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 hover:text-blue-600 hover:bg-blue-50/70 rounded-xl transition-colors min-h-[40px]"
            title="How Generic Medicine Swaps Work"
          >
            <HelpCircle className="w-4 h-4 text-blue-500" />
            <span className="hidden sm:inline">Clinical Guide</span>
          </button>

          {/* Report Data Issue Button */}
          {onOpenReportError && (
            <button
              onClick={onOpenReportError}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 hover:text-amber-700 hover:bg-amber-50/70 rounded-xl transition-colors min-h-[40px]"
              title="Report inaccurate price or medicine data"
            >
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span className="hidden lg:inline">Report Error</span>
            </button>
          )}

          {/* Saved Swaps Button */}
          <button
            onClick={onOpenSavedSwaps}
            className="relative flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100/80 border border-blue-200/80 text-blue-700 text-xs font-bold transition-all shadow-sm hover:shadow group min-h-[40px]"
            aria-label={`Saved swaps (${savedSwapsCount} items)`}
          >
            <BookmarkCheck className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
            <span className="hidden xs:inline">Saved Swaps</span>
            
            {savedSwapsCount > 0 ? (
              <span className="px-2 py-0.5 text-[11px] font-black bg-blue-600 text-white rounded-full leading-none shadow-sm">
                {savedSwapsCount}
              </span>
            ) : null}

            {totalSavedAmount > 0 && (
              <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full hidden md:inline">
                Save ₹{totalSavedAmount}
              </span>
            )}
          </button>
        </div>

      </div>
    </header>
  );
}
