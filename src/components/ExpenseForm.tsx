import React, { useState, useEffect } from 'react';
import { CategoryBudget, FamilyMember, PaymentMethod, Transaction } from '../types';
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from '../utils/translations';
import { getTodayDate, getCurrentTime, generateTxnId, formatCurrency } from '../utils/formatters';
import { ReceiptCaptureModal } from './ReceiptCaptureModal';
import { ReceiptViewerModal } from './ReceiptViewerModal';

interface ExpenseFormProps {
  members: FamilyMember[];
  budgets: CategoryBudget[];
  currentMonthTransactions?: Transaction[];
  transactions?: Transaction[];
  onSave: (transaction: Transaction) => void;
  onCancel?: () => void;
  editTransaction?: Transaction | null;
  initialData?: Transaction | null;
  currencySymbol?: string;
  lang?: 'bn' | 'en';
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({
  members,
  budgets,
  currentMonthTransactions,
  transactions,
  onSave,
  onCancel,
  editTransaction,
  initialData,
  currencySymbol = '৳',
  lang = 'bn',
}) => {
  const currentEdit = editTransaction || initialData;
  const allTx = currentMonthTransactions || transactions || [];
  const [date, setDate] = useState<string>(getTodayDate());
  const [time, setTime] = useState<string>(getCurrentTime());
  const [memberId, setMemberId] = useState<string>('');
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0].bn);
  const [subcategory, setSubcategory] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [note, setNote] = useState<string>('');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false);
  const [isViewerModalOpen, setIsViewerModalOpen] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const selectedCategoryObj = EXPENSE_CATEGORIES.find((c) => c.bn === category || c.en === category) || EXPENSE_CATEGORIES[0];

  useEffect(() => {
    if (currentEdit) {
      setDate(currentEdit.date);
      setTime(currentEdit.time);
      setMemberId(currentEdit.memberId);
      setCategory(currentEdit.category);
      setSubcategory(currentEdit.subcategory || '');
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

  // Compute category budget status
  const matchedBudget = budgets.find(
    (b) => b.category === category || b.category.includes(category) || category.includes(b.category)
  );

  const existingCategoryExpense = allTx
    .filter((tx) => tx.type === 'expense' && (tx.category === category || (currentEdit && tx.id === currentEdit.id ? false : tx.category === category)))
    .reduce((sum, tx) => sum + tx.amount, 0);

  const numAmount = parseFloat(amount) || 0;
  const prospectiveTotal = existingCategoryExpense + numAmount;
  const isOverBudget = matchedBudget && prospectiveTotal > matchedBudget.amount;
  const isNearBudget = matchedBudget && !isOverBudget && prospectiveTotal >= matchedBudget.amount * 0.8;

  const validate = (): boolean => {
    const errs: { [key: string]: string } = {};
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      errs.amount = lang === 'bn' ? 'সঠিক ব্যয়ের পরিমাণ দিন (০ এর বেশি হতে হবে)' : 'Enter a valid amount (> 0)';
    }
    if (!memberId) {
      errs.memberId = lang === 'bn' ? 'পরিবারের সদস্য নির্বাচন করুন' : 'Select a family member';
    }
    if (!date) {
      errs.date = lang === 'bn' ? 'তারিখ নির্বাচন করুন' : 'Select date';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const selectedMember = members.find((m) => m.id === memberId);

    const tx: Transaction = {
      id: currentEdit ? currentEdit.id : generateTxnId(),
      date,
      time,
      type: 'expense',
      memberId,
      memberName: selectedMember ? selectedMember.name : (lang === 'bn' ? 'অজানা সদস্য' : 'Unknown Member'),
      category,
      subcategory: subcategory.trim() || undefined,
      amount: parseFloat(amount),
      paymentMethod,
      note: note.trim(),
      receiptImage: receiptImage || undefined,
      createdAt: currentEdit ? currentEdit.createdAt : Date.now(),
    };

    onSave(tx);

    if (!currentEdit) {
      setAmount('');
      setNote('');
      setSubcategory('');
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
          👤 {lang === 'bn' ? 'ব্যয়কারী সদস্য' : 'Spent By (Family Member)'} <span className="text-rose-500">*</span>
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

      {/* Expense Category */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          🏷️ {lang === 'bn' ? 'ব্যয়ের খাত (Category)' : 'Expense Category'} <span className="text-rose-500">*</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1.5 border border-slate-200 dark:border-slate-700/80 rounded-xl bg-slate-50/70 dark:bg-slate-900/50">
          {EXPENSE_CATEGORIES.map((c) => {
            const isSelected = category === c.bn || category === c.id;
            return (
              <button
                type="button"
                key={c.id}
                onClick={() => {
                  setCategory(c.bn);
                  setSubcategory('');
                }}
                className={`py-2 px-2.5 rounded-xl border text-xs font-medium transition-all text-left truncate flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold ring-1 ring-indigo-500'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className="truncate">{c.bn}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Subcategory */}
      {selectedCategoryObj && selectedCategoryObj.subcategories && selectedCategoryObj.subcategories.length > 0 && (
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
            🔍 {lang === 'bn' ? 'উপ-খাত নির্বাচন করুন বা লিখুন (Sub-category)' : 'Select or write Sub-category'}
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {selectedCategoryObj.subcategories.map((sub) => (
              <button
                type="button"
                key={sub}
                onClick={() => setSubcategory(sub)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  subcategory === sub
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-700 dark:text-indigo-300 font-semibold'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder={lang === 'bn' ? 'নির্দিষ্ট উপ-খাত (যেমন: ইলিশ মাছ, ডাল, ইত্যাদি)...' : 'Subcategory details...'}
            value={subcategory}
            onChange={(e) => setSubcategory(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden transition-all"
          />
        </div>
      )}

      {/* Amount */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          💸 {lang === 'bn' ? 'পরিমাণ (টাকা)' : 'Amount'} ({currencySymbol}) <span className="text-rose-500">*</span>
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

        {/* Live Budget Alert */}
        {matchedBudget && (
          <div className="mt-2 text-xs">
            <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 mb-1">
              <span>
                {lang === 'bn' ? 'মাসিক বাজেট:' : 'Monthly Budget:'} {formatCurrency(matchedBudget.amount, currencySymbol)}
              </span>
              <span>
                {lang === 'bn' ? 'চলতি ব্যয়:' : 'Spent:'} {formatCurrency(prospectiveTotal, currencySymbol)}
              </span>
            </div>
            {isOverBudget ? (
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 font-semibold flex items-center gap-2">
                <span>⚠️</span>
                <span>{lang === 'bn' ? 'আপনার নির্ধারিত বাজেট অতিক্রম করেছে!' : 'Category budget limit exceeded!'}</span>
              </div>
            ) : isNearBudget ? (
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-300 font-semibold flex items-center gap-2">
                <span>⚠️</span>
                <span>{lang === 'bn' ? 'সতর্কতা: বাজেটের ৮০% এর বেশি ব্যয় হচ্ছে' : 'Warning: Reaching 80% of budget'}</span>
              </div>
            ) : null}
          </div>
        )}
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

      {/* Market Receipt / Memo Camera Photo */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span>🧾</span>
            <span>{lang === 'bn' ? 'বাজারের রশিদ / ভাউচারের ছবি' : 'Market Receipt / Memo Photo'}</span>
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
                alt="Attached Receipt"
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
                <span>{lang === 'bn' ? 'রশিদের ছবি যুক্ত হয়েছে' : 'Receipt attached'}</span>
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
            <span>{lang === 'bn' ? 'ক্যামেরা দিয়ে বাজারের রশিদের ছবি তুলুন / মেমো যোগ করুন' : 'Take photo of market receipt with camera'}</span>
          </button>
        )}
      </div>

      {/* Note */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          📝 {lang === 'bn' ? 'মন্তব্য / রসিদ নোট (ঐচ্ছিক)' : 'Note / Remarks (Optional)'}
        </label>
        <textarea
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={lang === 'bn' ? 'ব্যয় সম্পর্কে কোনো বিশেষ নোট...' : 'Add any expense notes...'}
          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden transition-all"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-white font-semibold text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>💸</span>
          <span>{currentEdit ? (lang === 'bn' ? 'হিসাব আপডেট করুন' : 'Update Expense') : (lang === 'bn' ? 'ব্যয় সংরক্ষণ করুন' : 'Save Expense')}</span>
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
