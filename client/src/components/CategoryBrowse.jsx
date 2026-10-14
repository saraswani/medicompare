import React from 'react';
import { Flame, Activity, HeartPulse, ShieldAlert, Pill, Wind, ChevronRight } from 'lucide-react';

const CATEGORIES = [
  {
    id: 'fever',
    title: 'Fever & Pain Relief',
    subtitle: 'Paracetamol, Ibuprofen, Aceclofenac',
    sampleQuery: 'Dolo 650',
    icon: Flame,
    colorClass: 'bg-orange-500 text-white shadow-orange-500/25',
    accentBorder: 'hover:border-orange-300'
  },
  {
    id: 'diabetes',
    title: 'Diabetes Care',
    subtitle: 'Metformin, Vildagliptin, Glimepiride',
    sampleQuery: 'Glycomet 500',
    icon: Activity,
    colorClass: 'bg-sky-500 text-white shadow-sky-500/25',
    accentBorder: 'hover:border-sky-300'
  },
  {
    id: 'cardiac',
    title: 'Blood Pressure & Heart',
    subtitle: 'Telmisartan, Amlodipine, Atorvastatin',
    sampleQuery: 'Telma 40',
    icon: HeartPulse,
    colorClass: 'bg-rose-500 text-white shadow-rose-500/25',
    accentBorder: 'hover:border-rose-300'
  },
  {
    id: 'gastro',
    title: 'Acidity & Digestion',
    subtitle: 'Pantoprazole, Omeprazole, Rabeprazole',
    sampleQuery: 'Pan D',
    icon: ShieldAlert,
    colorClass: 'bg-emerald-500 text-white shadow-emerald-500/25',
    accentBorder: 'hover:border-emerald-300'
  },
  {
    id: 'infection',
    title: 'Antibiotics & Infections',
    subtitle: 'Augmentin, Azithral, Taxim-O',
    sampleQuery: 'Augmentin 625',
    icon: Pill,
    colorClass: 'bg-purple-600 text-white shadow-purple-600/25',
    accentBorder: 'hover:border-purple-300'
  },
  {
    id: 'respiratory',
    title: 'Allergy & Respiratory',
    subtitle: 'Montair LC, Allegra 120, Cetzine',
    sampleQuery: 'Allegra 120',
    icon: Wind,
    colorClass: 'bg-blue-600 text-white shadow-blue-600/25',
    accentBorder: 'hover:border-blue-300'
  }
];

export default function CategoryBrowse({ onSelectQuery }) {
  return (
    <section className="w-full max-w-5xl mx-auto my-6 sm:my-8 px-1">
      {/* Exact Header requested in Image 4 */}
      <div className="mb-4 sm:mb-5">
        <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
          Browse by Health Category
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-normal">
          Don't know the exact brand? Pick a category to find comparisons
        </p>
      </div>

      {/* 2 Rows of 3 Cards matching Image 4 with Pop Hover Animation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
        {CATEGORIES.map((cat) => {
          const IconComp = cat.icon;

          return (
            <button
              key={cat.id}
              onClick={() => onSelectQuery(cat.sampleQuery)}
              className={`pop-card w-full flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-200/90 ${cat.accentBorder} text-left group shadow-sm`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                {/* Colorful Rounded Square Icon */}
                <div className={`w-12 h-12 rounded-2xl ${cat.colorClass} shadow-md flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200`}>
                  <IconComp className="w-6 h-6" />
                </div>

                {/* Title & Subtitle */}
                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                    {cat.title}
                  </h3>
                  <p className="text-xs text-slate-500 truncate mt-0.5 font-medium">
                    {cat.subtitle}
                  </p>
                </div>
              </div>

              {/* Chevron Right Circle */}
              <div className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-blue-50 flex items-center justify-center text-slate-400 group-hover:text-blue-600 flex-shrink-0 transition-all duration-200 group-hover:translate-x-1 ml-2">
                <ChevronRight className="w-4 h-4" />
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
