import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Navigation, 
  Phone, 
  Clock, 
  ExternalLink, 
  ShieldCheck, 
  Loader2, 
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
  const [geoStatus, setGeoStatus] = useState('');
  const [userLocation, setUserLocation] = useState(null);

  const fetchStores = async (lat, lng, cityQuery) => {
    setLoading(true);
    try {
      const data = await api.getNearbyStores(lat, lng, cityQuery, '');
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
    fetchStores(null, null, '');
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
        fetchStores(latitude, longitude, selectedCity);
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
    fetchStores(userLocation?.lat, userLocation?.lng, city);
  };

  const currentStoreList = activeTab === 'jan_aushadhi' 
    ? stores.jan_aushadhi_kendras 
    : stores.general_pharmacies;

  return (
    <section ref={forwardRef} className="w-full max-w-6xl mx-auto bg-white rounded-3xl border border-blue-100 p-5 sm:p-7 shadow-[0_4px_20px_rgba(37,99,235,0.06)] scroll-mt-20">
      
      {/* Header & Location Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
              Verified Pharmacy Network
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Where to Purchase Generic & Prescribed Medicines
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Compare government Jan Aushadhi Kendras (for up to 90% savings) with licensed local retail chemists.
          </p>
        </div>

        {/* Location Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleUseLocation}
            disabled={geoStatus === 'locating'}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/25 transition-all disabled:opacity-50 min-h-[40px]"
          >
            {geoStatus === 'locating' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Navigation className="w-4 h-4" />
            )}
            <span>{geoStatus === 'granted' ? 'GPS Active' : 'Nearby Stores'}</span>
          </button>

          <select
            value={selectedCity}
            onChange={(e) => handleCityChange(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[40px]"
          >
            <option value="">Filter City</option>
            {CITIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {geoStatus === 'denied' && (
        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-2 text-xs text-amber-800">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>Location access not granted. Showing verified stores by default region.</span>
        </div>
      )}

      {/* Segmented Tab Navigation */}
      <div className="flex border-b border-slate-200 mt-5">
        <button
          onClick={() => setActiveTab('jan_aushadhi')}
          className={`flex-1 sm:flex-none pb-3 px-3 sm:px-6 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border-b-2 transition-all ${
            activeTab === 'jan_aushadhi'
              ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Jan Aushadhi Kendras (PMBJP)</span>
          <span className="px-2 py-0.5 text-[10px] font-black bg-emerald-100 text-emerald-800 rounded-full">
            {stores.jan_aushadhi_kendras.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('general')}
          className={`flex-1 sm:flex-none pb-3 px-3 sm:px-6 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border-b-2 transition-all ${
            activeTab === 'general'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4 text-blue-600" />
          <span>Retail Chemists</span>
          <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-700 rounded-full">
            {stores.general_pharmacies.length}
          </span>
        </button>
      </div>

      {/* Tab Context Banner */}
      <div className="mt-4 mb-4">
        {activeTab === 'jan_aushadhi' ? (
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-emerald-950">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Pradhan Mantri Bhartiya Janaushadhi Pariyojana (PMBJP): </span>
              Government-run generic pharmacies supplying WHO-GMP certified high quality medicines at 50% to 90% lower prices.
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-slate-700">
            <Building2 className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Licensed Retail Chemists: </span>
              Stock prescribed branded medicines ({activeMedicineName || 'branded drugs'}) as well as selected branded generics.
            </div>
          </div>
        )}
      </div>

      {/* Store Cards Grid with Pop Animation */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
          <p className="text-xs font-semibold text-slate-600">Locating nearest verified stores...</p>
        </div>
      ) : currentStoreList.length === 0 ? (
        <div className="py-10 text-center text-slate-400 text-xs">
          No stores found in this location filter. Select another city or try GPS.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentStoreList.map((store) => (
            <div
              key={store.id}
              className="pop-card rounded-2xl border border-blue-100 p-4 sm:p-5 bg-white flex flex-col justify-between shadow-sm"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h3 className="font-bold text-sm text-slate-900 leading-snug">
                    {store.name}
                  </h3>

                  {store.distance_km !== null && (
                    <span className="text-[11px] font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 flex-shrink-0">
                      {store.distance_km} km
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 flex items-start gap-1.5 mt-1 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                  <span>{store.address}, {store.city} - {store.pincode}</span>
                </p>

                <div className="mt-3 space-y-1 text-[11px] text-slate-500 font-medium">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{store.timings || 'Mon-Sat: 9:00 AM - 9:00 PM'}</span>
                  </div>

                  {store.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <a href={`tel:${store.phone}`} className="hover:text-blue-600 underline">
                        {store.phone}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${store.name} ${store.address} ${store.city}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 min-h-[38px]"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Directions</span>
                </a>

                {store.phone && (
                  <a
                    href={`tel:${store.phone}`}
                    className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 min-h-[38px]"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call</span>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

    </section>
  );
}
