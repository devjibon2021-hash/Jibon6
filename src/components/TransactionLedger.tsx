import React, { useState, useMemo } from 'react';
import { FamilyMember, Transaction } from '../types';
import { formatCurrency, formatDate, exportTransactionsToCSV, getTodayDate } from '../utils/formatters';
import { PAYMENT_METHODS } from '../utils/translations';
import { ReceiptViewerModal } from './ReceiptViewerModal';

interface TransactionLedgerProps {
  transactions: Transaction[];
  members: FamilyMember[];
  onEdit: (tx: Transaction) => void;
  onDelete: (tx: Transaction) => void;
  currencySymbol?: string;
  lang?: 'bn' | 'en';
}

type DateFilter = 'all' | 'today' | 'yesterday' | 'this_week' | 'this_month' | 'last_month' | 'this_year' | 'custom';

export const TransactionLedger: React.FC<TransactionLedgerProps> = ({
  transactions,
  members,
  onEdit,
  onDelete,
  currencySymbol = '৳',
  lang = 'bn',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [memberFilter, setMemberFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [onlyWithReceipt, setOnlyWithReceipt] = useState(false);
  const [viewingReceiptTx, setViewingReceiptTx] = useState<Transaction | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Extract unique categories from current transactions
  const uniqueCategories = useMemo(() => {
    const cats = new Set<string>();
    transactions.forEach((t) => {
      if (t.category) cats.add(t.category);
    });
    return Array.from(cats);
  }, [transactions]);

  // Filter calculation
  const filteredTransactions = useMemo(() => {
    const todayStr = getTodayDate();
    const today = new Date();

    // Yesterday
    const yestDate = new Date(today);
    yestDate.setDate(today.getDate() - 1);
    const yesterdayStr = `${yestDate.getFullYear()}-${String(yestDate.getMonth() + 1).padStart(2, '0')}-${String(yestDate.getDate()).padStart(2, '0')}`;

    // This week (last 7 days)
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    // This month
    const thisMonthPrefix = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    // Last month
    const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthPrefix = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;

    // This year
    const thisYearPrefix = `${today.getFullYear()}`;

    return transactions.filter((t) => {
      // Type Filter
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;

      // Member Filter
      if (memberFilter !== 'all' && t.memberId !== memberFilter) return false;

      // Category Filter
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;

      // Payment Filter
      if (paymentFilter !== 'all' && t.paymentMethod !== paymentFilter) return false;

      // Receipt Filter
      if (onlyWithReceipt && !t.receiptImage) return false;

      // Date Filter
      if (dateFilter === 'today' && t.date !== todayStr) return false;
      if (dateFilter === 'yesterday' && t.date !== yesterdayStr) return false;
      if (dateFilter === 'this_week') {
        const txDate = new Date(t.date);
        if (txDate < sevenDaysAgo) return false;
      }
      if (dateFilter === 'this_month' && !t.date.startsWith(thisMonthPrefix)) return false;
      if (dateFilter === 'last_month' && !t.date.startsWith(lastMonthPrefix)) return false;
      if (dateFilter === 'this_year' && !t.date.startsWith(thisYearPrefix)) return false;
      if (dateFilter === 'custom') {
        if (customStartDate && t.date < customStartDate) return false;
        if (customEndDate && t.date > customEndDate) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchId = (t.id || '').toLowerCase().includes(q);
        const matchMember = (t.memberName || '').toLowerCase().includes(q);
        const matchCategory = (t.category || '').toLowerCase().includes(q);
        const matchSub = (t.subcategory || '').toLowerCase().includes(q);
        const matchNote = (t.note || '').toLowerCase().includes(q);
        const matchAmount = t.amount.toString().includes(q);

        if (!matchId && !matchMember && !matchCategory && !matchSub && !matchNote && !matchAmount) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      // Sort newest first by date and time
      const dateTimeA = `${a.date} ${a.time || '00:00'}`;
      const dateTimeB = `${b.date} ${b.time || '00:00'}`;
      return dateTimeB.localeCompare(dateTimeA);
    });
  }, [
    transactions,
    typeFilter,
    memberFilter,
    categoryFilter,
    paymentFilter,
    onlyWithReceipt,
    dateFilter,
    customStartDate,
    customEndDate,
    searchQuery,
  ]);

  // Totals for filtered records
  const totalFilteredIncome = filteredTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalFilteredExpense = filteredTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netFilteredBalance = totalFilteredIncome - totalFilteredExpense;

  const resetAllFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setDateFilter('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setMemberFilter('all');
    setCategoryFilter('all');
    setPaymentFilter('all');
    setOnlyWithReceipt(false);
  };

  const hasActiveFilters =
    typeFilter !== 'all' ||
    dateFilter !== 'all' ||
    memberFilter !== 'all' ||
    categoryFilter !== 'all' ||
    paymentFilter !== 'all' ||
    onlyWithReceipt ||
    searchQuery.trim() !== '';

  return (
    <div className="space-y-4">
      {/* Top Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              🔍
            </span>
            <input
              type="text"
              placeholder={lang === 'bn' ? 'আইডি, সদস্য, খাত, বিবরণ বা টাকা দিয়ে খুঁজুন...' : 'Search by ID, member, category, note, amount...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Filter Toggle, Receipt Filter & CSV Export */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOnlyWithReceipt(!onlyWithReceipt)}
              className={`px-3 py-2.5 rounded-xl border text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                onlyWithReceipt
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
              title={lang === 'bn' ? 'শুধুমাত্র যেসব লেনদেনে রশিদের ছবি আছে' : 'Transactions with receipt only'}
            >
              <span>🧾</span>
              <span className="hidden sm:inline">{lang === 'bn' ? 'শুধু রশিদ' : 'Receipts'}</span>
            </button>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                showFilters || hasActiveFilters
                  ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-700 dark:text-indigo-300 font-semibold'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <span>⚙️</span>
              <span className="hidden sm:inline">{lang === 'bn' ? 'ফিল্টার' : 'Filters'}</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              )}
            </button>

            <button
              onClick={() => exportTransactionsToCSV(filteredTransactions, currencySymbol)}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-700 text-slate-700 dark:text-slate-300 text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer"
              title="Download Excel / CSV"
            >
              <span>📥</span>
              <span className="hidden sm:inline">{lang === 'bn' ? 'CSV এক্সপোর্ট' : 'CSV Export'}</span>
            </button>
          </div>
        </div>

        {/* Expandable Advanced Filters */}
        {showFilters && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs sm:text-sm">
            {/* Type */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'bn' ? 'লেনদেনের ধরন' : 'Transaction Type'}
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
              >
                <option value="all">{lang === 'bn' ? 'সব ধরন (আয় ও ব্যয়)' : 'All Types'}</option>
                <option value="income">{lang === 'bn' ? 'শুধুমাত্র আয় (Income)' : 'Income Only'}</option>
                <option value="expense">{lang === 'bn' ? 'শুধুমাত্র ব্যয় (Expense)' : 'Expense Only'}</option>
              </select>
            </div>

            {/* Date Preset */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'bn' ? 'সময়কাল' : 'Time Period'}
              </label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
              >
                <option value="all">{lang === 'bn' ? 'সর্বকালের হিসাব (All)' : 'All Time'}</option>
                <option value="today">{lang === 'bn' ? 'আজ (Today)' : 'Today'}</option>
                <option value="yesterday">{lang === 'bn' ? 'গতকাল (Yesterday)' : 'Yesterday'}</option>
                <option value="this_week">{lang === 'bn' ? 'এই সপ্তাহ (This Week)' : 'This Week'}</option>
                <option value="this_month">{lang === 'bn' ? 'এই মাস (This Month)' : 'This Month'}</option>
                <option value="last_month">{lang === 'bn' ? 'গত মাস (Last Month)' : 'Last Month'}</option>
                <option value="this_year">{lang === 'bn' ? 'এই বছর (This Year)' : 'This Year'}</option>
                <option value="custom">{lang === 'bn' ? 'কাস্টম তারিখ রেঞ্জ' : 'Custom Range'}</option>
              </select>
            </div>

            {/* Member */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'bn' ? 'সদস্য' : 'Member'}
              </label>
              <select
                value={memberFilter}
                onChange={(e) => setMemberFilter(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
              >
                <option value="all">{lang === 'bn' ? 'সব সদস্য' : 'All Members'}</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'bn' ? 'খাত (Category)' : 'Category'}
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
              >
                <option value="all">{lang === 'bn' ? 'সব খাত' : 'All Categories'}</option>
                {uniqueCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Date Inputs if 'custom' */}
            {dateFilter === 'custom' && (
              <div className="sm:col-span-2 lg:col-span-4 flex flex-wrap items-center gap-3 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl">
                <span className="font-semibold text-slate-600 dark:text-slate-300">
                  {lang === 'bn' ? 'হতে:' : 'From:'}
                </span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="p-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                />
                <span className="font-semibold text-slate-600 dark:text-slate-300">
                  {lang === 'bn' ? 'পর্যন্ত:' : 'To:'}
                </span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="p-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                />
              </div>
            )}

            {/* Reset Button */}
            {hasActiveFilters && (
              <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
                <button
                  onClick={resetAllFilters}
                  className="text-rose-600 dark:text-rose-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>↺</span>
                  <span>{lang === 'bn' ? 'সব ফিল্টার বাতিল করুন' : 'Reset All Filters'}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Filtered Summary Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl">
          <span className="text-slate-600 dark:text-slate-400 font-medium">
            {lang === 'bn' ? 'মোট ফলাফল:' : 'Results:'}{' '}
            <b className="text-slate-900 dark:text-slate-100">{filteredTransactions.length}</b>{' '}
            {lang === 'bn' ? 'টি লেনদেন' : 'transactions'}
          </span>
          <div className="flex items-center gap-4 font-semibold">
            <span className="text-emerald-600 dark:text-emerald-400">
              +{formatCurrency(totalFilteredIncome, currencySymbol)}
            </span>
            <span className="text-rose-600 dark:text-rose-400">
              -{formatCurrency(totalFilteredExpense, currencySymbol)}
            </span>
            <span className={`px-2 py-0.5 rounded-md ${
              netFilteredBalance >= 0
                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
            }`}>
              {lang === 'bn' ? 'ব্যালেন্স: ' : 'Net: '}
              {formatCurrency(netFilteredBalance, currencySymbol)}
            </span>
          </div>
        </div>
      </div>

      {/* Transactions List / Table */}
      {filteredTransactions.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-12 text-center border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-4xl mb-3">📋</p>
          <h4 className="font-bold text-slate-700 dark:text-slate-200 text-lg mb-1">
            {lang === 'bn' ? 'কোনো লেনদেন পাওয়া যায়নি' : 'No transactions found'}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {hasActiveFilters
              ? (lang === 'bn' ? 'ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন' : 'Try adjusting your filters')
              : (lang === 'bn' ? 'নতুন আয় বা ব্যয় যোগ করে শুরু করুন' : 'Add a new income or expense to get started')}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredTransactions.map((tx) => {
            const isIncome = tx.type === 'income';
            const methodObj = PAYMENT_METHODS.find((p) => p.id === tx.paymentMethod);
            const methodLabel = methodObj ? (lang === 'bn' ? methodObj.bn.split(' ')[0] : methodObj.en) : tx.paymentMethod;

            return (
              <div
                key={tx.id}
                className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                {/* Left info: Icon & Category */}
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                      isIncome
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                        : 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {isIncome ? '💰' : '💸'}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                        {tx.category}
                      </h4>
                      {tx.subcategory && (
                        <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {tx.subcategory}
                        </span>
                      )}
                      <span className="text-[11px] font-mono px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                        {tx.id}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                      <span>👤 {tx.memberName}</span>
                      <span>•</span>
                      <span>📅 {formatDate(tx.date, lang)} {tx.time ? `(${tx.time})` : ''}</span>
                      <span>•</span>
                      <span className="capitalize">💳 {methodLabel}</span>
                    </div>

                    {tx.note && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 bg-slate-50 dark:bg-slate-800/50 px-2.5 py-1 rounded-lg italic">
                        "{tx.note}"
                      </p>
                    )}

                    {/* Attached Receipt Photo View Button */}
                    {tx.receiptImage && (
                      <div className="mt-2">
                        <button
                          type="button"
                          onClick={() => setViewingReceiptTx(tx)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors cursor-pointer group shadow-2xs"
                          title={lang === 'bn' ? 'বাজারের রশিদের ছবি দেখতে ক্লিক করুন' : 'Click to view receipt'}
                        >
                          <img
                            src={tx.receiptImage}
                            alt="Receipt thumb"
                            className="w-4 h-4 rounded object-cover group-hover:scale-110 transition-transform bg-slate-900"
                            referrerPolicy="no-referrer"
                          />
                          <span>🧾 {lang === 'bn' ? 'বাজারের রশিদ দেখুন' : 'View Receipt'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right info: Amount & Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                  <div className="text-left sm:text-right">
                    <span
                      className={`text-lg sm:text-xl font-black block ${
                        isIncome ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'
                      }`}
                    >
                      {isIncome ? '+' : '-'}{formatCurrency(tx.amount, currencySymbol)}
                    </span>
                    <span className="text-[11px] font-medium text-slate-400 capitalize">
                      {isIncome ? (lang === 'bn' ? 'আয়' : 'Income') : (lang === 'bn' ? 'ব্যয়' : 'Expense')}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onEdit(tx)}
                      className="p-2 rounded-lg text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                      title={lang === 'bn' ? 'সম্পাদনা করুন' : 'Edit'}
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => onDelete(tx)}
                      className="p-2 rounded-lg text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer"
                      title={lang === 'bn' ? 'মুছে ফেলুন' : 'Delete'}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Receipt Fullscreen Viewer Modal */}
      <ReceiptViewerModal
        isOpen={!!viewingReceiptTx}
        onClose={() => setViewingReceiptTx(null)}
        transaction={viewingReceiptTx}
        currencySymbol={currencySymbol}
        lang={lang}
      />
    </div>
  );
};
