import React, { useState, useRef, useEffect, useCallback } from 'react';
import { compressImageFile, captureVideoFrame } from '../utils/imageCompressor';

interface ReceiptCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (receiptDataUrl: string) => void;
  lang?: 'bn' | 'en';
}

export const ReceiptCaptureModal: React.FC<ReceiptCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  lang = 'bn',
}) => {
  const [mode, setMode] = useState<'camera' | 'upload'>('camera');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera helper
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  // Start camera helper
  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(
        lang === 'bn'
          ? 'আপনার ব্রাউজারে সরাসরি ক্যামেরা সমর্থন করছে না। নিচের ফাইল অপশন ব্যবহার করুন।'
          : 'Direct camera stream not supported. Please use the file upload option.'
      );
      setMode('upload');
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
        setIsCameraActive(true);
      }

      // Check if multiple video input devices exist
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        setHasMultipleCameras(videoInputs.length > 1);
      } catch {
        // ignore
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      let errMsg =
        lang === 'bn'
          ? 'ক্যামেরা চালু করা সম্ভব হয়নি। ব্রাউজার পারমিশন চেক করুন অথবা ফাইল আপলোড ব্যবহার করুন।'
          : 'Unable to access camera. Please check permissions or upload a receipt photo.';
      if (err.name === 'NotAllowedError') {
        errMsg =
          lang === 'bn'
            ? 'ক্যামেরা ব্যবহারের অনুমতি দেওয়া হয়নি। অনুগ্রহ করে ব্রাউজার থেকে অনুমতি দিন।'
            : 'Camera permission was denied. Please allow camera access.';
      }
      setCameraError(errMsg);
      setMode('upload');
    }
  }, [facingMode, lang, stopCamera]);

  useEffect(() => {
    if (isOpen && mode === 'camera' && !capturedImage) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, mode, capturedImage, startCamera, stopCamera]);

  // Flip camera between front and back
  const handleToggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Capture snapshot from video stream
  const handleTakeSnapshot = () => {
    if (!videoRef.current) return;
    try {
      setIsProcessing(true);
      const dataUrl = captureVideoFrame(videoRef.current, 1200, 0.82);
      setCapturedImage(dataUrl);
      stopCamera();
    } catch (err) {
      console.error('Failed to capture frame:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle native file input (or camera capture fallback)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      const compressed = await compressImageFile(file, 1200, 0.82);
      setCapturedImage(compressed);
    } catch (err) {
      console.error('Failed to compress image:', err);
      alert(lang === 'bn' ? 'ছবি প্রক্রিয়াকরণে সমস্যা হয়েছে' : 'Failed to process image');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Reset captured image to take another
  const handleRetake = () => {
    setCapturedImage(null);
    setMode('camera');
  };

  // Confirm and attach
  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      handleClose();
    }
  };

  const handleClose = () => {
    stopCamera();
    setCapturedImage(null);
    setCameraError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">📷</span>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                {lang === 'bn' ? 'বাজারের রশিদ / ভাউচার যুক্ত করুন' : 'Attach Market Receipt / Memo'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {lang === 'bn' ? 'ক্যামেরা দিয়ে ছবি তুলুন বা ফাইল থেকে নিন' : 'Take a photo or upload an image'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 flex flex-col items-center justify-center min-h-[340px]">
          {/* If an image is captured / selected, show preview */}
          {capturedImage ? (
            <div className="w-full space-y-4 text-center">
              <div className="relative mx-auto max-h-[50vh] overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-inner">
                <img
                  src={capturedImage}
                  alt="Receipt Preview"
                  className="max-h-[50vh] w-auto object-contain rounded-lg"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute top-2 right-2 px-2.5 py-1 rounded-md bg-emerald-600/90 text-white text-[11px] font-semibold backdrop-blur-xs">
                  ✓ {lang === 'bn' ? 'রশিদ প্রস্তুত' : 'Ready'}
                </span>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                {lang === 'bn'
                  ? 'রশিদের লেখাগুলো স্পষ্ট কিনা যাচাই করুন।'
                  : 'Check if text and numbers are clearly legible.'}
              </p>

              <div className="flex items-center gap-3 justify-center">
                <button
                  type="button"
                  onClick={handleRetake}
                  className="py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-semibold flex items-center gap-2 cursor-pointer transition-all"
                >
                  <span>🔄</span>
                  <span>{lang === 'bn' ? 'পুনরায় তুলুন' : 'Retake'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold flex items-center gap-2 shadow-xs cursor-pointer active:scale-98 transition-all"
                >
                  <span>✅</span>
                  <span>{lang === 'bn' ? 'এই রশিদটি রাখুন' : 'Use Receipt'}</span>
                </button>
              </div>
            </div>
          ) : mode === 'camera' ? (
            /* Live Camera Viewfinder */
            <div className="w-full flex flex-col items-center space-y-3">
              <div className="relative w-full aspect-4/3 max-h-[52vh] bg-black rounded-xl overflow-hidden shadow-md flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* Viewfinder Guideline Overlay */}
                <div className="absolute inset-4 pointer-events-none border-2 border-dashed border-white/60 rounded-xl flex flex-col justify-between p-3">
                  <div className="flex justify-between text-[11px] text-white/80 font-medium drop-shadow-sm">
                    <span>┌</span>
                    <span>{lang === 'bn' ? 'বাজারের রশিদ ফ্রেমের ভেতরে রাখুন' : 'Align receipt inside frame'}</span>
                    <span>┐</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-white/80 font-medium drop-shadow-sm">
                    <span>└</span>
                    <span>┘</span>
                  </div>
                </div>

                {/* Flip camera button */}
                {hasMultipleCameras && (
                  <button
                    type="button"
                    onClick={handleToggleFacingMode}
                    className="absolute top-3 right-3 p-2 rounded-full bg-slate-900/60 text-white hover:bg-slate-900/80 backdrop-blur-xs transition-all cursor-pointer"
                    title={lang === 'bn' ? 'ক্যামেরা পরিবর্তন' : 'Flip Camera'}
                  >
                    🔄
                  </button>
                )}

                {/* Shutter Button Overlay */}
                <div className="absolute bottom-3 inset-x-0 flex justify-center items-center">
                  <button
                    type="button"
                    onClick={handleTakeSnapshot}
                    disabled={isProcessing}
                    className="w-14 h-14 rounded-full border-4 border-white bg-rose-600 hover:bg-rose-700 active:scale-90 transition-all flex items-center justify-center text-white shadow-lg cursor-pointer"
                    title={lang === 'bn' ? 'ছবি তুলুন' : 'Take Photo'}
                  >
                    <span className="text-xl">📸</span>
                  </button>
                </div>
              </div>

              {/* Mode switch or Fallback */}
              <div className="flex items-center justify-between w-full pt-1 px-1">
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    setMode('upload');
                  }}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5 cursor-pointer"
                >
                  <span>📁</span>
                  <span>{lang === 'bn' ? 'ফাইল বা গ্যালারি থেকে আপলোড করুন' : 'Upload from files/gallery'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:underline flex items-center gap-1.5 cursor-pointer"
                >
                  <span>📱</span>
                  <span>{lang === 'bn' ? 'ফোনের সরাসরি ক্যামেরা' : 'Phone Camera App'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Upload / File Picker fallback */
            <div className="w-full space-y-4 text-center">
              {cameraError && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 text-left">
                  ⚠️ {cameraError}
                </div>
              )}

              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-2xl p-8 cursor-pointer transition-all bg-slate-50 dark:bg-slate-800/40 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 flex flex-col items-center justify-center gap-3"
              >
                <span className="text-4xl">🧾</span>
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                    {lang === 'bn' ? 'রশিদের ছবি সিলেক্ট করুন বা ক্যামেরা খুলুন' : 'Select receipt image or take photo'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {lang === 'bn' ? 'JPG, PNG বা WebP ফরম্যাট সমর্থিত' : 'Supports JPG, PNG, or WebP'}
                  </p>
                </div>
                <span className="mt-1 py-1.5 px-4 rounded-xl bg-indigo-600 text-white text-xs font-semibold shadow-xs">
                  {lang === 'bn' ? 'ছবি নির্বাচন করুন' : 'Browse Photo'}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setCameraError(null);
                    setMode('camera');
                  }}
                  className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5 cursor-pointer"
                >
                  <span>📷</span>
                  <span>{lang === 'bn' ? 'সরাসরি লাইভ ক্যামেরা চালু করুন' : 'Open Live Camera'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleClose}
                  className="text-slate-500 hover:underline cursor-pointer"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
              </div>
            </div>
          )}

          {/* Hidden File Input for Native Camera / Gallery selection */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>
    </div>
  );
};
