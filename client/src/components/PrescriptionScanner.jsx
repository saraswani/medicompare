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
  Sparkles
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
      setErrorMessage('Please select a valid image file.');
      setScanState(SCAN_STATES.ERROR);
      return;
    }

    // Max 8MB
    if (file.size > 8 * 1024 * 1024) {
      setErrorMessage('Image is too large. Please use an image under 8MB.');
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
        setErrorMessage('No medicine names could be identified in this image. Try a clearer photo or different angle.');
        setScanState(SCAN_STATES.ERROR);
      } else {
        setScanResults(results);
        setScanState(SCAN_STATES.RESULTS);
      }
    } catch (err) {
      console.error('Scan error:', err);
      setErrorMessage(err.message || 'Failed to scan prescription. Please try again.');
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
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" />

      {/* Modal Panel */}
      <div 
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-scale-in max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-teal-50 to-emerald-50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-md">
              <ScanLine className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-sm">Prescription Scanner</h2>
              <p className="text-[11px] text-slate-500">Powered by AI Vision</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Close scanner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 custom-scrollbar">
          
          {/* === IDLE: Upload Options === */}
          {scanState === SCAN_STATES.IDLE && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500 text-center leading-relaxed">
                Take a photo or upload an image of your prescription. Our AI will identify the medicines for you.
              </p>

              {/* Drag & Drop Zone */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:border-teal-400 hover:bg-teal-50/30 transition-all cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-14 h-14 rounded-2xl bg-slate-100 group-hover:bg-teal-100 flex items-center justify-center mx-auto mb-3 transition-colors">
                  <ImagePlus className="w-7 h-7 text-slate-400 group-hover:text-teal-600 transition-colors" />
                </div>
                <p className="font-semibold text-sm text-slate-700">
                  Drop your prescription here
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  or click to browse files
                </p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-slate-200 bg-white hover:bg-teal-50 hover:border-teal-300 transition-all group shadow-sm"
                >
                  <div className="w-11 h-11 rounded-xl bg-teal-50 group-hover:bg-teal-100 flex items-center justify-center transition-colors">
                    <Camera className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <span className="font-semibold text-xs text-slate-800 block">Take Photo</span>
                    <span className="text-[10px] text-slate-400">Use camera</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-slate-200 bg-white hover:bg-indigo-50 hover:border-indigo-300 transition-all group shadow-sm"
                >
                  <div className="w-11 h-11 rounded-xl bg-indigo-50 group-hover:bg-indigo-100 flex items-center justify-center transition-colors">
                    <Upload className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <span className="font-semibold text-xs text-slate-800 block">Upload Image</span>
                    <span className="text-[10px] text-slate-400">From gallery</span>
                  </div>
                </button>
              </div>

              {/* Tips */}
              <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-3">
                <p className="text-[11px] text-amber-800 font-semibold mb-1">📋 Tips for best results:</p>
                <ul className="text-[11px] text-amber-700 space-y-0.5 list-disc list-inside">
                  <li>Ensure good lighting and focus</li>
                  <li>Include the full medicine list in the frame</li>
                  <li>Both printed and handwritten prescriptions work</li>
                </ul>
              </div>
            </div>
          )}

          {/* === PREVIEW: Show captured image === */}
          {scanState === SCAN_STATES.PREVIEW && (
            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                <img 
                  src={imagePreview} 
                  alt="Prescription preview" 
                  className="w-full max-h-64 object-contain bg-slate-50"
                />
                {/* Scanning line animation overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-teal-500 to-transparent opacity-0 animate-none" />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={resetScanner}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Retake
                </button>
                <button
                  type="button"
                  onClick={handleScan}
                  className="flex-[2] px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold text-sm hover:from-teal-500 hover:to-emerald-500 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Scan Prescription
                </button>
              </div>
            </div>
          )}

          {/* === SCANNING: Processing animation === */}
          {scanState === SCAN_STATES.SCANNING && (
            <div className="py-10 flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-teal-200 shadow-lg">
                  <img src={imagePreview} alt="" className="w-full h-full object-cover" />
                </div>
                {/* Scanning animation overlay */}
                <div className="absolute inset-0 rounded-2xl overflow-hidden">
                  <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-teal-400 to-transparent scan-line-animation" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-teal-500 rounded-xl flex items-center justify-center shadow-md">
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                </div>
              </div>
              <div className="text-center">
                <p className="font-bold text-sm text-slate-800">Analyzing prescription...</p>
                <p className="text-xs text-slate-500 mt-1">AI is reading medicine names from your image</p>
              </div>
            </div>
          )}

          {/* === RESULTS: Extracted medicines === */}
          {scanState === SCAN_STATES.RESULTS && scanResults && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200/60">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-emerald-800">
                    Found {scanResults.total_extracted} medicine{scanResults.total_extracted !== 1 ? 's' : ''} 
                    {scanResults.total_matched > 0 && (
                      <span className="font-normal text-emerald-700">
                        {' '}• {scanResults.total_matched} matched in our database
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Medicine Cards */}
              <div className="space-y-2">
                {scanResults.medicines.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={!item.matched}
                    onClick={() => handleMedicineClick(item)}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      item.matched
                        ? 'border-slate-200 bg-white hover:bg-teal-50 hover:border-teal-300 cursor-pointer shadow-sm hover:shadow-md'
                        : 'border-slate-100 bg-slate-50 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        item.matched 
                          ? 'bg-teal-50 text-teal-600' 
                          : 'bg-slate-100 text-slate-400'
                      }`}>
                        <Pill className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <p className="font-semibold text-sm text-slate-900 truncate">
                          {item.matched ? item.matched.name : item.extracted_name}
                        </p>
                        {item.matched ? (
                          <p className="text-[11px] text-slate-500 truncate">
                            {item.matched.display_composition}
                          </p>
                        ) : (
                          <p className="text-[11px] text-amber-600">
                            Not found in database — try searching manually
                          </p>
                        )}
                        {item.matched && item.extracted_name.toLowerCase() !== item.matched.name.toLowerCase() && (
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Detected as: "{item.extracted_name}"
                          </p>
                        )}
                      </div>
                    </div>

                    {item.matched && (
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-sm text-slate-900">₹{item.matched.price.toFixed(2)}</p>
                        <p className="text-[10px] text-slate-500">{item.matched.pack_size_label}</p>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Re-scan Button */}
              <button
                type="button"
                onClick={resetScanner}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Scan Another Prescription
              </button>
            </div>
          )}

          {/* === ERROR State === */}
          {scanState === SCAN_STATES.ERROR && (
            <div className="py-6 space-y-4">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3">
                  <AlertCircle className="w-6 h-6 text-red-500" />
                </div>
                <p className="font-semibold text-sm text-slate-800">Scan Unsuccessful</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">{errorMessage}</p>
              </div>
              <button
                type="button"
                onClick={resetScanner}
                className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold text-sm hover:from-teal-500 hover:to-emerald-500 transition-all shadow-md flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Try Again
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
