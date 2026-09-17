import React from 'react';
import { CategoryBudget, DebtItem, FamilyMember, SavingsGoal, Transaction } from '../types';
import { formatCurrency, formatDate, getTodayDate } from '../utils/formatters';
import { Charts } from './Charts';

interface DashboardViewProps {
  transactions: Transaction[];
  members: FamilyMember[];
  budgets: CategoryBudget[];
  goals: SavingsGoal[];
  debts: DebtItem[];
  onNavigate: (tab: string) => void;
  onOpenIncomeModal: () => void;
  onOpenExpenseModal: () => void;
  currencySymbol?: string;
  lang?: 'bn' | 'en';
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  transactions,
  members,
  budgets,
  goals,
  debts,
  onNavigate,
  onOpenIncomeModal,
  onOpenExpenseModal,
  currencySymbol = '৳',
  lang = 'bn',
}) => {
  const todayStr = getTodayDate();
  const now = new Date();
  const thisMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // All-time totals
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const currentBalance = totalIncome - totalExpense;

  // Total Savings across goals
  const totalSavedInGoals = goals.reduce((sum, g) => sum + g.currentAmount, 0);

  // Today's summary
  const todayIncome = transactions
    .filter((t) => t.type === 'income' && t.date === todayStr)
    .reduce((sum, t) => sum + t.amount, 0);

  const todayExpense = transactions
    .filter((t) => t.type === 'expense' && t.date === todayStr)
    .reduce((sum, t) => sum + t.amount, 0);

  // This Month's summary
  const monthIncome = transactions
    .filter((t) => t.type === 'income' && t.date && t.date.startsWith(thisMonthPrefix))
    .reduce((sum, t) => sum + t.amount, 0);

  const monthExpense = transactions
    .filter((t) => t.type === 'expense' && t.date && t.date.startsWith(thisMonthPrefix))
    .reduce((sum, t) => sum + t.amount, 0);

  const monthBalance = monthIncome - monthExpense;

  // Receivables & Payables
  const totalReceivables = debts
    .filter((d) => d.type === 'receivable')
    .reduce((sum, d) => sum + Math.max(d.amount - d.paidAmount, 0), 0);

  const totalPayables = debts
    .filter((d) => d.type === 'payable')
    .reduce((sum, d) => sum + Math.max(d.amount - d.paidAmount, 0), 0);

  // Check for budget alerts
  const monthExpensesByCat: Record<string, number> = {};
  transactions
    .filter((t) => t.type === 'expense' && t.date && t.date.startsWith(thisMonthPrefix))
    .forEach((t) => {
      monthExpensesByCat[t.category] = (monthExpensesByCat[t.category] || 0) + t.amount;
    });

  const budgetAlerts = budgets
    .map((b) => {
      const spent = monthExpensesByCat[b.category] || 0;
      const pct = (spent / b.amount) * 100;
      return {
        category: b.category,
        budget: b.amount,
        spent,
        percent: pct,
        isOver: spent > b.amount,
        isNear: spent <= b.amount && pct >= 80,
      };
    })
    .filter((a) => a.isOver || a.isNear);

  // Latest 5 transactions
  const recentTransactions = [...transactions]
    .sort((a, b) => {
      const dateA = `${a.date} ${a.time || '00:00'}`;
      const dateB = `${b.date} ${b.time || '00:00'}`;
      return dateB.localeCompare(dateA);
    })
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Budget Warning Banner if any budget triggered */}
      {budgetAlerts.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex items-start justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <span className="text-2xl shrink-0">⚠️</span>
            <div>
              <h4 className="font-bold text-amber-900 dark:text-amber-200 text-sm">
                {lang === 'bn' ? 'বাজেট সতর্কতা সংকেত' : 'Budget Alerts'}
              </h4>
              <div className="text-xs text-amber-800 dark:text-amber-300 mt-1 space-y-0.5">
                {budgetAlerts.map((alt) => (
                  <p key={alt.category}>
                    • <b>{alt.category}</b>: {alt.isOver ? (lang === 'bn' ? 'বাজেট সীমা ছাড়িয়েছে!' : 'Budget exceeded!') : (lang === 'bn' ? 'বাজেটের ৮০% এর বেশি ব্যয় হয়েছে' : 'Over 80% spent')}
                    {' '}({formatCurrency(alt.spent, currencySymbol)} / {formatCurrency(alt.budget, currencySymbol)})
                  </p>
                ))}
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigate('budget')}
            className="text-xs font-bold text-amber-900 dark:text-amber-200 underline whitespace-nowrap cursor-pointer hover:opacity-80"
          >
            {lang === 'bn' ? 'বাজেট দেখুন →' : 'View Budgets →'}
          </button>
        </div>
      )}

      {/* Quick Action Floating / Hero Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={onOpenIncomeModal}
          className="p-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-semibold text-sm sm:text-base shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span className="text-xl">💰</span>
          <span>{lang === 'bn' ? 'আয় যোগ করুন' : 'Add Income'}</span>
        </button>

        <button
          onClick={onOpenExpenseModal}
          className="p-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-white font-semibold text-sm sm:text-base shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span className="text-xl">💸</span>
          <span>{lang === 'bn' ? 'ব্যয় যোগ করুন' : 'Add Expense'}</span>
        </button>

        <button
          onClick={() => onNavigate('transactions')}
          className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/80 active:scale-98 text-slate-800 dark:text-slate-100 font-semibold text-sm sm:text-base shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span className="text-xl">📋</span>
          <span>{lang === 'bn' ? 'সকল লেনদেন' : 'Transactions'}</span>
        </button>

        <button
          onClick={() => onNavigate('reports')}
          className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/80 active:scale-98 text-slate-800 dark:text-slate-100 font-semibold text-sm sm:text-base shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span className="text-xl">📊</span>
          <span>{lang === 'bn' ? 'রিপোর্ট ও প্রিন্ট' : 'Reports & Print'}</span>
        </button>
      </div>

      {/* Top Main Financial Summary Cards (Clean Minimalism Theme) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Income */}
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 p-4 sm:p-5 rounded-xl shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="text-xs text-emerald-700 dark:text-emerald-300 uppercase font-bold tracking-wider mb-1">
              {lang === 'bn' ? 'মোট আয় (Total Income)' : 'Total Income'}
            </p>
            <span className="text-lg">💰</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-emerald-800 dark:text-emerald-100">
            {formatCurrency(totalIncome, currencySymbol)}
          </h2>
          <div className="mt-2 text-xs text-emerald-700 dark:text-emerald-300 flex items-center justify-between font-medium">
            <span>{lang === 'bn' ? 'এই মাসে:' : 'This month:'}</span>
            <span className="font-bold text-emerald-800 dark:text-emerald-200">
              +{formatCurrency(monthIncome, currencySymbol)}
            </span>
          </div>
        </div>

        {/* Total Expense */}
        <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 p-4 sm:p-5 rounded-xl shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="text-xs text-rose-700 dark:text-rose-300 uppercase font-bold tracking-wider mb-1">
              {lang === 'bn' ? 'মোট ব্যয় (Total Expense)' : 'Total Expense'}
            </p>
            <span className="text-lg">💸</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-rose-800 dark:text-rose-100">
            {formatCurrency(totalExpense, currencySymbol)}
          </h2>
          <div className="mt-2 text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between font-medium">
            <span>{lang === 'bn' ? 'এই মাসে:' : 'This month:'}</span>
            <span className="font-bold text-rose-800 dark:text-rose-200">
              -{formatCurrency(monthExpense, currencySymbol)}
            </span>
          </div>
        </div>

        {/* Net Family Balance */}
        <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 p-4 sm:p-5 rounded-xl shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="text-xs text-indigo-700 dark:text-indigo-300 uppercase font-bold tracking-wider mb-1">
              {lang === 'bn' ? 'বর্তমান ব্যালেন্স (Balance)' : 'Current Balance'}
            </p>
            <span className="text-lg">💵</span>
          </div>
          <h2
            className={`text-2xl sm:text-3xl font-black ${
              currentBalance >= 0 ? 'text-indigo-800 dark:text-indigo-100' : 'text-rose-800 dark:text-rose-200'
            }`}
          >
            {formatCurrency(currentBalance, currencySymbol)}
          </h2>
          <div className="mt-2 text-xs text-indigo-700 dark:text-indigo-300 flex items-center justify-between font-medium">
            <span>{lang === 'bn' ? 'মাসিক স্থিতি:' : 'Month Net:'}</span>
            <span className={`font-bold ${monthBalance >= 0 ? 'text-indigo-800 dark:text-indigo-200' : 'text-rose-700'}`}>
              {formatCurrency(monthBalance, currencySymbol)}
            </span>
          </div>
        </div>

        {/* Savings & Debts Summary */}
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 p-4 sm:p-5 rounded-xl shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="text-xs text-amber-700 dark:text-amber-300 uppercase font-bold tracking-wider mb-1">
              {lang === 'bn' ? 'মোট সঞ্চয় (Savings)' : 'Total Savings'}
            </p>
            <span className="text-lg">🏦</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-amber-800 dark:text-amber-100">
            {formatCurrency(totalSavedInGoals, currencySymbol)}
          </h2>
          <div className="mt-2 text-[11px] text-amber-800 dark:text-amber-300 flex items-center justify-between font-medium">
            <span className="font-semibold">
              {lang === 'bn' ? 'পাওনা:' : 'Rec:'} {formatCurrency(totalReceivables, currencySymbol)}
            </span>
            <span className="font-semibold">
              {lang === 'bn' ? 'দেনা:' : 'Debt:'} {formatCurrency(totalPayables, currencySymbol)}
            </span>
          </div>
        </div>
      </div>

      {/* Today's Mini Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100">
          <span>📅</span>
          <span>
            {lang === 'bn' ? `আজকের হিসাব (${formatDate(todayStr, lang)}):` : `Today's Summary (${formatDate(todayStr, lang)}):`}
          </span>
        </div>
        <div className="flex items-center gap-5 font-medium text-xs sm:text-sm">
          <span className="text-emerald-700 dark:text-emerald-300 font-semibold">
            {lang === 'bn' ? 'আজকের আয়:' : 'Today Income:'} <b>+{formatCurrency(todayIncome, currencySymbol)}</b>
          </span>
          <span className="text-rose-700 dark:text-rose-300 font-semibold">
            {lang === 'bn' ? 'আজকের ব্যয়:' : 'Today Expense:'} <b>-{formatCurrency(todayExpense, currencySymbol)}</b>
          </span>
          <span
            className={`px-2.5 py-0.5 rounded-md font-semibold ${
              todayIncome - todayExpense >= 0
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
            }`}
          >
            {lang === 'bn' ? 'ব্যালেন্স:' : 'Net:'} {formatCurrency(todayIncome - todayExpense, currencySymbol)}
          </span>
        </div>
      </div>

      {/* Visual Graphical Charts Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>📈</span>
            <span>{lang === 'bn' ? 'আর্থিক বিশ্লেষণ ও চার্ট (Analytics)' : 'Financial Analytics & Charts'}</span>
          </h3>
          <button
            onClick={() => onNavigate('reports')}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
          >
            {lang === 'bn' ? 'পূর্ণাঙ্গ রিপোর্ট দেখুন →' : 'Full Reports →'}
          </button>
        </div>

        <Charts transactions={transactions} currencySymbol={currencySymbol} lang={lang} />
      </div>

      {/* Recent 5 Transactions */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
            <span>🕒</span>
            <span>{lang === 'bn' ? 'সর্বশেষ ৫টি লেনদেন' : 'Recent Transactions'}</span>
          </h3>
          <button
            onClick={() => onNavigate('transactions')}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
          >
            {lang === 'bn' ? 'সকল লেনদেন দেখুন (' : 'View All ('}
            {transactions.length}
            {lang === 'bn' ? ') →' : ') →'}
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            {lang === 'bn' ? 'এখনো কোনো লেনদেন যুক্ত করা হয়নি।' : 'No transactions recorded yet.'}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentTransactions.map((tx) => {
              const isIncome = tx.type === 'income';
              return (
                <div key={tx.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 ${
                        isIncome
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                          : 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {isIncome ? '💰' : '💸'}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {tx.category}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        👤 {tx.memberName} • 📅 {formatDate(tx.date, lang)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`font-black text-sm sm:text-base ${
                        isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {isIncome ? '+' : '-'}{formatCurrency(tx.amount, currencySymbol)}
                    </span>
                    <span className="block text-[11px] text-slate-400">
                      {tx.paymentMethod}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
