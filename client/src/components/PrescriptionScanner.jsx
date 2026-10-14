import React, { useState, useRef, useCallback } from 'react';
import { 
  Camera, 
  Upload, 
  X, 
  Loader2, 
  ScanLine, 
  Pill, 
  AlertCircle,
  CheckCircle2,
  ImagePlus,
  RotateCcw,
  ShieldCheck
} from 'lucide-react';
import { api } from '../services/api';

const SCAN_STATES = {
  IDLE: 'idle',
  PREVIEW: 'preview',
  SCANNING: 'scanning',
  RESULTS: 'results',
  ERROR: 'error'
};

export default function PrescriptionScanner({ isOpen, onClose, onSelectMedicine }) {
  const [scanState, setScanState] = useState(SCAN_STATES.IDLE);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [scanResults, setScanResults] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  
  const cameraInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const resetScanner = useCallback(() => {
    setScanState(SCAN_STATES.IDLE);
    setImagePreview(null);
    setSelectedFile(null);
    setScanResults(null);
    setErrorMessage('');
  }, []);

  const handleClose = useCallback(() => {
    resetScanner();
    onClose();
  }, [onClose, resetScanner]);

  const handleImageSelected = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (JPEG, PNG, WEBP).');
      setScanState(SCAN_STATES.ERROR);
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setErrorMessage('Image size exceeds 8MB. Please use a compressed photo.');
      setScanState(SCAN_STATES.ERROR);
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
      setScanState(SCAN_STATES.PREVIEW);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleCameraCapture = (e) => {
    const file = e.target.files?.[0];
    if (file) handleImageSelected(file);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) handleImageSelected(file);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) handleImageSelected(file);
  }, [handleImageSelected]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleScan = async () => {
    if (!selectedFile) return;
    
    setScanState(SCAN_STATES.SCANNING);
    setErrorMessage('');
    
    try {
      const results = await api.scanPrescription(selectedFile);
      if (results.total_extracted === 0) {
        setErrorMessage('No medicine names could be detected in this image. Please ensure good lighting and text focus.');
        setScanState(SCAN_STATES.ERROR);
      } else {
        setScanResults(results);
        setScanState(SCAN_STATES.RESULTS);
      }
    } catch (err) {
      console.error('Scan error:', err);
      setErrorMessage(err.message || 'Prescription scanning service is currently unavailable.');
      setScanState(SCAN_STATES.ERROR);
    }
  };

  const handleMedicineClick = (medicine) => {
    if (medicine.matched) {
      onSelectMedicine(medicine.matched.id);
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in"
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />

      {/* Modal Panel */}
      <div 
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-scale-in max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-700 flex items-center justify-center text-white shadow-sm">
              <ScanLine className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-sm">Prescription OCR Scanner</h2>
              <p className="text-[11px] text-slate-500">Optical character recognition for medicine brand names</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
            aria-label="Close prescription scanner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 custom-scrollbar">
          
          {/* === IDLE === */}
          {scanState === SCAN_STATES.IDLE && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600 text-center leading-relaxed">
                Photograph or upload your doctor's prescription. The scanner will identify written medicine names and find corresponding generic alternatives.
              </p>

              {/* Drag & Drop Zone */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-teal-500 hover:bg-teal-50/20 transition-all cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-teal-100 flex items-center justify-center mx-auto mb-2.5 transition-colors">
                  <ImagePlus className="w-6 h-6 text-slate-400 group-hover:text-teal-700 transition-colors" />
                </div>
                <p className="font-semibold text-xs sm:text-sm text-slate-800">
                  Select or drop prescription photo here
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Supports JPEG, PNG, WEBP (Max 8MB)
                </p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all min-h-[44px]"
                >
                  <Camera className="w-4 h-4 text-teal-700" />
                  <span className="font-semibold text-xs text-slate-800">Take Photo</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all min-h-[44px]"
                >
                  <Upload className="w-4 h-4 text-teal-700" />
                  <span className="font-semibold text-xs text-slate-800">Choose File</span>
                </button>
              </div>

              {/* Privacy Reassurance */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-start gap-2.5 text-[11px] text-slate-600">
                <ShieldCheck className="w-4 h-4 text-teal-700 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800">Medical Privacy Assurance: </span>
                  Prescription images are analyzed in memory to extract text and are never stored on servers or linked to personal identities.
                </div>
              </div>
            </div>
          )}

          {/* === PREVIEW === */}
          {scanState === SCAN_STATES.PREVIEW && (
            <div className="space-y-4">
              <div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                <img 
                  src={imagePreview} 
                  alt="Prescription preview" 
                  className="w-full max-h-60 object-contain bg-slate-50"
                />
              </div>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={resetScanner}
                  className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retake</span>
                </button>
                <button
                  type="button"
                  onClick={handleScan}
                  className="flex-[2] px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <span>Extract Medicines</span>
                </button>
              </div>
            </div>
          )}

          {/* === SCANNING === */}
          {scanState === SCAN_STATES.SCANNING && (
            <div className="py-10 flex flex-col items-center justify-center space-y-3">
              <div className="w-16 h-16 rounded-xl overflow-hidden border border-teal-200 relative">
                <img src={imagePreview} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-slate-900/30 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              </div>
              <div className="text-center">
                <p className="font-bold text-xs sm:text-sm text-slate-900">Analyzing Prescription Text...</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Matching active pharmaceutical compositions</p>
              </div>
            </div>
          )}

          {/* === RESULTS === */}
          {scanState === SCAN_STATES.RESULTS && scanResults && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                <div>
                  <span className="font-bold">Detected {scanResults.total_extracted} medicine{scanResults.total_extracted !== 1 ? 's' : ''}</span>
                  {scanResults.total_matched > 0 && (
                    <span> — {scanResults.total_matched} available in database</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                {scanResults.medicines.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={!item.matched}
                    onClick={() => handleMedicineClick(item)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      item.matched
                        ? 'border-slate-200 bg-white hover:bg-teal-50/60 hover:border-teal-300 cursor-pointer shadow-sm'
                        : 'border-slate-100 bg-slate-50 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        item.matched ? 'bg-teal-50 text-teal-800' : 'bg-slate-100 text-slate-400'
                      }`}>
                        <Pill className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <p className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                          {item.matched ? item.matched.name : item.extracted_name}
                        </p>
                        {item.matched ? (
                          <p className="text-[11px] text-slate-600 truncate">
                            {item.matched.display_composition}
                          </p>
                        ) : (
                          <p className="text-[11px] text-slate-500">
                            Not matched in local database — try manual search
                          </p>
                        )}
                      </div>
                    </div>

                    {item.matched && (
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-xs sm:text-sm text-slate-900">₹{item.matched.price.toFixed(2)}</p>
                        <p className="text-[10px] text-slate-500">{item.matched.pack_size_label}</p>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={resetScanner}
                className="w-full mt-2 px-3 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Scan Another Prescription</span>
              </button>
            </div>
          )}

          {/* === ERROR === */}
          {scanState === SCAN_STATES.ERROR && (
            <div className="py-5 space-y-3">
              <div className="flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center mb-2">
                  <AlertCircle className="w-5 h-5 text-rose-600" />
                </div>
                <p className="font-bold text-xs sm:text-sm text-slate-800">Scan Unsuccessful</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">{errorMessage}</p>
              </div>
              <button
                type="button"
                onClick={resetScanner}
                className="w-full px-3 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Try Again</span>
              </button>
            </div>
          )}
        </div>

        {/* Hidden File Inputs */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleCameraCapture}
          className="hidden"
          aria-label="Capture prescription photo with camera"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
          aria-label="Upload prescription image from gallery"
        />
      </div>
    </div>
  );
}
