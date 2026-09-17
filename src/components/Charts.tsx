import React, { useState } from 'react';
import { Transaction } from '../types';
import { formatCurrency, formatMonthYear } from '../utils/formatters';

interface ChartsProps {
  transactions: Transaction[];
  currencySymbol?: string;
  lang?: 'bn' | 'en';
}

export const Charts: React.FC<ChartsProps> = ({
  transactions,
  currencySymbol = '৳',
  lang = 'bn',
}) => {
  const [activeTab, setActiveTab] = useState<'incomeExpense' | 'category' | 'trend'>('incomeExpense');
  const [hoveredBar, setHoveredBar] = useState<string | null>(null);

  // Group by Month (Last 6 months)
  const now = new Date();
  const monthsList: { key: string; label: string; year: number; month: number; income: number; expense: number }[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const key = `${y}-${String(m).padStart(2, '0')}`;
    const label = formatMonthYear(y, m, lang);
    monthsList.push({ key, label, year: y, month: m, income: 0, expense: 0 });
  }

  transactions.forEach((tx) => {
    if (!tx.date) return;
    const key = tx.date.substring(0, 7);
    const found = monthsList.find((m) => m.key === key);
    if (found) {
      if (tx.type === 'income') {
        found.income += tx.amount;
      } else {
        found.expense += tx.amount;
      }
    }
  });

  // Maximum value for scaling bar charts
  const maxMonthlyVal = Math.max(...monthsList.map((m) => Math.max(m.income, m.expense)), 1000);

  // Category breakdown for current month (or all transactions if current month is small)
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentMonthExpenses = transactions.filter(
    (tx) => tx.type === 'expense' && tx.date.startsWith(currentMonthKey)
  );
  // Fallback to all expenses if current month has no expenses yet
  const expensePool = currentMonthExpenses.length > 0 ? currentMonthExpenses : transactions.filter((t) => t.type === 'expense');

  const categoryMap: Record<string, number> = {};
  let totalExpenseForCategories = 0;
  expensePool.forEach((tx) => {
    categoryMap[tx.category] = (categoryMap[tx.category] || 0) + tx.amount;
    totalExpenseForCategories += tx.amount;
  });

  const categoryList = Object.entries(categoryMap)
    .map(([cat, amt]) => ({
      category: cat,
      amount: amt,
      percentage: totalExpenseForCategories > 0 ? (amt / totalExpenseForCategories) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const colors = [
    '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
    '#06b6d4', '#ec4899', '#f97316', '#84cc16', '#6366f1'
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
      {/* Tab Switcher */}
      <div className="flex items-center justify-between flex-wrap gap-2 mb-6 border-b border-slate-100 dark:border-slate-800 pb-3">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base sm:text-lg flex items-center gap-2">
          <span>📊</span>
          <span>{lang === 'bn' ? 'আর্থিক অ্যানালিটিক্স ও চার্ট' : 'Financial Analytics & Charts'}</span>
        </h3>
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs sm:text-sm font-medium">
          <button
            onClick={() => setActiveTab('incomeExpense')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              activeTab === 'incomeExpense'
                ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-2xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            {lang === 'bn' ? 'আয় বনাম ব্যয়' : 'Income vs Expense'}
          </button>
          <button
            onClick={() => setActiveTab('category')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              activeTab === 'category'
                ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-2xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            {lang === 'bn' ? 'ব্যয়ের খাত' : 'Category Share'}
          </button>
          <button
            onClick={() => setActiveTab('trend')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              activeTab === 'trend'
                ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-2xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            {lang === 'bn' ? 'ব্যালেন্স ট্রেন্ড' : 'Monthly Balance'}
          </button>
        </div>
      </div>

      {/* 1. Income vs Expense Bar Chart */}
      {activeTab === 'incomeExpense' && (
        <div>
          <div className="flex items-center justify-end gap-5 text-xs mb-4 text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-emerald-500 inline-block"></span>
              <span>{lang === 'bn' ? 'আয় (Income)' : 'Income'}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-rose-500 inline-block"></span>
              <span>{lang === 'bn' ? 'ব্যয় (Expense)' : 'Expense'}</span>
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full flex items-end justify-between gap-2 sm:gap-4 pt-6 pb-2 border-b border-slate-100 dark:border-slate-800">
            {monthsList.map((m) => {
              const incomeHeight = Math.round((m.income / maxMonthlyVal) * 100);
              const expenseHeight = Math.round((m.expense / maxMonthlyVal) * 100);
              const isHovered = hoveredBar === m.key;

              return (
                <div
                  key={m.key}
                  className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
                  onMouseEnter={() => setHoveredBar(m.key)}
                  onMouseLeave={() => setHoveredBar(null)}
                >
                  {/* Tooltip */}
                  {isHovered && (
                    <div className="absolute -top-12 z-20 bg-slate-900 text-white text-xs py-1.5 px-2.5 rounded-lg shadow-lg pointer-events-none whitespace-nowrap">
                      <p className="font-semibold text-emerald-400">
                        {lang === 'bn' ? 'আয়:' : 'Income:'} {formatCurrency(m.income, currencySymbol)}
                      </p>
                      <p className="font-semibold text-rose-400">
                        {lang === 'bn' ? 'ব্যয়:' : 'Expense:'} {formatCurrency(m.expense, currencySymbol)}
                      </p>
                    </div>
                  )}

                  {/* Bars side by side */}
                  <div className="w-full flex items-end justify-center gap-1 sm:gap-2 h-full max-h-52">
                    <div
                      className="w-1/2 max-w-[28px] bg-emerald-500 hover:bg-emerald-400 rounded-t-md transition-all duration-300 relative"
                      style={{ height: `${Math.max(incomeHeight, 4)}%` }}
                    />
                    <div
                      className="w-1/2 max-w-[28px] bg-rose-500 hover:bg-rose-400 rounded-t-md transition-all duration-300 relative"
                      style={{ height: `${Math.max(expenseHeight, 4)}%` }}
                    />
                  </div>

                  {/* X-axis Label */}
                  <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-2 text-center truncate max-w-[65px]">
                    {m.label.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Expense Category Breakdown */}
      {activeTab === 'category' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span>{lang === 'bn' ? 'খাত ভিত্তিক মোট ব্যয়:' : 'Category Expense Distribution:'}</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {formatCurrency(totalExpenseForCategories, currencySymbol)}
            </span>
          </div>

          {categoryList.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              {lang === 'bn' ? 'এখনো কোনো ব্যয়ের হিসাব যোগ করা হয়নি' : 'No expenses recorded yet'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categoryList.slice(0, 8).map((item, idx) => {
                const color = colors[idx % colors.length];
                return (
                  <div
                    key={item.category}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800"
                  >
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="font-medium text-slate-700 dark:text-slate-200 truncate mr-2">
                        {item.category}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-slate-100 shrink-0">
                        {formatCurrency(item.amount, currencySymbol)}
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden flex">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${item.percentage}%`, backgroundColor: color }}
                      />
                    </div>
                    <div className="flex justify-end mt-1">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        {item.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. Monthly Balance Trend */}
      {activeTab === 'trend' && (
        <div>
          <div className="h-64 sm:h-72 w-full flex items-end justify-between gap-3 pt-6 pb-2 border-b border-slate-100 dark:border-slate-800">
            {monthsList.map((m) => {
              const balance = m.income - m.expense;
              const isPositive = balance >= 0;
              const absVal = Math.abs(balance);
              const barHeight = Math.min(Math.round((absVal / maxMonthlyVal) * 100), 100);

              return (
                <div key={m.key} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                  <div className="w-full flex flex-col items-center justify-end h-full max-h-52">
                    <div className="text-[10px] font-bold mb-1 text-center truncate max-w-[65px] text-slate-700 dark:text-slate-300">
                      {isPositive ? '+' : '-'}{formatCurrency(absVal, currencySymbol).replace(currencySymbol, '').trim()}
                    </div>
                    <div
                      className={`w-full max-w-[36px] rounded-t-lg transition-all duration-300 ${
                        isPositive ? 'bg-emerald-500 hover:bg-emerald-400' : 'bg-amber-500 hover:bg-amber-400'
                      }`}
                      style={{ height: `${Math.max(barHeight, 6)}%` }}
                    />
                  </div>
                  <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-2 text-center truncate max-w-[65px]">
                    {m.label.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-slate-500 text-center mt-3">
            {lang === 'bn'
              ? 'সবুজ বার = উদ্বৃত্ত/সঞ্চয় (Surplus), হলুদ বার = ঘাটতি (Deficit)'
              : 'Green Bar = Surplus/Savings, Amber Bar = Deficit'}
          </p>
        </div>
      )}
    </div>
  );
};
