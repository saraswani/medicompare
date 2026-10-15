import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  MapPin, 
  Navigation, 
  Search, 
  Phone, 
  Clock, 
  ShieldCheck, 
  Building2, 
  Pill, 
  AlertCircle, 
  Loader2, 
  RefreshCw, 
  Maximize2, 
  CheckCircle2,
  Compass,
  Layers,
  Map as MapIcon,
  ExternalLink
} from 'lucide-react';
import { 
  fetchNearbyPharmacies, 
  geocodeLocation 
} from '../services/osmStoreService.js';

// Default initial coordinates (New Delhi) used for initial map display before user GPS or manual search
const DEFAULT_COORDS = { lat: 28.6139, lng: 77.2090, label: 'Connaught Place, New Delhi' };

const RADIUS_OPTIONS = [
  { value: 2000, label: '2 km' },
  { value: 5000, label: '5 km (Standard)' },
  { value: 10000, label: '10 km' },
  { value: 15000, label: '15 km' }
];

export default function StoreLocator({ forwardRef, activeMedicineName, cheapestGenericName }) {
  // State: Coordinates & origin
  const [centerCoords, setCenterCoords] = useState(DEFAULT_COORDS);
  const [locationSource, setLocationSource] = useState('initial'); // 'initial' | 'gps' | 'manual'
  const [locationLabel, setLocationLabel] = useState(DEFAULT_COORDS.label);
  
  // State: Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [searchRadius, setSearchRadius] = useState(5000);
  const [activeCategory, setActiveCategory] = useState('all'); // 'all' | 'jan_aushadhi' | 'generic' | 'branded'
  
  // State: Pharmacies & Loading
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPharmacyId, setSelectedPharmacyId] = useState(null);
  
  // State: Geolocation
  const [geoStatus, setGeoStatus] = useState('idle'); // 'idle' | 'locating' | 'granted' | 'denied'
  const [showLocationConsentModal, setShowLocationConsentModal] = useState(false);

  // Refs
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const userMarkerRef = useRef(null);
  const abortControllerRef = useRef(null);

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [DEFAULT_COORDS.lat, DEFAULT_COORDS.lng],
      zoom: 13,
      zoomControl: true,
      attributionControl: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;
    mapInstanceRef.current = map;

    // Load initial pharmacies
    loadPharmacies(DEFAULT_COORDS.lat, DEFAULT_COORDS.lng, 5000);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Load pharmacies
  const loadPharmacies = async (lat, lng, radius) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const results = await fetchNearbyPharmacies(lat, lng, radius, abortControllerRef.current.signal);
      setPharmacies(results);
      if (results.length > 0) {
        setSelectedPharmacyId(results[0].id);
      } else {
        setSelectedPharmacyId(null);
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.warn('Overpass notice:', err.message);
      // Even if network failed, fetchNearbyPharmacies automatically returns directory pharmacies
    } finally {
      setLoading(false);
    }
  };

  // 3. Filter pharmacies based on active tab
  const filteredPharmacies = useMemo(() => {
    if (activeCategory === 'all') return pharmacies;
    return pharmacies.filter(p => p.category_id === activeCategory);
  }, [pharmacies, activeCategory]);

  const counts = useMemo(() => {
    return {
      all: pharmacies.length,
      jan_aushadhi: pharmacies.filter(p => p.category_id === 'jan_aushadhi').length,
      generic: pharmacies.filter(p => p.category_id === 'generic').length,
      branded: pharmacies.filter(p => p.category_id === 'branded').length
    };
  }, [pharmacies]);

  // 4. Update Map Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    // User / Search Origin Pin
    if (locationSource === 'gps' || locationSource === 'manual') {
      const userIcon = L.divIcon({
        className: 'user-location-pin',
        html: `
          <div class="relative flex items-center justify-center">
            <span class="absolute w-8 h-8 bg-blue-500/30 rounded-full animate-ping"></span>
            <span class="w-4 h-4 bg-blue-600 border-2 border-white rounded-full shadow-lg"></span>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      userMarkerRef.current = L.marker([centerCoords.lat, centerCoords.lng], { icon: userIcon })
        .bindPopup(`<strong>Search Origin</strong><br/>${locationLabel}`)
        .addTo(markersGroup);
    }

    const bounds = L.latLngBounds([]);
    if (locationSource !== 'initial') {
      bounds.extend([centerCoords.lat, centerCoords.lng]);
    }

    filteredPharmacies.forEach((pharmacy) => {
      const isSelected = pharmacy.id === selectedPharmacyId;

      let pinBg = 'bg-indigo-600';
      if (pharmacy.category_id === 'jan_aushadhi') {
        pinBg = 'bg-emerald-600';
      } else if (pharmacy.category_id === 'generic') {
        pinBg = 'bg-sky-600';
      }

      const markerHtml = `
        <div class="cursor-pointer transition-transform duration-200 ${isSelected ? 'scale-125 z-50' : 'hover:scale-110'}">
          <div class="flex items-center justify-center w-7 h-7 rounded-full shadow-md text-white ${pinBg} border-2 ${isSelected ? 'border-amber-400 ring-4 ring-amber-300/50' : 'border-white'}">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"></path>
              <path d="m8.5 8.5 7 7"></path>
            </svg>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'pharmacy-map-marker',
        html: markerHtml,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -16]
      });

      const marker = L.marker([pharmacy.lat, pharmacy.lng], { icon: customIcon })
        .addTo(markersGroup);

      const popupContent = `
        <div class="p-1 min-w-[200px] max-w-[260px] font-sans">
          <span class="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${pharmacy.badge_color} mb-1">
            ${pharmacy.badge_text}
          </span>
          <h4 class="font-bold text-xs text-slate-900 leading-snug">${escapeHtml(pharmacy.name)}</h4>
          <p class="text-[11px] text-slate-500 mt-1 leading-tight">${escapeHtml(pharmacy.address)}</p>
          <div class="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span class="font-bold text-blue-700">${pharmacy.distance_km !== null ? pharmacy.distance_km + ' km' : ''}</span>
            <a href="${pharmacy.directions_url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 font-bold hover:underline flex items-center gap-1">
              Directions &rarr;
            </a>
          </div>
        </div>
      `;
      marker.bindPopup(popupContent);

      marker.on('click', () => {
        setSelectedPharmacyId(pharmacy.id);
        const cardEl = document.getElementById(`pharmacy-card-${pharmacy.id}`);
        if (cardEl) cardEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });

      bounds.extend([pharmacy.lat, pharmacy.lng]);
    });

    if (filteredPharmacies.length > 0 && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    } else {
      map.setView([centerCoords.lat, centerCoords.lng], 13);
    }
  }, [filteredPharmacies, selectedPharmacyId, centerCoords, locationSource]);

  // 5. Select Card -> Pan Map
  const handleSelectPharmacy = (pharmacy) => {
    setSelectedPharmacyId(pharmacy.id);
    const map = mapInstanceRef.current;
    if (map) {
      map.flyTo([pharmacy.lat, pharmacy.lng], 15, { duration: 0.8 });
    }
  };

  // 6. Manual Location Search
  const handleManualSearch = async (e) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    setIsSearchingLocation(true);
    setError(null);

    try {
      const geoResult = await geocodeLocation(query);
      if (!geoResult) {
        setError(`No location found for "${query}". Try searching by city (e.g. "Nashik", "Pune", "Mumbai", "Delhi") or PIN code.`);
        return;
      }

      const newCoords = {
        lat: geoResult.lat,
        lng: geoResult.lng,
        label: geoResult.display_name.split(',').slice(0, 3).join(',')
      };

      setCenterCoords(newCoords);
      setLocationSource('manual');
      setLocationLabel(newCoords.label);
      setGeoStatus('idle');

      await loadPharmacies(newCoords.lat, newCoords.lng, searchRadius);
    } catch (err) {
      console.error('Geocoding error:', err);
      setError('Search service unavailable. Please check your network and try again.');
    } finally {
      setIsSearchingLocation(false);
    }
  };

  // 7. Geolocation flow
  const handleRequestLocationConsent = () => {
    setShowLocationConsentModal(true);
  };

  const handleExecuteGeolocation = () => {
    setShowLocationConsentModal(false);

    if (!navigator.geolocation) {
      setGeoStatus('denied');
      setError('Geolocation is not supported by your browser. Please search manually by city or PIN code.');
      return;
    }

    setGeoStatus('locating');
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setGeoStatus('granted');
        setLocationSource('gps');
        const label = `My Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
        setLocationLabel(label);

        const newCoords = { lat: latitude, lng: longitude, label };
        setCenterCoords(newCoords);

        await loadPharmacies(latitude, longitude, searchRadius);
      },
      (err) => {
        console.warn('Geolocation denied or unavailable:', err);
        setGeoStatus('denied');
        setError('Location access was denied. Enter your city or area in the search bar above to view nearby medical stores.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleRadiusChange = (newRadius) => {
    setSearchRadius(newRadius);
    loadPharmacies(centerCoords.lat, centerCoords.lng, newRadius);
  };

  const handleRetry = () => {
    loadPharmacies(centerCoords.lat, centerCoords.lng, searchRadius);
  };

  return (
    <section 
      ref={forwardRef} 
      className="w-full max-w-6xl mx-auto bg-white rounded-3xl border border-blue-100 p-4 sm:p-6 shadow-[0_4px_25px_rgba(37,99,235,0.06)] scroll-mt-20 space-y-4"
    >
      
      {/* Header & Subtitle */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[11px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-blue-600" />
              Nearby Pharmacy Network
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Find Nearby Medical Stores & Pharmacies
          </h2>

          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 max-w-xl">
            Locate all nearby chemist shops and government Jan Aushadhi Kendras around your location.
          </p>
        </div>

        {/* Action Controls: GPS & Radius */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleRequestLocationConsent}
            disabled={geoStatus === 'locating' || loading}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm min-h-[40px] ${
              geoStatus === 'granted'
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25'
            } disabled:opacity-50`}
            title="Locate medical stores around your GPS coordinates"
          >
            {geoStatus === 'locating' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Navigation className="w-4 h-4" />
            )}
            <span>
              {geoStatus === 'locating' 
                ? 'Getting Location...' 
                : geoStatus === 'granted' 
                ? 'GPS Active' 
                : 'Use My Location'}
            </span>
          </button>

          <select
            value={searchRadius}
            onChange={(e) => handleRadiusChange(Number(e.target.value))}
            disabled={loading}
            className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors min-h-[40px]"
            aria-label="Select search radius"
          >
            {RADIUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>Radius: {opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Manual Search Bar */}
      <form onSubmit={handleManualSearch} className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by city, area, neighborhood, or PIN code (e.g. Nashik, Connaught Place, 422004)..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all min-h-[40px]"
          />
        </div>

        <button
          type="submit"
          disabled={isSearchingLocation || loading || !searchQuery.trim()}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-40 min-h-[40px] flex items-center justify-center gap-1.5 flex-shrink-0"
        >
          {isSearchingLocation ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
          <span>Search</span>
        </button>
      </form>

      {/* Origin Info Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 bg-slate-50/80 border border-slate-200/80 px-3.5 py-2 rounded-xl">
        <div className="flex items-center gap-1.5 truncate">
          <MapPin className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
          <span className="font-semibold text-slate-700">Origin:</span>
          <span className="text-slate-800 truncate font-medium">{locationLabel}</span>
          <span className="text-[11px] text-slate-400">({searchRadius / 1000} km radius)</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-bold text-slate-800">{filteredPharmacies.length} medical stores found</span>
          <button 
            onClick={handleRetry} 
            disabled={loading}
            className="text-blue-600 hover:text-blue-800 font-bold hover:underline flex items-center gap-1 text-[11px]"
            title="Refresh stores"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Geolocation Denied / Error Banner */}
      {geoStatus === 'denied' && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2.5 text-xs text-amber-900">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>Location access denied. Type your city, neighborhood, or PIN code in the search bar above to see stores.</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-2 text-xs text-rose-900">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={handleRetry}
            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs"
          >
            Retry
          </button>
        </div>
      )}

      {/* Category Filter Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto custom-scrollbar gap-1">
        <button
          onClick={() => setActiveCategory('all')}
          className={`pb-2.5 px-3.5 font-bold text-xs sm:text-sm flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${
            activeCategory === 'all'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>All Medicals Nearby</span>
          <span className="px-1.5 py-0.5 text-[10px] font-black bg-blue-100 text-blue-800 rounded-full">
            {counts.all}
          </span>
        </button>

        <button
          onClick={() => setActiveCategory('jan_aushadhi')}
          className={`pb-2.5 px-3.5 font-bold text-xs sm:text-sm flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${
            activeCategory === 'jan_aushadhi'
              ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Jan Aushadhi (PMBJP)</span>
          <span className="px-1.5 py-0.5 text-[10px] font-black bg-emerald-100 text-emerald-800 rounded-full">
            {counts.jan_aushadhi}
          </span>
        </button>

        <button
          onClick={() => setActiveCategory('generic')}
          className={`pb-2.5 px-3.5 font-bold text-xs sm:text-sm flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${
            activeCategory === 'generic'
              ? 'border-sky-600 text-sky-800 bg-sky-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Pill className="w-4 h-4 text-sky-600" />
          <span>Generic Stores</span>
          <span className="px-1.5 py-0.5 text-[10px] font-bold bg-sky-100 text-sky-800 rounded-full">
            {counts.generic}
          </span>
        </button>

        <button
          onClick={() => setActiveCategory('branded')}
          className={`pb-2.5 px-3.5 font-bold text-xs sm:text-sm flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${
            activeCategory === 'branded'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4 text-indigo-600" />
          <span>Retail Chemists</span>
          <span className="px-1.5 py-0.5 text-[10px] font-bold bg-indigo-100 text-indigo-800 rounded-full">
            {counts.branded}
          </span>
        </button>
      </div>

      {/* Main Grid: Interactive Leaflet Map & Result Cards List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start pt-1">
        
        {/* Leaflet Map Column */}
        <div className="lg:col-span-7 space-y-1.5">
          <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100">
            <div 
              ref={mapContainerRef} 
              className="w-full h-[280px] sm:h-[380px] lg:h-[460px]"
              style={{ background: '#e2e8f0' }}
            />

            {loading && (
              <div className="absolute inset-0 bg-white/75 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center text-slate-700">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-1.5" />
                <p className="text-xs font-bold text-slate-800">Locating nearby medical stores...</p>
              </div>
            )}

            {/* Map Legend */}
            <div className="absolute bottom-2 left-2 right-2 z-20 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-600">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span>
                  <span>Jan Aushadhi</span>
                </span>
                <span className="flex items-center gap-1 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block"></span>
                  <span>Generic</span>
                </span>
                <span className="flex items-center gap-1 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block"></span>
                  <span>Retail Chemist</span>
                </span>
              </div>

              <div>
                Map data &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">OpenStreetMap</a>
              </div>
            </div>
          </div>
        </div>

        {/* Pharmacy Results Cards Column */}
        <div className="lg:col-span-5 flex flex-col h-full space-y-2">
          
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
            <span>Nearby Results ({filteredPharmacies.length})</span>
            <span className="text-[11px] text-slate-400 font-normal">Sorted by nearest</span>
          </div>

          <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1 custom-scrollbar">
            {loading && filteredPharmacies.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="w-7 h-7 text-blue-600 animate-spin mb-2" />
                <p className="text-xs font-semibold text-slate-600">Finding nearest medical stores...</p>
              </div>
            ) : filteredPharmacies.length === 0 ? (
              <div className="py-10 px-4 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl space-y-2.5">
                <MapPin className="w-7 h-7 text-slate-400 mx-auto" />
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-800">No stores in this category</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Switch to "All Medicals Nearby" or search for another city.
                  </p>
                </div>
              </div>
            ) : (
              filteredPharmacies.map((pharmacy) => {
                const isSelected = pharmacy.id === selectedPharmacyId;

                return (
                  <div
                    key={pharmacy.id}
                    id={`pharmacy-card-${pharmacy.id}`}
                    onClick={() => handleSelectPharmacy(pharmacy)}
                    className={`rounded-2xl border p-3.5 transition-all cursor-pointer text-left ${
                      isSelected 
                        ? 'bg-blue-50/60 border-blue-500 shadow-md ring-2 ring-blue-400/20' 
                        : 'bg-white hover:bg-slate-50/80 border-slate-200 shadow-sm'
                    }`}
                  >
                    {/* Header: Badge & Proximity */}
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${pharmacy.badge_color}`}>
                        {pharmacy.badge_text}
                      </span>

                      {pharmacy.distance_km !== null && (
                        <span className="text-[11px] font-black text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full flex-shrink-0">
                          {pharmacy.distance_km} km
                        </span>
                      )}
                    </div>

                    {/* Pharmacy Name */}
                    <h3 className="font-bold text-sm text-slate-900 leading-snug">
                      {pharmacy.name}
                    </h3>

                    {/* Address */}
                    <p className="text-xs text-slate-600 flex items-start gap-1.5 mt-1 font-medium leading-tight">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                      <span>{pharmacy.address}</span>
                    </p>

                    {/* Timings & Phone */}
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                      {pharmacy.opening_hours && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{pharmacy.opening_hours}</span>
                        </div>
                      )}

                      {pharmacy.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <a 
                            href={`tel:${pharmacy.phone}`} 
                            onClick={(e) => e.stopPropagation()} 
                            className="text-blue-600 hover:underline font-semibold"
                          >
                            {pharmacy.phone}
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-2">
                      <a
                        href={pharmacy.directions_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        <span>Directions</span>
                      </a>

                      {pharmacy.phone && (
                        <a
                          href={`tel:${pharmacy.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                        >
                          <Phone className="w-3 h-3" />
                          <span>Call</span>
                        </a>
                      )}
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Geolocation Privacy Consent Modal */}
      {showLocationConsentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm">
              <Navigation className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900">
                Use Your Current Location
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                MediCompare uses browser geolocation to find the nearest Jan Aushadhi Kendras and retail chemist stores around you.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-[11px] text-slate-600 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Privacy Safeguard</span>
              </div>
              <p>Your coordinates are processed only inside your browser to locate stores. No location data is stored on any server.</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowLocationConsentModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleExecuteGeolocation}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/25 transition-all flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Allow & Locate Stores</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
