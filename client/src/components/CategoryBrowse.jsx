import React, { useEffect, useState } from 'react';
import { Flame, Activity, HeartPulse, ShieldAlert, Pill, Wind, ChevronRight } from 'lucide-react';
import { api } from '../services/api';

const ICON_MAP = {
  Flame,
  Activity,
  HeartPulse,
  ShieldAlert,
  Pill,
  Wind
};

export default function CategoryBrowse({ onSelectQuery }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const data = await api.getCategories();
        setCategories(data.categories || []);
      } catch (e) {
        console.error('Error fetching categories:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchCategories();
  }, []);

  if (loading || categories.length === 0) return null;

  return (
    <section className="w-full max-w-5xl mx-auto mt-10">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">Browse by Health Category</h2>
          <p className="text-xs sm:text-sm text-slate-500">Don't know the exact brand? Pick a category to find comparisons</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {categories.map((cat) => {
          const IconComp = ICON_MAP[cat.icon] || Pill;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectQuery(cat.sampleQuery)}
              className="flex items-center justify-between p-4 rounded-xl bg-white border border-slate-200/80 hover:border-teal-400 hover:shadow-card hover:-translate-y-0.5 transition-all text-left group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${cat.color} flex items-center justify-center text-white shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform`}>
                  <IconComp className="w-5 h-5" />
                </div>
                <div className="truncate">
                  <h3 className="font-semibold text-sm text-slate-800 group-hover:text-teal-700 transition-colors truncate">
                    {cat.title}
                  </h3>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {cat.subtitle}
                  </p>
                </div>
              </div>
              <div className="w-7 h-7 rounded-full bg-slate-50 group-hover:bg-teal-50 flex items-center justify-center text-slate-400 group-hover:text-teal-600 flex-shrink-0 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
