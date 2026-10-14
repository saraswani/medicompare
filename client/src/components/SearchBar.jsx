import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2, Pill, Command, Camera, ChevronRight, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import PrescriptionScanner from './PrescriptionScanner';

const QUICK_SEARCH_CHIPS = [
  { label: 'Dolo 650', query: 'Dolo 650', condition: 'Fever', color: 'hover:border-orange-300 hover:bg-orange-50/60' },
  { label: 'Augmentin 625', query: 'Augmentin 625', condition: 'Infection', color: 'hover:border-purple-300 hover:bg-purple-50/60' },
  { label: 'Glycomet 500', query: 'Glycomet 500', condition: 'Diabetes', color: 'hover:border-sky-300 hover:bg-sky-50/60' },
  { label: 'Telma 40', query: 'Telma 40', condition: 'BP', color: 'hover:border-rose-300 hover:bg-rose-50/60' },
  { label: 'Pan D', query: 'Pan D', condition: 'Acidity', color: 'hover:border-emerald-300 hover:bg-emerald-50/60' },
  { label: 'Allegra 120', query: 'Allegra 120', condition: 'Allergy', color: 'hover:border-blue-300 hover:bg-blue-50/60' },
  { label: 'Azithral 500', query: 'Azithral 500', condition: 'Antibiotic', color: 'hover:border-indigo-300 hover:bg-indigo-50/60' }
];

export default function SearchBar({ onSelectMedicine, initialQuery = '' }) {
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Keyboard shortcut ('/' or 'Ctrl+K' / 'Cmd+K' to focus search)
  useEffect(() => {
    function handleGlobalKeyDown(e) {
      if ((e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key === 'k')) && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  useEffect(() => {
    if (initialQuery) {
      setSearchTerm(initialQuery);
    }
  }, [initialQuery]);

  // Debounced search query
  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await api.searchMedicines(searchTerm.trim(), 8);
        setResults(data.results || []);
        setIsOpen(true);
        setSelectedIndex(-1);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 140);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (medicine) => {
    setSearchTerm(medicine.name);
    setIsOpen(false);
    onSelectMedicine(medicine.id);
  };

  const handleKeyDown = (e) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        handleSelect(results[selectedIndex]);
      } else if (results.length > 0) {
        handleSelect(results[0]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    setSearchTerm('');
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div className="w-full max-w-2xl mx-auto relative" ref={dropdownRef}>
      {/* Search Input Box */}
      <div 
        role="combobox"
        aria-expanded={isOpen && results.length > 0}
        aria-haspopup="listbox"
        aria-controls="medicine-search-results"
        className="relative bg-white rounded-2xl border-2 border-blue-200/90 transition-all duration-200 shadow-[0_4px_20px_rgba(37,99,235,0.08)] focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-500/15"
      >
        <div className="flex items-center px-4 py-3 sm:py-3.5">
          <Search className="w-5 h-5 text-blue-500 flex-shrink-0 mr-3" aria-hidden="true" />
          
          <input
            ref={inputRef}
            type="text"
            role="searchbox"
            aria-autocomplete="list"
            aria-activedescendant={selectedIndex >= 0 && results[selectedIndex] ? `med-option-${results[selectedIndex].id}` : undefined}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => { if (results.length > 0) setIsOpen(true); }}
            onKeyDown={handleKeyDown}
            placeholder="Type prescribed medicine name (e.g., Dolo, Augmentin)..."
            className="w-full bg-transparent text-slate-900 placeholder-slate-400 font-medium text-sm sm:text-base focus:outline-none"
            autoComplete="off"
            spellCheck="false"
          />

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {isLoading ? (
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            ) : searchTerm ? (
              <button
                type="button"
                onClick={handleClear}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-100 border border-slate-200 rounded-md">
                <Command className="w-2.5 h-2.5" /> K
              </kbd>
            )}

            {/* Prescription Camera Scan Button */}
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all text-xs font-bold shadow-sm shadow-blue-500/25 hover:shadow-md"
              aria-label="Scan prescription photo"
              title="Upload prescription photo for instant matching"
            >
              <Camera className="w-4 h-4" />
              <span className="hidden xs:inline">Scan Rx</span>
            </button>
          </div>
        </div>
      </div>

      {/* Autocomplete Suggestions Dropdown */}
      {isOpen && results.length > 0 && (
        <ul
          id="medicine-search-results"
          role="listbox"
          aria-label="Medicine search suggestions"
          className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-blue-100 overflow-hidden z-50 divide-y divide-slate-100 max-h-[440px] overflow-y-auto custom-scrollbar animate-fade-in"
        >
          <li className="px-4 py-2.5 bg-blue-50/70 text-[11px] font-bold uppercase tracking-wider text-blue-800 flex justify-between items-center" role="presentation">
            <span>Matches Found ({results.length})</span>
            <span className="hidden sm:inline text-blue-600">Press Enter to view</span>
          </li>

          {results.map((item, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <li
                key={item.id}
                id={`med-option-${item.id}`}
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`w-full text-left px-4 py-3.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                  isSelected ? 'bg-blue-50/80' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    item.badge_type === 'PMBJP Generic' 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : item.generic_flag 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-slate-100 text-slate-700'
                  }`}>
                    <Pill className="w-4 h-4" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-slate-900 truncate">
                        {item.name}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.badge_type === 'PMBJP Generic'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : item.generic_flag
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {item.badge_type}
                      </span>
                      {item.country && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          {item.country === 'IN' ? '🇮🇳 IN' : item.country === 'US' ? '🇺🇸 US' : item.country}
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-blue-900 bg-blue-50 px-2 py-0.5 rounded text-[11px]">
                        {item.display_composition}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-500 truncate text-[11px]">{item.manufacturer_name}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right flex-shrink-0 flex items-center gap-2">
                  <div>
                    {(item.has_verified_price !== false && item.price > 0) ? (
                      <>
                        <div className="text-sm font-black text-slate-900">
                          ₹{item.price.toFixed(2)}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          ₹{item.unit_price.toFixed(2)} / unit
                        </div>
                      </>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                        {item.source === 'RxNorm (NLM)' ? 'RxNorm Concept' : 'Registry Entry'}
                      </span>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-blue-400 hidden sm:block" />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Quick Search Chips with Pop Effect */}
      <div className="mt-3.5 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs custom-scrollbar">
        <span className="text-slate-400 font-semibold whitespace-nowrap text-[11px]">
          Popular:
        </span>
        {QUICK_SEARCH_CHIPS.map((chip) => (
          <button
            key={chip.label}
            type="button"
            onClick={() => {
              setSearchTerm(chip.query);
              inputRef.current?.focus();
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 ${chip.color} text-slate-700 text-xs font-semibold whitespace-nowrap transition-all duration-150 hover:-translate-y-0.5 shadow-sm`}
          >
            <span>{chip.label}</span>
            <span className="text-[10px] text-slate-400 font-medium">({chip.condition})</span>
          </button>
        ))}
      </div>

      {/* Prescription Camera Modal */}
      <PrescriptionScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onSelectMedicine={onSelectMedicine}
      />
    </div>
  );
}
