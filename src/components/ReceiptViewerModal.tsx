import React, { useState } from 'react';
import { Transaction } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';

interface ReceiptViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction?: Transaction | null;
  imageUrl?: string | null;
  currencySymbol?: string;
  lang?: 'bn' | 'en';
}

export const ReceiptViewerModal: React.FC<ReceiptViewerModalProps> = ({
  isOpen,
  onClose,
  transaction,
  imageUrl,
  currencySymbol = '৳',
  lang = 'bn',
}) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  if (!isOpen) return null;

  const displayImage = imageUrl || transaction?.receiptImage;
  if (!displayImage) return null;

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5));
  const handleResetZoom = () => {
    setZoom(1);
    setRotation(0);
  };
  const handleRotate = () => setRotation((r) => (r + 90) % 360);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = displayImage;
    link.download = `receipt_${transaction?.id || 'memo'}_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>রশিদ প্রিন্ট - ${transaction?.id || ''}</title>
          <style>
            body { font-family: system-ui, sans-serif; margin: 20px; text-align: center; }
            h2 { margin-bottom: 5px; }
            p { margin: 2px 0 15px 0; color: #475569; font-size: 14px; }
            img { max-width: 100%; max-height: 85vh; object-fit: contain; border: 1px solid #cbd5e1; border-radius: 8px; }
          </style>
        </head>
        <body>
          <h2>বাজারের রশিদ / ভাউচার</h2>
          ${transaction ? `<p>${transaction.category} - ${transaction.amount} ৳ | তারিখ: ${transaction.date}</p>` : ''}
          <img src="${displayImage}" alt="Receipt" />
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full flex flex-col max-h-[94vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🧾</span>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                {lang === 'bn' ? 'বাজারের রশিদের কপি' : 'Market Receipt Copy'}
              </h3>
              {transaction && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {transaction.category} • {formatCurrency(transaction.amount, currencySymbol)} • {formatDate(transaction.date, lang)}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/60 text-xs flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleZoomIn}
              className="p-1.5 px-2.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 font-semibold cursor-pointer"
              title={lang === 'bn' ? 'জুম ইন' : 'Zoom In'}
            >
              🔍+
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1.5 px-2.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 font-semibold cursor-pointer"
              title={lang === 'bn' ? 'জুম আউট' : 'Zoom Out'}
            >
              🔍-
            </button>
            <button
              onClick={handleRotate}
              className="p-1.5 px-2.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 font-semibold cursor-pointer"
              title={lang === 'bn' ? 'ঘুরান' : 'Rotate'}
            >
              ↻ 90°
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1.5 px-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer font-medium"
            >
              {lang === 'bn' ? 'রিসেট' : 'Reset'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="py-1 px-3 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <span>🖨️</span>
              <span>{lang === 'bn' ? 'প্রিন্ট' : 'Print'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="py-1 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>⬇️</span>
              <span>{lang === 'bn' ? 'ডাউনলোড' : 'Download'}</span>
            </button>
          </div>
        </div>

        {/* Viewport */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-900/90 min-h-[300px]">
          <img
            src={displayImage}
            alt="Receipt Document"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transition: 'transform 0.2s ease-in-out',
            }}
            className="max-h-[60vh] max-w-full object-contain rounded shadow-lg origin-center select-none"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Footer Note */}
        {transaction?.note && (
          <div className="p-3 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
            <span className="font-semibold text-slate-800 dark:text-slate-200">📝 {lang === 'bn' ? 'মন্তব্য:' : 'Note:'}</span>
            <span>"{transaction.note}"</span>
          </div>
        )}
      </div>
    </div>
  );
};
