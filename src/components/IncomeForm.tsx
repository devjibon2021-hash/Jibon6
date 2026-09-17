import React, { useState, useEffect } from 'react';
import { FamilyMember, PaymentMethod, Transaction } from '../types';
import { INCOME_SOURCES, PAYMENT_METHODS } from '../utils/translations';
import { getTodayDate, getCurrentTime, generateTxnId } from '../utils/formatters';
import { ReceiptCaptureModal } from './ReceiptCaptureModal';
import { ReceiptViewerModal } from './ReceiptViewerModal';

interface IncomeFormProps {
  members: FamilyMember[];
  onSave: (transaction: Transaction) => void;
  onCancel?: () => void;
  editTransaction?: Transaction | null;
  initialData?: Transaction | null;
  currencySymbol?: string;
  lang?: 'bn' | 'en';
}

export const IncomeForm: React.FC<IncomeFormProps> = ({
  members,
  onSave,
  onCancel,
  editTransaction,
  initialData,
  currencySymbol = '৳',
  lang = 'bn',
}) => {
  const currentEdit = editTransaction || initialData;
  const [date, setDate] = useState<string>(getTodayDate());
  const [time, setTime] = useState<string>(getCurrentTime());
  const [memberId, setMemberId] = useState<string>('');
  const [source, setSource] = useState<string>(INCOME_SOURCES[0].bn);
  const [customSource, setCustomSource] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank');
  const [note, setNote] = useState<string>('');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false);
  const [isViewerModalOpen, setIsViewerModalOpen] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (currentEdit) {
      setDate(currentEdit.date);
      setTime(currentEdit.time);
      setMemberId(currentEdit.memberId);
      const isPredefined = INCOME_SOURCES.some((s) => s.bn === currentEdit.category || s.en === currentEdit.category);
      if (isPredefined) {
        setSource(currentEdit.category);
      } else {
        setSource('অন্যান্য');
        setCustomSource(currentEdit.category);
      }
      setAmount(currentEdit.amount.toString());
      setPaymentMethod(currentEdit.paymentMethod);
      setNote(currentEdit.note || '');
      setReceiptImage(currentEdit.receiptImage || null);
    } else {
      setReceiptImage(null);
      if (members.length > 0 && !memberId) {
        setMemberId(members[0].id);
      }
    }
  }, [currentEdit, members]);

  const validate = (): boolean => {
    const errs: { [key: string]: string } = {};
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      errs.amount = lang === 'bn' ? 'সঠিক টাকার পরিমাণ দিন (০ এর বেশি হতে হবে)' : 'Enter a valid amount (> 0)';
    }
    if (!memberId) {
      errs.memberId = lang === 'bn' ? 'পরিবারের সদস্য নির্বাচন করুন' : 'Select a family member';
    }
    if (!date) {
      errs.date = lang === 'bn' ? 'তারিখ নির্বাচন করুন' : 'Select a valid date';
    }
    if (source === 'অন্যান্য' && customSource.trim() === '') {
      errs.source = lang === 'bn' ? 'আয়ের উৎসের নাম লিখুন' : 'Enter income source name';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const selectedMember = members.find((m) => m.id === memberId);
    const finalSource = source === 'অন্যান্য' && customSource ? customSource.trim() : source;

    const tx: Transaction = {
      id: currentEdit ? currentEdit.id : generateTxnId(),
      date,
      time,
      type: 'income',
      memberId,
      memberName: selectedMember ? selectedMember.name : (lang === 'bn' ? 'অজানা সদস্য' : 'Unknown Member'),
      category: finalSource,
      amount: parseFloat(amount),
      paymentMethod,
      note: note.trim(),
      receiptImage: receiptImage || undefined,
      createdAt: currentEdit ? currentEdit.createdAt : Date.now(),
    };

    onSave(tx);

    if (!currentEdit) {
      // Reset amount and note for quick next entry
      setAmount('');
      setNote('');
      setReceiptImage(null);
      setErrors({});
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl mx-auto">
      {/* Date & Time */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            📅 {lang === 'bn' ? 'তারিখ' : 'Date'} <span className="text-rose-500">*</span>
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden transition-all"
          />
          {errors.date && <p className="text-xs text-rose-500 mt-1">{errors.date}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            ⏰ {lang === 'bn' ? 'সময়' : 'Time'}
          </label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden transition-all"
          />
        </div>
      </div>

      {/* Member */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          👤 {lang === 'bn' ? 'পরিবারের সদস্য' : 'Family Member'} <span className="text-rose-500">*</span>
        </label>
        <select
          value={memberId}
          onChange={(e) => setMemberId(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden transition-all"
        >
          <option value="">{lang === 'bn' ? '-- সদস্য নির্বাচন করুন --' : '-- Select Member --'}</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} ({m.role})
            </option>
          ))}
        </select>
        {errors.memberId && <p className="text-xs text-rose-500 mt-1">{errors.memberId}</p>}
      </div>

      {/* Income Source */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          💼 {lang === 'bn' ? 'আয়ের উৎস' : 'Income Source'} <span className="text-rose-500">*</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
          {INCOME_SOURCES.map((s) => {
            const isSelected = source === s.bn || source === s.id;
            return (
              <button
                type="button"
                key={s.id}
                onClick={() => {
                  setSource(s.bn);
                  if (s.id !== 'other') setCustomSource('');
                }}
                className={`py-2 px-3 rounded-xl border text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 justify-center cursor-pointer ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold ring-1 ring-indigo-500'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>{s.icon}</span>
                <span className="truncate">{lang === 'bn' ? s.bn : s.en}</span>
              </button>
            );
          })}
        </div>

        {source === 'অন্যান্য' && (
          <input
            type="text"
            placeholder={lang === 'bn' ? 'নির্দিষ্ট আয়ের উৎসের নাম লিখুন...' : 'Specify income source...'}
            value={customSource}
            onChange={(e) => setCustomSource(e.target.value)}
            className="w-full mt-2 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden transition-all"
          />
        )}
        {errors.source && <p className="text-xs text-rose-500 mt-1">{errors.source}</p>}
      </div>

      {/* Amount */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          💰 {lang === 'bn' ? 'পরিমাণ (টাকা)' : 'Amount'} ({currencySymbol}) <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base font-bold">
            {currencySymbol}
          </span>
          <input
            type="number"
            min="1"
            step="any"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold text-base focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden transition-all"
          />
        </div>
        {errors.amount && <p className="text-xs text-rose-500 mt-1">{errors.amount}</p>}
      </div>

      {/* Payment Method */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          💳 {lang === 'bn' ? 'পেমেন্ট মাধ্যম' : 'Payment Method'}
        </label>
        <div className="grid grid-cols-2 gap-2">
          {PAYMENT_METHODS.map((pm) => (
            <button
              type="button"
              key={pm.id}
              onClick={() => setPaymentMethod(pm.id as PaymentMethod)}
              className={`py-2 px-3 rounded-xl border text-xs sm:text-sm font-medium transition-all flex items-center gap-2 justify-center cursor-pointer ${
                paymentMethod === pm.id
                  ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold ring-1 ring-indigo-500'
                  : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span>{pm.icon}</span>
              <span className="truncate">{lang === 'bn' ? pm.bn : pm.en}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Income Memo / Receipt Photo */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span>🧾</span>
            <span>{lang === 'bn' ? 'আয়ের ভাউচার / স্লিপ / মেমোর ছবি' : 'Income Slip / Memo Photo'}</span>
          </span>
          <span className="text-[11px] text-slate-400 font-normal">
            {lang === 'bn' ? '(ক্যামেরা বা ফাইল)' : '(Camera or File)'}
          </span>
        </label>

        {receiptImage ? (
          <div className="flex items-center gap-3 p-3 rounded-xl border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/40 dark:bg-indigo-950/20">
            <div
              onClick={() => setIsViewerModalOpen(true)}
              className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden border border-indigo-300 dark:border-indigo-700 shrink-0 cursor-pointer shadow-xs group bg-slate-900"
              title={lang === 'bn' ? 'বড় করে দেখতে চাপুন' : 'Click to view full'}
            >
              <img
                src={receiptImage}
                alt="Attached Slip"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs transition-opacity">
                🔍
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate flex items-center gap-1">
                <span className="text-emerald-600 dark:text-emerald-400">✓</span>
                <span>{lang === 'bn' ? 'স্লিপ বা মেমোর ছবি যুক্ত হয়েছে' : 'Slip/Memo attached'}</span>
              </p>
              <div className="flex items-center gap-2 mt-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => setIsViewerModalOpen(true)}
                  className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  {lang === 'bn' ? 'বড় করে দেখুন' : 'View Full'}
                </button>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <button
                  type="button"
                  onClick={() => setIsCaptureModalOpen(true)}
                  className="font-semibold text-slate-600 dark:text-slate-300 hover:underline cursor-pointer"
                >
                  {lang === 'bn' ? 'পুনরায় তুলুন' : 'Retake'}
                </button>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <button
                  type="button"
                  onClick={() => setReceiptImage(null)}
                  className="font-semibold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                >
                  {lang === 'bn' ? 'মুছে ফেলুন' : 'Remove'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsCaptureModalOpen(true)}
            className="w-full py-2.5 px-3.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 text-slate-700 dark:text-slate-300 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm font-medium cursor-pointer"
          >
            <span className="text-base">📷</span>
            <span>{lang === 'bn' ? 'ক্যামেরা দিয়ে স্লিপ / ভাউচারের ছবি তুলুন' : 'Take photo of voucher/memo'}</span>
          </button>
        )}
      </div>

      {/* Note */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          📝 {lang === 'bn' ? 'মন্তব্য / নোট (ঐচ্ছিক)' : 'Note / Remarks (Optional)'}
        </label>
        <textarea
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={lang === 'bn' ? 'আয় সম্পর্কে অতিরিক্ত তথ্য লিখুন...' : 'Add any additional details...'}
          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden transition-all"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-semibold text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>✅</span>
          <span>{currentEdit ? (lang === 'bn' ? 'হিসাব আপডেট করুন' : 'Update Income') : (lang === 'bn' ? 'আয় সংরক্ষণ করুন' : 'Save Income')}</span>
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm transition-all cursor-pointer"
          >
            {lang === 'bn' ? 'বাতিল' : 'Cancel'}
          </button>
        )}
      </div>

      {/* Receipt Capture Modal */}
      <ReceiptCaptureModal
        isOpen={isCaptureModalOpen}
        onClose={() => setIsCaptureModalOpen(false)}
        onCapture={(imgUrl) => {
          setReceiptImage(imgUrl);
          setIsCaptureModalOpen(false);
        }}
        lang={lang}
      />

      {/* Receipt Fullscreen Viewer Modal */}
      <ReceiptViewerModal
        isOpen={isViewerModalOpen}
        onClose={() => setIsViewerModalOpen(false)}
        imageUrl={receiptImage}
        currencySymbol={currencySymbol}
        lang={lang}
      />
    </form>
  );
};
