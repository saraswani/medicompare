import React from 'react';
import { Pill, BookmarkCheck, Info, Sparkles } from 'lucide-react';

export default function Navbar({ onOpenSavedSwaps, savedSwapsCount, totalSavedAmount, onOpenInfo, onResetToHome }) {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo & Title */}
        <button 
          onClick={onResetToHome}
          className="flex items-center gap-3 text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 rounded-lg p-1"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform">
            <Pill className="w-5 h-5 rotate-45" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-slate-900 tracking-tight">MediCompare</span>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 bg-teal-50 text-teal-700 border border-teal-200 rounded-full">
                India Generic Finder
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">Same salt. Honest prices.</p>
          </div>
        </button>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* How It Works Button */}
          <button
            onClick={onOpenInfo}
            className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded-lg transition-colors"
            title="Learn about Generic Medicines & Jan Aushadhi"
          >
            <Info className="w-4 h-4 text-slate-400" />
            <span className="hidden sm:inline">How It Works</span>
          </button>

          {/* Saved Swaps Button */}
          <button
            onClick={onOpenSavedSwaps}
            className="relative flex items-center gap-2 px-3.5 py-2 rounded-lg bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800 text-xs sm:text-sm font-semibold transition-all shadow-sm group"
          >
            <BookmarkCheck className="w-4 h-4 text-teal-600 group-hover:scale-110 transition-transform" />
            <span>Saved Swaps</span>
            
            {savedSwapsCount > 0 ? (
              <div className="flex items-center gap-1">
                <span className="px-1.5 py-0.5 text-[11px] font-bold bg-teal-600 text-white rounded-full leading-none">
                  {savedSwapsCount}
                </span>
                {totalSavedAmount > 0 && (
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded-full hidden md:inline">
                    Save ₹{totalSavedAmount}
                  </span>
                )}
              </div>
            ) : null}
          </button>
        </div>

      </div>
    </header>
  );
}
