import React from 'react';
import { X, ShieldCheck, CheckCircle2, AlertCircle, Building2, Pill } from 'lucide-react';

export default function HowItWorksModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative animate-scale-up">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">How Indian Medicine Swaps Work</h2>
            <p className="text-xs text-slate-500">Same Active Salt Molecule, Equal Efficacy</p>
          </div>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
          
          <div className="bg-teal-50/70 border border-teal-200 rounded-2xl p-4">
            <h3 className="font-bold text-teal-900 flex items-center gap-1.5 mb-1 text-sm">
              <CheckCircle2 className="w-4 h-4 text-teal-700" />
              What is an Active Pharmaceutical Ingredient (API)?
            </h3>
            <p className="text-teal-950/80 text-xs">
              Every medicine gets its healing effect from an active chemical salt (like <em>Paracetamol 650mg</em> or <em>Amoxicillin 500mg</em>). Whether you buy a heavily advertised brand or an unbranded generic, the active salt molecule and strength are identical.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5 mb-1 text-xs sm:text-sm">
                <Building2 className="w-4 h-4 text-amber-600" />
                Branded Medicines
              </h4>
              <p className="text-slate-600 text-xs">
                Manufactured by prominent pharmaceutical companies with high marketing budgets, representative networks, and packaging costs built into the retail MRP.
              </p>
            </div>

            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5 mb-1 text-xs sm:text-sm">
                <Pill className="w-4 h-4 text-indigo-600" />
                Generic & Jan Aushadhi
              </h4>
              <p className="text-slate-600 text-xs">
                Sold under the chemical salt name or by government-monitored initiatives (PMBJP) without commercial promotion costs, passing direct savings (50% to 90%) to patients.
              </p>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3">
            <h3 className="font-bold text-slate-900 mb-1">How to use this tool:</h3>
            <ol className="list-decimal list-inside space-y-1 text-xs text-slate-600">
              <li>Type the brand name written on your prescription in the search bar.</li>
              <li>Review the equivalent options sharing the <strong>exact same active salt</strong>.</li>
              <li>Save your swaps and locate the nearest <strong>Jan Aushadhi Kendra</strong> or local pharmacy.</li>
              <li>Ask your pharmacist or doctor: <em>"Can you dispense the generic equivalent with this exact composition?"</em></li>
            </ol>
          </div>

        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition-colors"
          >
            Got it, Let's Search
          </button>
        </div>

      </div>
    </div>
  );
}
