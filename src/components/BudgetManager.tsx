import React, { useState } from 'react';
import { CategoryBudget, Transaction } from '../types';
import { EXPENSE_CATEGORIES } from '../utils/translations';
import { formatCurrency, formatMonthYear } from '../utils/formatters';

interface BudgetManagerProps {
  budgets: CategoryBudget[];
  transactions: Transaction[];
  onSaveBudget: (budget: CategoryBudget) => void;
  onDeleteBudget: (category: string) => void;
  currencySymbol?: string;
  lang?: 'bn' | 'en';
}

export const BudgetManager: React.FC<BudgetManagerProps> = ({
  budgets,
  transactions,
  onSaveBudget,
  onDeleteBudget,
  currencySymbol = '৳',
  lang = 'bn',
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(EXPENSE_CATEGORIES[0].bn);
  const [budgetAmount, setBudgetAmount] = useState('');
  const [selectedMonthOffset, setSelectedMonthOffset] = useState(0); // 0 = current month

  // Determine current viewing month
  const targetDate = new Date();
  targetDate.setMonth(targetDate.getMonth() - selectedMonthOffset);
  const monthKey = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
  const monthLabel = formatMonthYear(targetDate.getFullYear(), targetDate.getMonth() + 1, lang);

  // Filter expenses for this month
  const monthExpenses = transactions.filter(
    (t) => t.type === 'expense' && t.date && t.date.startsWith(monthKey)
  );

  // Calculate spending per category
  const spendingMap: Record<string, number> = {};
  monthExpenses.forEach((t) => {
    spendingMap[t.category] = (spendingMap[t.category] || 0) + t.amount;
  });

  // Calculate overall budget vs expense
  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpentInBudgetedCategories = budgets.reduce(
    (sum, b) => sum + (spendingMap[b.category] || 0),
    0
  );
  const overallBudgetProgress = totalBudget > 0 ? (totalSpentInBudgetedCategories / totalBudget) * 100 : 0;

  const handleOpenSetBudget = (catName?: string, currentAmt?: number) => {
    setSelectedCategory(catName || EXPENSE_CATEGORIES[0].bn);
    setBudgetAmount(currentAmt ? currentAmt.toString() : '');
    setIsEditing(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(budgetAmount);
    if (isNaN(amt) || amt <= 0) return;

    onSaveBudget({
      category: selectedCategory,
      amount: amt,
    });
    setIsEditing(false);
    setBudgetAmount('');
  };

  return (
    <div className="space-y-6">
      {/* Header card with overall budget meter */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>💰</span>
              <span>{lang === 'bn' ? 'মাসিক ক্যাটাগরি বাজেট' : 'Monthly Category Budgets'}</span>
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {lang === 'bn' ? `চলতি মাস: ${monthLabel}` : `Viewing: ${monthLabel}`}
            </p>
          </div>

          <button
            onClick={() => handleOpenSetBudget()}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-semibold text-sm shadow-xs transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>➕</span>
            <span>{lang === 'bn' ? 'বাজেট সেট করুন' : 'Set Category Budget'}</span>
          </button>
        </div>

        {/* Overall Budget Progress */}
        <div className="bg-slate-50 dark:bg-slate-800/70 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between text-sm mb-2 font-semibold">
            <span className="text-slate-700 dark:text-slate-300">
              {lang === 'bn' ? 'সার্বিক বাজেট ব্যবহার:' : 'Overall Budget Usage:'}
            </span>
            <span className="text-slate-900 dark:text-slate-100">
              {formatCurrency(totalSpentInBudgetedCategories, currencySymbol)} / {formatCurrency(totalBudget, currencySymbol)}
              {' '}({overallBudgetProgress.toFixed(1)}%)
            </span>
          </div>

          <div className="w-full bg-slate-200 dark:bg-slate-700 h-3 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                overallBudgetProgress > 100
                  ? 'bg-rose-500'
                  : overallBudgetProgress > 80
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(overallBudgetProgress, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Set / Edit Budget Dialog/Card */}
      {isEditing && (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-indigo-200 dark:border-indigo-800/60 shadow-xs">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg mb-4 flex items-center gap-2">
            <span>⚙️</span>
            <span>{lang === 'bn' ? 'ক্যাটাগরি বাজেট নির্ধারণ করুন' : 'Set Category Budget Limit'}</span>
          </h3>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'bn' ? 'ব্যয়ের খাত (Category)' : 'Category'}
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.bn}>
                      {c.bn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'bn' ? 'মাসিক বাজেট সীমা (টাকা)' : 'Monthly Budget Limit (BDT)'}
                </label>
                <input
                  type="number"
                  min="100"
                  step="100"
                  placeholder="e.g. 10000"
                  value={budgetAmount}
                  onChange={(e) => setBudgetAmount(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm cursor-pointer transition-all"
              >
                {lang === 'bn' ? 'সংরক্ষণ করুন' : 'Save Budget'}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-all"
              >
                {lang === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Budget Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {budgets.map((b) => {
          const spent = spendingMap[b.category] || 0;
          const percent = (spent / b.amount) * 100;
          const isOver = spent > b.amount;
          const isNear = !isOver && percent >= 80;
          const remaining = b.amount - spent;

          return (
            <div
              key={b.category}
              className={`rounded-xl p-5 border transition-all ${
                isOver
                  ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 shadow-xs'
                  : isNear
                  ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 shadow-xs'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-1.5">
                  <span>{b.category}</span>
                </h4>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenSetBudget(b.category, b.amount)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                    title={lang === 'bn' ? 'বাজেট পরিবর্তন' : 'Edit Budget'}
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => onDeleteBudget(b.category)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950/50 transition-all cursor-pointer"
                    title={lang === 'bn' ? 'মুছে ফেলুন' : 'Delete'}
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* Budget amount and spent */}
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-slate-600 dark:text-slate-300">
                  {lang === 'bn' ? 'ব্যয় হয়েছে:' : 'Spent:'}{' '}
                  <b className={isOver ? 'text-rose-600' : 'text-slate-900 dark:text-slate-100'}>
                    {formatCurrency(spent, currencySymbol)}
                  </b>
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  {lang === 'bn' ? 'বাজেট:' : 'Budget:'} <b>{formatCurrency(b.amount, currencySymbol)}</b>
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-3 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isOver ? 'bg-rose-600' : isNear ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(percent, 100)}%` }}
                />
              </div>

              {/* Status Message */}
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-500 dark:text-slate-400">
                  {percent.toFixed(1)}% {lang === 'bn' ? 'ব্যয়িত' : 'used'}
                </span>
                <span className={isOver ? 'text-rose-600 font-bold' : 'text-emerald-600 dark:text-emerald-400 font-bold'}>
                  {isOver
                    ? `${formatCurrency(Math.abs(remaining), currencySymbol)} ${lang === 'bn' ? 'বাজেট অতিরিক্ত' : 'over budget'}`
                    : `${formatCurrency(remaining, currencySymbol)} ${lang === 'bn' ? 'অবশিষ্ট' : 'remaining'}`}
                </span>
              </div>

              {/* Alert notification message */}
              {isOver && (
                <div className="mt-3 p-2 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 text-xs font-bold flex items-center gap-1.5">
                  <span>⚠️</span>
                  <span>{lang === 'bn' ? 'আপনার নির্ধারিত বাজেট অতিক্রম করেছে।' : 'Budget limit exceeded for this category.'}</span>
                </div>
              )}
              {isNear && (
                <div className="mt-3 p-2 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 text-xs font-bold flex items-center gap-1.5">
                  <span>⚠️</span>
                  <span>{lang === 'bn' ? 'সতর্কতা: বাজেটের ৮০% এর বেশি ব্যয় হয়েছে' : 'Warning: Over 80% of budget reached'}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
