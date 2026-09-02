import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Navigation, 
  Phone, 
  Clock, 
  ExternalLink, 
  ShieldCheck, 
  Sparkles, 
  Loader2, 
  Building, 
  Building2,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';

const CITIES = [
  'All Locations',
  'Delhi',
  'Mumbai',
  'Bengaluru',
  'Hyderabad',
  'Chennai',
  'Kolkata',
  'Pune'
];

export default function StoreLocator({ forwardRef, activeMedicineName, cheapestGenericName }) {
  const [stores, setStores] = useState({ jan_aushadhi_kendras: [], general_pharmacies: [] });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('jan_aushadhi'); // 'jan_aushadhi' | 'general'
  const [selectedCity, setSelectedCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [geoStatus, setGeoStatus] = useState(''); // 'locating' | 'granted' | 'denied'
  const [userLocation, setUserLocation] = useState(null);

  const fetchStores = async (lat, lng, cityQuery, pincodeQuery) => {
    setLoading(true);
    try {
      const data = await api.getNearbyStores(lat, lng, cityQuery, pincodeQuery);
      setStores({
        jan_aushadhi_kendras: data.jan_aushadhi_kendras || [],
        general_pharmacies: data.general_pharmacies || []
      });
      if (data.user_location) {
        setUserLocation(data.user_location);
      }
    } catch (err) {
      console.error('Error fetching stores:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores(null, null, '', '');
  }, []);

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus('denied');
      return;
    }

    setGeoStatus('locating');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setGeoStatus('granted');
        fetchStores(latitude, longitude, selectedCity, pincode);
      },
      (error) => {
        console.warn('Geolocation denied:', error);
        setGeoStatus('denied');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleCityChange = (city) => {
    setSelectedCity(city);
    fetchStores(userLocation?.lat, userLocation?.lng, city, pincode);
  };

  const currentStoreList = activeTab === 'jan_aushadhi' 
    ? stores.jan_aushadhi_kendras 
    : stores.general_pharmacies;

  return (
    <section ref={forwardRef} className="w-full max-w-6xl mx-auto bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 shadow-sm scroll-mt-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full">
              Store Locator & Availability
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            Where to Buy Cheaper Generics & Branded Medicines
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Find government Jan Aushadhi Kendras (for maximum savings) or licensed local chemists near you.
          </p>
        </div>

        {/* Location Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Geolocation Button */}
          <button
            onClick={handleUseLocation}
            disabled={geoStatus === 'locating'}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition-all disabled:opacity-50"
          >
            {geoStatus === 'locating' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Navigation className="w-4 h-4" />
            )}
            <span>{geoStatus === 'granted' ? 'Location Active' : 'Use My GPS Location'}</span>
          </button>

          {/* City Selector */}
          <select
            value={selectedCity}
            onChange={(e) => handleCityChange(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">Filter by City</option>
            {CITIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {geoStatus === 'denied' && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs text-amber-800">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>Location access was denied. Showing verified stores by default region.</span>
        </div>
      )}

      {/* Dual Tab Navigation */}
      <div className="flex border-b border-slate-200 mt-6">
        <button
          onClick={() => setActiveTab('jan_aushadhi')}
          className={`flex-1 sm:flex-none pb-3 px-4 sm:px-6 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border-b-2 transition-all ${
            activeTab === 'jan_aushadhi'
              ? 'border-emerald-600 text-emerald-800 bg-emerald-50/40'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>Jan Aushadhi Kendras (Govt Generic)</span>
          <span className="px-2 py-0.5 text-[11px] font-extrabold bg-emerald-100 text-emerald-800 rounded-full">
            {stores.jan_aushadhi_kendras.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('general')}
          className={`flex-1 sm:flex-none pb-3 px-4 sm:px-6 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border-b-2 transition-all ${
            activeTab === 'general'
              ? 'border-teal-600 text-teal-800 bg-teal-50/40'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4 text-teal-600" />
          <span>General Pharmacies & Chemists</span>
          <span className="px-2 py-0.5 text-[11px] font-bold bg-slate-100 text-slate-700 rounded-full">
            {stores.general_pharmacies.length}
          </span>
        </button>
      </div>

      {/* Tab Context Banner */}
      <div className="mt-4 mb-4">
        {activeTab === 'jan_aushadhi' ? (
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 flex items-start gap-2 text-xs text-emerald-900">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Pradhan Mantri Bhartiya Janaushadhi Kendras (PMBJP): </span>
              Government-supported retail pharmacies providing WHO-GMP certified generic medicines at 50% to 90% discount compared to branded equivalents.
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-start gap-2 text-xs text-slate-700">
            <Building className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Retail Pharmacies: </span>
              Stock both prescribed branded medicines ({activeMedicineName || 'branded drugs'}) and selected generic brands.
            </div>
          </div>
        )}
      </div>

      {/* Store Cards Grid */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600 mb-2" />
          <p className="text-sm font-medium">Finding nearest verified pharmacies...</p>
        </div>
      ) : currentStoreList.length === 0 ? (
        <div className="py-12 text-center text-slate-500">
          <MapPin className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="font-medium text-sm">No stores found matching this location</p>
          <button 
            onClick={() => handleCityChange('')}
            className="text-xs text-teal-600 font-semibold hover:underline mt-1"
          >
            Show all available locations
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentStoreList.map((store) => (
            <div
              key={store.id}
              className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                store.is_generic 
                  ? 'border-emerald-200 bg-gradient-to-b from-white to-emerald-50/20 hover:border-emerald-400 hover:shadow-card' 
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-card'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-sm sm:text-base text-slate-900">
                        {store.name}
                      </span>
                      {store.verified && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 flex items-center gap-0.5">
                          <ShieldCheck className="w-3 h-3 text-teal-600" />
                          Verified
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 mt-1 flex items-start gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                      <span>{store.address}</span>
                    </p>
                  </div>

                  {store.distance_km !== undefined && (
                    <div className="text-right flex-shrink-0">
                      <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-800 rounded-lg">
                        ~{store.distance_km} km
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
                  {store.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{store.phone}</span>
                    </div>
                  )}
                  {store.hours && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{store.hours}</span>
                    </div>
                  )}
                </div>

                {store.discount_note && (
                  <div className="mt-2 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">
                    ✨ {store.discount_note}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  {store.city} ({store.pincode})
                </span>

                <a
                  href={store.directions_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-lg border border-teal-200 transition-colors"
                >
                  <span>Get Directions</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 text-center text-[11px] text-slate-400">
        Note: Store listings utilize verified OpenStreetMap & Jan Aushadhi registry records.
      </div>
    </section>
  );
}
