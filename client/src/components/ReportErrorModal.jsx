import React, { useState } from 'react';
import { X, AlertTriangle, CheckCircle2, Loader2, Send, ShieldAlert, FileText } from 'lucide-react';
import { api } from '../services/api';

const ERROR_TYPES = [
  { value: 'PRICE_INACCURACY', label: 'Incorrect Price or MRP' },
  { value: 'COMPOSITION_ERROR', label: 'Wrong Salt / Active Ingredient / Strength' },
  { value: 'DOSAGE_FORM_MISMATCH', label: 'Wrong Formulation (Tablet vs Syrup vs SR)' },
  { value: 'MANUFACTURER_ERROR', label: 'Incorrect Manufacturer / Brand Owner' },
  { value: 'DISCONTINUED_MEDICINE', label: 'Product Discontinued or Banned' },
  { value: 'OTHER', label: 'Other Data Inaccuracy' }
];

export default function ReportErrorModal({ isOpen, onClose, medicine }) {
  const [errorType, setErrorType] = useState('PRICE_INACCURACY');
  const [description, setDescription] = useState('');
  const [suggestedCorrection, setSuggestedCorrection] = useState('');
  const [sourceReference, setSourceReference] = useState('');
  const [reporterContact, setReporterContact] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedReport, setSubmittedReport] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      setErrorMessage('Please provide a brief description of the error.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      const response = await api.submitErrorReport({
        medicine_id: medicine?.id || 'GENERAL',
        medicine_name: medicine?.name || 'General Platform Feedback',
        error_type: errorType,
        description: description.trim(),
        suggested_correction: suggestedCorrection.trim(),
        source_reference: sourceReference.trim(),
        reporter_contact: reporterContact.trim()
      });

      setSubmittedReport(response);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmittedReport(null);
    setDescription('');
    setSuggestedCorrection('');
    setSourceReference('');
    setReporterContact('');
    setErrorMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-7 shadow-2xl border border-slate-200 relative animate-scale-in max-h-[90vh] overflow-y-auto custom-scrollbar">
        
        {/* Close Button */}
        <button
          onClick={handleReset}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Close error report modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold flex-shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900">Report Clinical or Price Error</h2>
            <p className="text-xs text-slate-500">Peer-review workflow for healthcare data accuracy</p>
          </div>
        </div>

        {submittedReport ? (
          <div className="py-6 text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-base">Report Submitted for Verification</h3>
            <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
              Thank you for contributing to medical data integrity. Your report has been logged with Reference ID:
            </p>
            <div className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg inline-block border border-blue-200">
              {submittedReport.report_id}
            </div>
            <p className="text-[11px] text-slate-400">
              Our clinical review queue audits all submissions against published CDSCO, NPPA, and NLM records.
            </p>
            <div className="pt-3">
              <button
                type="button"
                onClick={handleReset}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs text-slate-700">
            {medicine && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-start gap-2.5">
                <FileText className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Referenced Medicine</span>
                  <div className="font-bold text-slate-900 truncate">{medicine.name}</div>
                  <div className="text-[11px] text-slate-500 truncate">{medicine.display_composition}</div>
                </div>
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-800 mb-1">Issue Category *</label>
              <select
                value={errorType}
                onChange={(e) => setErrorType(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {ERROR_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">Description of Discrepancy *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Describe what information is inaccurate, missing, or outdated (e.g. current pharmacy MRP, pack size, dosage form)..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">Suggested Correction (Optional)</label>
              <input
                type="text"
                value={suggestedCorrection}
                onChange={(e) => setSuggestedCorrection(e.target.value)}
                placeholder="e.g. Correct MRP is ₹28.50 for strip of 10"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">Citation / Source URL / Batch Label (Optional)</label>
              <input
                type="text"
                value={sourceReference}
                onChange={(e) => setSourceReference(e.target.value)}
                placeholder="e.g. Official PMBJP list, NPPA DPCO order, photo of strip batch"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">Your Email or Affiliation (Optional)</label>
              <input
                type="text"
                value={reporterContact}
                onChange={(e) => setReporterContact(e.target.value)}
                placeholder="doctor / pharmacist / patient email for follow-up"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {errorMessage && (
              <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200">
                {errorMessage}
              </div>
            )}

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="flex-[2] py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>Submit for Clinical Review</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
