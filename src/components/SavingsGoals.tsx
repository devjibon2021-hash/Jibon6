import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { SavingsGoal } from '../types';
import { formatCurrency, formatDate, getTodayDate } from '../utils/formatters';

interface SavingsGoalsProps {
  goals: SavingsGoal[];
  onAddGoal: (goal: SavingsGoal) => void;
  onEditGoal: (goal: SavingsGoal) => void;
  onDeleteGoal: (goal: SavingsGoal) => void;
  currencySymbol?: string;
  lang?: 'bn' | 'en';
}

export const SavingsGoals: React.FC<SavingsGoalsProps> = ({
  goals,
  onAddGoal,
  onEditGoal,
  onDeleteGoal,
  currencySymbol = '৳',
  lang = 'bn',
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [note, setNote] = useState('');

  // Deposit modal state
  const [depositGoal, setDepositGoal] = useState<SavingsGoal | null>(null);
  const [depositAmount, setDepositAmount] = useState('');

  const openAddForm = () => {
    setTitle('');
    setTargetAmount('');
    setCurrentAmount('0');
    setTargetDate('');
    setNote('');
    setEditingGoal(null);
    setIsAdding(true);
  };

  const openEditForm = (g: SavingsGoal) => {
    setEditingGoal(g);
    setTitle(g.title);
    setTargetAmount(g.targetAmount.toString());
    setCurrentAmount(g.currentAmount.toString());
    setTargetDate(g.targetDate);
    setNote(g.note || '');
    setIsAdding(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const tAmt = parseFloat(targetAmount);
    const cAmt = parseFloat(currentAmount) || 0;

    if (!title.trim() || isNaN(tAmt) || tAmt <= 0) return;

    if (editingGoal) {
      onEditGoal({
        ...editingGoal,
        title: title.trim(),
        targetAmount: tAmt,
        currentAmount: cAmt,
        targetDate: targetDate || getTodayDate(),
        note: note.trim() || undefined,
      });
    } else {
      onAddGoal({
        id: `sav-${Date.now()}`,
        title: title.trim(),
        targetAmount: tAmt,
        currentAmount: cAmt,
        targetDate: targetDate || getTodayDate(),
        note: note.trim() || undefined,
        createdAt: Date.now(),
      });
    }

    if (cAmt >= tAmt) {
      try {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      } catch {
        // ignore
      }
    }

    setIsAdding(false);
    setEditingGoal(null);
  };

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositGoal) return;
    const addAmt = parseFloat(depositAmount);
    if (isNaN(addAmt) || addAmt <= 0) return;

    const newCurrent = depositGoal.currentAmount + addAmt;
    onEditGoal({
      ...depositGoal,
      currentAmount: newCurrent,
    });

    if (newCurrent >= depositGoal.targetAmount && depositGoal.currentAmount < depositGoal.targetAmount) {
      try {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      } catch {
        // ignore
      }
    }

    setDepositGoal(null);
    setDepositAmount('');
  };

  // Overall statistics
  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header card with overall savings metrics */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>🏦</span>
              <span>{lang === 'bn' ? 'সঞ্চয় লক্ষ্য (Savings Goals)' : 'Savings Goals'}</span>
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {lang === 'bn'
                ? 'পরিবারের ভবিষ্যৎ পরিকল্পনা এবং সঞ্চয়ের অগ্রগতি পর্যবেক্ষণ'
                : 'Track family financial goals and progress'}
            </p>
          </div>

          <button
            onClick={openAddForm}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-semibold text-sm shadow-xs transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>➕</span>
            <span>{lang === 'bn' ? 'নতুন লক্ষ্য যোগ করুন' : 'Add New Goal'}</span>
          </button>
        </div>

        {/* Aggregate Goal Tracker */}
        <div className="bg-indigo-50/70 dark:bg-indigo-950/30 p-4 rounded-xl border border-indigo-200 dark:border-indigo-850">
          <div className="flex items-center justify-between text-sm mb-2 font-semibold">
            <span className="text-indigo-900 dark:text-indigo-300">
              {lang === 'bn' ? 'মোট লক্ষ্যমাত্রা সঞ্চিত:' : 'Total Saved Towards Goals:'}
            </span>
            <span className="text-indigo-900 dark:text-indigo-200 font-bold">
              {formatCurrency(totalSaved, currencySymbol)} / {formatCurrency(totalTarget, currencySymbol)}
              {' '}({overallProgress.toFixed(1)}%)
            </span>
          </div>

          <div className="w-full bg-indigo-200/60 dark:bg-indigo-900/60 h-3 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(overallProgress, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Add / Edit Goal Box */}
      {isAdding && (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-indigo-200 dark:border-indigo-800/60 shadow-xs">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg mb-4 flex items-center gap-2">
            <span>🎯</span>
            <span>
              {editingGoal
                ? (lang === 'bn' ? 'সঞ্চয় লক্ষ্য সম্পাদনা করুন' : 'Edit Savings Goal')
                : (lang === 'bn' ? 'নতুন সঞ্চয় লক্ষ্য তৈরি করুন' : 'Create New Savings Goal')}
            </span>
          </h3>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'bn' ? 'লক্ষ্যের নাম (যেমন: নতুন মোবাইল, বাৎসরিক ভ্রমণ)' : 'Goal Title'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder={lang === 'bn' ? 'যেমন: নতুন ফ্রিজ কেনা...' : 'e.g. New Refrigerator...'}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'bn' ? 'টার্গেট পরিমাণ (টাকা)' : 'Target Amount (BDT)'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  placeholder="50000"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'bn' ? 'বর্তমান সঞ্চিত অর্থ (টাকা)' : 'Current Saved Amount (BDT)'}
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0"
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'bn' ? 'টার্গেট তারিখ' : 'Target Date'}
                </label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'bn' ? 'মন্তব্য / বিবরণ' : 'Notes'}
                </label>
                <input
                  type="text"
                  placeholder={lang === 'bn' ? 'ঐচ্ছিক বিবরণ...' : 'Optional notes...'}
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
                {lang === 'bn' ? 'সংরক্ষণ করুন' : 'Save Goal'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setEditingGoal(null);
                }}
                className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-all"
              >
                {lang === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Quick Deposit Popup Modal */}
      {depositGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md w-full">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg mb-2 flex items-center gap-2">
              <span>💰</span>
              <span>{lang === 'bn' ? 'সঞ্চয় জমা দিন' : 'Deposit to Goal'}</span>
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              <b>{depositGoal.title}</b>-এ অর্থ জমা দিন।
            </p>

            <form onSubmit={handleDepositSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'bn' ? 'জমার পরিমাণ (টাকা)' : 'Deposit Amount (BDT)'}
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  placeholder="0.00"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  autoFocus
                  required
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm cursor-pointer transition-all"
                >
                  {lang === 'bn' ? 'জমা নিশ্চিত করুন' : 'Confirm Deposit'}
                </button>
                <button
                  type="button"
                  onClick={() => setDepositGoal(null)}
                  className="py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.map((g) => {
          const progress = g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0;
          const isAchieved = g.currentAmount >= g.targetAmount;
          const remaining = Math.max(g.targetAmount - g.currentAmount, 0);

          return (
            <div
              key={g.id}
              className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg flex items-center gap-2">
                      <span>🎯</span>
                      <span>{g.title}</span>
                    </h3>
                    {g.note && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {g.note}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditForm(g)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                      title={lang === 'bn' ? 'সম্পাদনা' : 'Edit'}
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => onDeleteGoal(g)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer"
                      title={lang === 'bn' ? 'মুছে ফেলুন' : 'Delete'}
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Progress bar and metrics */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">
                      {lang === 'bn' ? 'সঞ্চিত:' : 'Saved:'}{' '}
                      <b className="text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(g.currentAmount, currencySymbol)}
                      </b>
                    </span>
                    <span className="text-slate-600 dark:text-slate-400">
                      {lang === 'bn' ? 'টার্গেট:' : 'Target:'}{' '}
                      <b className="text-slate-900 dark:text-slate-100">
                        {formatCurrency(g.targetAmount, currencySymbol)}
                      </b>
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-3 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isAchieved ? 'bg-emerald-500' : 'bg-indigo-600'
                      }`}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className={isAchieved ? 'text-emerald-600 font-bold' : 'text-indigo-600 font-bold'}>
                      {progress.toFixed(1)}% {lang === 'bn' ? 'অর্জিত' : 'Achieved'}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      {isAchieved
                        ? (lang === 'bn' ? '🎉 লক্ষ্য সম্পূর্ণ হয়েছে!' : '🎉 Goal Achieved!')
                        : `${formatCurrency(remaining, currencySymbol)} ${lang === 'bn' ? 'বাকি' : 'remaining'}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
                <span className="text-slate-500 dark:text-slate-400">
                  {g.targetDate ? `📅 ${formatDate(g.targetDate, lang)}` : ''}
                </span>

                <button
                  onClick={() => {
                    setDepositGoal(g);
                    setDepositAmount('');
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-semibold text-xs transition-all flex items-center gap-1 cursor-pointer"
                >
                  <span>💵</span>
                  <span>{lang === 'bn' ? 'সঞ্চয় জমা করুন' : 'Add Savings'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
