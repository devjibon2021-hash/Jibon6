import React, { useState } from 'react';
import { DebtItem, DebtStatus, DebtType } from '../types';
import { formatCurrency, formatDate, getTodayDate } from '../utils/formatters';

interface DebtManagerProps {
  debts: DebtItem[];
  onAddDebt: (debt: DebtItem) => void;
  onEditDebt: (debt: DebtItem) => void;
  onDeleteDebt: (debt: DebtItem) => void;
  currencySymbol?: string;
  lang?: 'bn' | 'en';
}

export const DebtManager: React.FC<DebtManagerProps> = ({
  debts,
  onAddDebt,
  onEditDebt,
  onDeleteDebt,
  currencySymbol = '৳',
  lang = 'bn',
}) => {
  const [activeTypeTab, setActiveTypeTab] = useState<DebtType>('receivable');
  const [isAdding, setIsAdding] = useState(false);
  const [editingDebt, setEditingDebt] = useState<DebtItem | null>(null);

  // Form states
  const [personName, setPersonName] = useState('');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(getTodayDate());
  const [dueDate, setDueDate] = useState('');
  const [note, setNote] = useState('');

  // Payment Recording Modal state
  const [paymentItem, setPaymentItem] = useState<DebtItem | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');

  const openAddForm = (type: DebtType) => {
    setActiveTypeTab(type);
    setPersonName('');
    setPhone('');
    setAmount('');
    setDate(getTodayDate());
    setDueDate('');
    setNote('');
    setEditingDebt(null);
    setIsAdding(true);
  };

  const openEditForm = (item: DebtItem) => {
    setEditingDebt(item);
    setActiveTypeTab(item.type);
    setPersonName(item.personName);
    setPhone(item.phone || '');
    setAmount(item.amount.toString());
    setDate(item.date);
    setDueDate(item.dueDate || '');
    setNote(item.note || '');
    setIsAdding(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmt = parseFloat(amount);
    if (!personName.trim() || isNaN(numAmt) || numAmt <= 0) return;

    if (editingDebt) {
      const remaining = numAmt - editingDebt.paidAmount;
      let status: DebtStatus = 'pending';
      if (editingDebt.paidAmount >= numAmt) {
        status = 'paid';
      } else if (editingDebt.paidAmount > 0) {
        status = 'partial';
      }

      onEditDebt({
        ...editingDebt,
        type: activeTypeTab,
        personName: personName.trim(),
        phone: phone.trim(),
        amount: numAmt,
        date,
        dueDate,
        note: note.trim() || undefined,
        status,
      });
    } else {
      onAddDebt({
        id: `debt-${Date.now()}`,
        type: activeTypeTab,
        personName: personName.trim(),
        phone: phone.trim(),
        amount: numAmt,
        paidAmount: 0,
        date,
        dueDate,
        note: note.trim() || undefined,
        status: 'pending',
        payments: [],
        createdAt: Date.now(),
      });
    }

    setIsAdding(false);
    setEditingDebt(null);
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentItem) return;
    const pAmt = parseFloat(paymentAmount);
    if (isNaN(pAmt) || pAmt <= 0) return;

    const newPaidAmount = (paymentItem.paidAmount || 0) + pAmt;
    let newStatus: DebtStatus = 'partial';
    if (newPaidAmount >= paymentItem.amount) {
      newStatus = 'paid';
    }

    const updatedPayments = [
      ...(paymentItem.payments || []),
      {
        id: `pay-${Date.now()}`,
        date: getTodayDate(),
        amount: pAmt,
        note: paymentNote.trim() || undefined,
      },
    ];

    onEditDebt({
      ...paymentItem,
      paidAmount: newPaidAmount,
      status: newStatus,
      payments: updatedPayments,
    });

    setPaymentItem(null);
    setPaymentAmount('');
    setPaymentNote('');
  };

  // Summaries
  const totalReceivables = debts
    .filter((d) => d.type === 'receivable')
    .reduce((sum, d) => sum + Math.max(d.amount - d.paidAmount, 0), 0);

  const totalPayables = debts
    .filter((d) => d.type === 'payable')
    .reduce((sum, d) => sum + Math.max(d.amount - d.paidAmount, 0), 0);

  const netBalance = totalReceivables - totalPayables;

  const currentList = debts.filter((d) => d.type === activeTypeTab);

  return (
    <div className="space-y-6">
      {/* Top Cards: Total Receivables vs Payables */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Receivables: আমি পাব */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {lang === 'bn' ? '🤝 আমি পাব (পাওনা)' : 'Receivable (Others owe us)'}
            </span>
            <span className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 text-base">
              📥
            </span>
          </div>
          <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
            {formatCurrency(totalReceivables, currencySymbol)}
          </p>
          <span className="text-xs text-slate-500 mt-1 block">
            {lang === 'bn' ? 'অন্যের কাছে পরিবারের বকেয়া পাওনা' : 'Pending money to collect'}
          </span>
        </div>

        {/* Payables: আমি দেব */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {lang === 'bn' ? '🤝 আমি দেব (দেনা)' : 'Payable (We owe others)'}
            </span>
            <span className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 text-base">
              📤
            </span>
          </div>
          <p className="text-2xl font-black text-rose-700 dark:text-rose-300">
            {formatCurrency(totalPayables, currencySymbol)}
          </p>
          <span className="text-xs text-slate-500 mt-1 block">
            {lang === 'bn' ? 'পরিবারের পক্ষ থেকে পরিশোধযোগ্য ধার' : 'Pending debts to pay'}
          </span>
        </div>

        {/* Net Debt/Receivable balance */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {lang === 'bn' ? 'নেট স্থিতি (Net)' : 'Net Debt/Credit'}
            </span>
            <span className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 text-base">
              ⚖️
            </span>
          </div>
          <p
            className={`text-2xl font-black ${
              netBalance >= 0 ? 'text-indigo-700 dark:text-indigo-300' : 'text-rose-700 dark:text-rose-300'
            }`}
          >
            {formatCurrency(netBalance, currencySymbol)}
          </p>
          <span className="text-xs text-slate-500 mt-1 block">
            {netBalance >= 0
              ? (lang === 'bn' ? 'পাওনা দেনার চেয়ে বেশি' : 'Net positive receivable')
              : (lang === 'bn' ? 'দেনা পাওনার চেয়ে বেশি' : 'Net negative debt')}
          </span>
        </div>
      </div>

      {/* Navigation Switcher & Add Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTypeTab('receivable')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              activeTypeTab === 'receivable'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            {lang === 'bn' ? '📥 আমি পাব (পাওনা)' : 'Receivables (I will get)'}
          </button>
          <button
            onClick={() => setActiveTypeTab('payable')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              activeTypeTab === 'payable'
                ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            {lang === 'bn' ? '📤 আমি দেব (দেনা)' : 'Payables (I will give)'}
          </button>
        </div>

        <button
          onClick={() => openAddForm(activeTypeTab)}
          className="px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>➕</span>
          <span>
            {activeTypeTab === 'receivable'
              ? (lang === 'bn' ? 'নতুন পাওনা যোগ করুন' : 'Add New Receivable')
              : (lang === 'bn' ? 'নতুন দেনা যোগ করুন' : 'Add New Debt')}
          </span>
        </button>
      </div>

      {/* Add / Edit Form */}
      {isAdding && (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-indigo-200 dark:border-indigo-800/60 shadow-xs">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg mb-4 flex items-center gap-2">
            <span>🤝</span>
            <span>
              {editingDebt
                ? (lang === 'bn' ? 'হিসাব সম্পাদনা করুন' : 'Edit Entry')
                : activeTypeTab === 'receivable'
                ? (lang === 'bn' ? 'নতুন পাওনা যোগ করুন (আমি পাব)' : 'Add Receivable (I will get)')
                : (lang === 'bn' ? 'নতুন দেনা যোগ করুন (আমি দেব)' : 'Add Debt (I will give)')}
            </span>
          </h3>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'bn' ? 'ব্যক্তির নাম' : 'Person Name'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder={lang === 'bn' ? 'যেমন: কামাল হোসেন' : 'e.g. Kamal Hossain'}
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'bn' ? 'মোবাইল নম্বর (ঐচ্ছিক)' : 'Mobile Phone (Optional)'}
                </label>
                <input
                  type="tel"
                  placeholder="017xxxxxxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'bn' ? 'পরিমাণ (টাকা)' : 'Amount (BDT)'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'bn' ? 'লেনদেনের তারিখ' : 'Date'}
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'bn' ? 'পরিশোধের শেষ তারিখ (Due Date)' : 'Due Date'}
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'bn' ? 'মন্তব্য / নোট' : 'Note'}
                </label>
                <input
                  type="text"
                  placeholder={lang === 'bn' ? 'কারণ বা বিবরণ...' : 'Details or reason...'}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm cursor-pointer transition-all"
              >
                {lang === 'bn' ? 'সংরক্ষণ করুন' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setEditingDebt(null);
                }}
                className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-all"
              >
                {lang === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Record Payment Modal */}
      {paymentItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md w-full">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg mb-2 flex items-center gap-2">
              <span>💳</span>
              <span>{lang === 'bn' ? 'টাকা গ্রহণ / পরিশোধ রেকর্ড করুন' : 'Record Payment'}</span>
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
              <b>{paymentItem.personName}</b>
            </p>
            <p className="text-xs text-slate-500 mb-4">
              {lang === 'bn' ? 'মূল পরিমাণ:' : 'Total:'} {formatCurrency(paymentItem.amount, currencySymbol)} |{' '}
              {lang === 'bn' ? 'পরিশোধিত:' : 'Paid:'} {formatCurrency(paymentItem.paidAmount, currencySymbol)} |{' '}
              {lang === 'bn' ? 'বকেয়া:' : 'Remaining:'}{' '}
              <b className="text-rose-600">
                {formatCurrency(paymentItem.amount - paymentItem.paidAmount, currencySymbol)}
              </b>
            </p>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'bn' ? 'পরিশোধিত অর্থের পরিমাণ (টাকা)' : 'Payment Amount (BDT)'}
                </label>
                <input
                  type="number"
                  min="1"
                  max={paymentItem.amount - paymentItem.paidAmount}
                  step="any"
                  placeholder="0.00"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'bn' ? 'পেমেন্ট নোট (যেমন: বিকাশ বা নগদ)' : 'Payment Note'}
                </label>
                <input
                  type="text"
                  placeholder={lang === 'bn' ? 'বিকাশ ট্রান্সফার, নগদ, ইত্যাদি...' : 'bKash, Cash, etc...'}
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm cursor-pointer transition-all"
                >
                  {lang === 'bn' ? 'পেমেন্ট নিশ্চিত করুন' : 'Confirm Payment'}
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentItem(null)}
                  className="py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Debt / Receivable Items List */}
      {currentList.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-12 text-center border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-4xl mb-2">🤝</p>
          <h4 className="font-bold text-slate-700 dark:text-slate-200 text-lg mb-1">
            {activeTypeTab === 'receivable'
              ? (lang === 'bn' ? 'কোনো পাওনা হিসাব নেই' : 'No receivables found')
              : (lang === 'bn' ? 'কোনো দেনা হিসাব নেই' : 'No debts found')}
          </h4>
          <p className="text-xs text-slate-500">
            {lang === 'bn' ? 'নতুন হিসাব যোগ করতে উপরের বাটনে চাপ দিন' : 'Click the button above to add an entry'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentList.map((d) => {
            const remaining = Math.max(d.amount - d.paidAmount, 0);
            const isPaid = d.status === 'paid' || remaining <= 0;
            const isPartial = d.status === 'partial' || (d.paidAmount > 0 && !isPaid);

            return (
              <div
                key={d.id}
                className={`bg-white dark:bg-slate-900 rounded-xl p-5 border transition-all flex flex-col justify-between shadow-xs ${
                  isPaid
                    ? 'border-emerald-200 dark:border-emerald-950 opacity-80'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg flex items-center gap-2">
                        <span>👤</span>
                        <span>{d.personName}</span>
                      </h3>
                      {d.phone && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          📞 {d.phone}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditForm(d)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                        title={lang === 'bn' ? 'সম্পাদনা' : 'Edit'}
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => onDeleteDebt(d)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer"
                        title={lang === 'bn' ? 'মুছে ফেলুন' : 'Delete'}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                        isPaid
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          : isPartial
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                          : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                      }`}
                    >
                      {isPaid
                        ? (lang === 'bn' ? 'সম্পূর্ণ পরিশোধ' : 'Fully Paid')
                        : isPartial
                        ? (lang === 'bn' ? 'আংশিক পরিশোধ' : 'Partially Paid')
                        : (lang === 'bn' ? 'বাকি' : 'Pending')}
                    </span>
                    <span className="text-xs text-slate-400">
                      📅 {formatDate(d.date, lang)}
                    </span>
                  </div>

                  {/* Financial Breakdown */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl space-y-1 text-xs mb-3">
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">
                        {lang === 'bn' ? 'মূল পরিমাণ:' : 'Original Amount:'}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {formatCurrency(d.amount, currencySymbol)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">
                        {lang === 'bn' ? 'পরিশোধিত:' : 'Paid:'}
                      </span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(d.paidAmount, currencySymbol)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-1">
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {lang === 'bn' ? 'বকেয়া বাকি:' : 'Remaining:'}
                      </span>
                      <span className="font-extrabold text-rose-600 dark:text-rose-400">
                        {formatCurrency(remaining, currencySymbol)}
                      </span>
                    </div>
                  </div>

                  {d.note && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 italic mb-3">
                      "{d.note}"
                    </p>
                  )}
                </div>

                {/* Bottom Bar with Due Date & Record Payment Button */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">
                    {d.dueDate ? (
                      <span>
                        ⏰ {lang === 'bn' ? 'পরিশোধ তারিখ:' : 'Due:'} <b>{formatDate(d.dueDate, lang)}</b>
                      </span>
                    ) : (
                      ''
                    )}
                  </span>

                  {!isPaid && (
                    <button
                      onClick={() => {
                        setPaymentItem(d);
                        setPaymentAmount('');
                        setPaymentNote('');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all cursor-pointer"
                    >
                      {lang === 'bn' ? 'পেমেন্ট দিন/নিন' : 'Record Pay'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
