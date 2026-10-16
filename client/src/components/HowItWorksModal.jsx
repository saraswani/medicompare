import React from 'react';
import { X, ShieldCheck, CheckCircle2, AlertTriangle, Building2, Pill, Database, Scale, Stethoscope } from 'lucide-react';

export default function HowItWorksModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl border border-blue-100 relative animate-scale-in max-h-[90vh] overflow-y-auto custom-scrollbar">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold flex-shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900">Clinical Methodology & Regulatory Sources</h2>
            <p className="text-xs text-slate-500">Bioequivalence verification, dataset provenance, and patient safety rules</p>
          </div>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
          
          <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4">
            <h3 className="font-extrabold text-blue-900 flex items-center gap-1.5 mb-1 text-xs sm:text-sm">
              <CheckCircle2 className="w-4 h-4 text-blue-700" />
              What is an Active Pharmaceutical Ingredient (API)?
            </h3>
            <p className="text-slate-700 text-xs leading-relaxed">
              Every pharmaceutical drug achieves its therapeutic healing effect from an active chemical salt (e.g. <em>Paracetamol 650mg</em>, <em>Amoxycillin 500mg + Clavulanic Acid 125mg</em>, or <em>Telmisartan 40mg</em>). Under <strong>Indian Pharmacopoeia (IP)</strong> and WHO-GMP standards, medicines sharing identical active molecules, strengths, and dosage forms produce equivalent clinical therapeutic efficacy.
            </p>
          </div>

          {/* Connected Data Sources */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-2.5">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
              <Database className="w-4 h-4 text-blue-600" />
              Connected Regulatory Datasets & Provenance
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-900">CDSCO (India)</div>
                <div className="text-[11px] text-slate-500">Central Drugs Standard Control Organisation approved formulations and Schedule H prescription classifications.</div>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-900">PMBJP Jan Aushadhi (India)</div>
                <div className="text-[11px] text-slate-500">Department of Pharmaceuticals, Govt. of India official product catalog with government-notified retail prices.</div>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-900">RxNorm / RxNav (US NLM)</div>
                <div className="text-[11px] text-slate-500">National Library of Medicine standardized clinical drug names and RxCUIs (concept-only, non-commercial).</div>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-900">openFDA NDC (US FDA)</div>
                <div className="text-[11px] text-slate-500">US National Drug Code Directory labelers, NDA/ANDA application approvals, and dosage characteristics.</div>
              </div>
            </div>
          </div>

          {/* Strict Data Boundaries */}
          <div className="border border-blue-100 rounded-2xl p-4 bg-white space-y-2 text-xs">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-blue-600" />
              Clinical Comparison Rules & Boundaries
            </h4>
            <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px] leading-relaxed">
              <li><strong>Zero Fabricated Data:</strong> We never generate prices or invent approvals. If a dataset does not publish retail pricing, price comparison is strictly disabled.</li>
              <li><strong>Jurisdiction Isolation:</strong> US FDA and RxNorm listings are never used to claim Indian CDSCO approval or availability.</li>
              <li><strong>Formulation Compatibility:</strong> Sustained-release (SR/ER) formulations are never compared with Immediate-Release (IR), nor are syrups compared with tablets.</li>
              <li><strong>Unit-Cost Normalization:</strong> Strips of 10s and 15s are normalized to per-tablet cost so you see genuine apples-to-apples savings.</li>
            </ul>
          </div>

          {/* Narrow Therapeutic Index Warning */}
          <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3.5 text-amber-950">
            <div className="flex items-center gap-1.5 font-bold text-xs text-amber-900 mb-1">
              <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0" />
              <span>Medical Safety Rule: Narrow Therapeutic Index (NTI)</span>
            </div>
            <p className="text-xs leading-relaxed">
              For most common conditions (fever, pain, infections, acidity, cholesterol), substituting identical generic salts is safe and standard practice. However, for <strong>narrow therapeutic index</strong> medications—including anti-epileptic drugs, levothyroxine, lithium, digoxin, and immunosuppressants—minor bioavailability variations may matter. Always consult your prescribing physician before switching brands of these specific drugs.
            </p>
          </div>

          <div className="border-t border-slate-100 pt-3">
            <h3 className="font-bold text-slate-900 mb-1 text-xs">How to use ValueBuy at the pharmacy:</h3>
            <ol className="list-decimal list-inside space-y-1 text-xs text-slate-600">
              <li>Search the brand name printed on your prescription.</li>
              <li>Inspect the verified active chemical salt and strength.</li>
              <li>Save the equivalent generic or click <strong>"Chemist Slip"</strong> to display the counter reference.</li>
              <li>Ask the pharmacist: <em>"Please dispense the Jan Aushadhi or generic version containing this exact salt and dosage."</em></li>
            </ol>
          </div>

        </div>

        <div className="mt-5 pt-3.5 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
          >
            Understood
          </button>
        </div>

      </div>
    </div>
  );
}
