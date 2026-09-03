import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2, Pill, Tag, Command, Camera } from 'lucide-react';
import { api } from '../services/api';
import PrescriptionScanner from './PrescriptionScanner';

const QUICK_SEARCH_CHIPS = [
  { label: 'Dolo 650', query: 'Dolo 650', category: 'Fever' },
  { label: 'Augmentin 625', query: 'Augmentin 625', category: 'Antibiotic' },
  { label: 'Glycomet 500', query: 'Glycomet 500', category: 'Diabetes' },
  { label: 'Pan D', query: 'Pan D', category: 'Acidity' },
  { label: 'Telma 40', query: 'Telma 40', category: 'BP' },
  { label: 'Allegra 120', query: 'Allegra 120', category: 'Allergy' },
  { label: 'Montair LC', query: 'Montair LC', category: 'Asthma' },
  { label: 'Azithral 500', query: 'Azithral 500', category: 'Antibiotic' }
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

  // Global keyboard shortcut ('/' or 'Ctrl+K' / 'Cmd+K' to focus search)
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

  // Sync initial query if passed
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
    }, 150);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Click outside listener
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
    <div className="w-full max-w-3xl mx-auto relative" ref={dropdownRef}>
      {/* Accessible Search Input Box */}
      <div 
        role="combobox"
        aria-expanded={isOpen && results.length > 0}
        aria-haspopup="listbox"
        aria-controls="medicine-search-results"
        className="relative shadow-lg rounded-2xl bg-white transition-all duration-200 border-2 border-slate-200 focus-within:border-teal-500 focus-within:ring-4 focus-within:ring-teal-500/15"
      >
        <div className="flex items-center px-4 py-3 sm:py-3.5">
          <Search className="w-5 h-5 sm:w-6 sm:h-6 text-teal-600 flex-shrink-0 mr-3" aria-hidden="true" />
          
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
            placeholder="Enter medicine name (e.g., Dolo 650, Augmentin, Glycomet)..."
            className="w-full bg-transparent text-slate-800 placeholder-slate-400 font-medium text-sm sm:text-base focus:outline-none"
            autoComplete="off"
          />

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {isLoading ? (
              <Loader2 className="w-5 h-5 text-teal-600 animate-spin" />
            ) : searchTerm ? (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                aria-label="Clear search text"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-100 border border-slate-200 rounded">
                <Command className="w-3 h-3" /> K
              </kbd>
            )}

            {/* Prescription Camera/Scan Button */}
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="p-2 rounded-xl text-teal-600 hover:text-teal-700 hover:bg-teal-50 border border-transparent hover:border-teal-200 transition-all group relative"
              aria-label="Scan prescription photo"
              title="Scan prescription photo"
            >
              <Camera className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
            </button>
          </div>
        </div>
      </div>

      {/* Accessible Instant Dropdown Suggestions */}
      {isOpen && results.length > 0 && (
        <ul
          id="medicine-search-results"
          role="listbox"
          aria-label="Medicine search suggestions"
          className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-elevated border border-slate-200/80 overflow-hidden z-50 divide-y divide-slate-100 max-h-[420px] overflow-y-auto custom-scrollbar"
        >
          <li className="px-3 py-2 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex justify-between items-center" role="presentation">
            <span>Matches ({results.length})</span>
            <span>Use ↑↓ to navigate, Enter to select</span>
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
                className={`w-full text-left px-4 py-3 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                  isSelected ? 'bg-teal-50/80' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`p-2 rounded-lg flex-shrink-0 ${
                    item.generic_flag ? 'bg-indigo-50 text-indigo-600' : 'bg-teal-50 text-teal-600'
                  }`}>
                    <Pill className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900 truncate">{item.name}</span>
                      {item.generic_flag && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700">
                          Generic
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {item.display_composition}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {item.manufacturer_name} • {item.pack_size_label}
                    </p>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="font-bold text-sm text-slate-900">₹{item.price.toFixed(2)}</div>
                  <div className="text-[11px] text-slate-500">₹{item.unit_price.toFixed(2)}/unit</div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* No results fallback */}
      {isOpen && !isLoading && searchTerm.trim() && results.length === 0 && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-elevated border border-slate-200 p-6 text-center z-50">
          <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-2">
            <Search className="w-5 h-5" />
          </div>
          <p className="font-medium text-slate-800 text-sm">No exact medicine match found</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try searching by the chemical salt name (e.g. Paracetamol, Amoxycillin, Metformin) or click one of the popular medicines below.
          </p>
        </div>
      )}

      {/* Quick Search Chips */}
      <div className="mt-3 flex items-center gap-1.5 flex-wrap" aria-label="Popular medicine quick filters">
        <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
          <Tag className="w-3.5 h-3.5" /> Popular:
        </span>
        {QUICK_SEARCH_CHIPS.map(chip => (
          <button
            key={chip.label}
            type="button"
            onClick={() => setSearchTerm(chip.query)}
            className="text-xs px-2.5 py-1 rounded-full bg-slate-100 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300 border border-slate-200 text-slate-700 font-medium transition-colors focus:ring-1 focus:ring-teal-500"
          >
            {chip.label}
          </button>
        ))}

        {/* Scan Prescription Chip */}
        <button
          type="button"
          onClick={() => setIsScannerOpen(true)}
          className="text-xs px-2.5 py-1 rounded-full bg-gradient-to-r from-teal-50 to-emerald-50 hover:from-teal-100 hover:to-emerald-100 text-teal-700 border border-teal-200 font-semibold transition-colors focus:ring-1 focus:ring-teal-500 flex items-center gap-1"
        >
          <Camera className="w-3 h-3" /> Scan Rx
        </button>
      </div>

      {/* Prescription Scanner Modal */}
      <PrescriptionScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onSelectMedicine={onSelectMedicine}
      />
    </div>
  );
}
