import React, { useState } from 'react';
import { FamilyMember, Transaction } from '../types';
import {
  formatCurrency,
  formatDate,
  formatMonthYear,
  getTodayDate,
  exportTransactionsToCSV,
} from '../utils/formatters';
import {
  exportMonthlyReportCSV,
  exportAnnualReportCSV,
  exportReportToPDF,
  printFinancialReport,
} from '../utils/reportExporter';
import {
  FileText,
  FileSpreadsheet,
  Printer,
  Download,
  Check,
  ChevronDown,
  Info,
  ShieldCheck,
} from 'lucide-react';

interface ReportsViewProps {
  transactions: Transaction[];
  members: FamilyMember[];
  currencySymbol?: string;
  lang?: 'bn' | 'en';
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  transactions,
  members,
  currencySymbol = '৳',
  lang = 'bn',
}) => {
  const [reportType, setReportType] = useState<'monthly' | 'annual'>('monthly');

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showCsvDropdown, setShowCsvDropdown] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Available Years
  const availableYears = Array.from(
    new Set([
      now.getFullYear(),
      now.getFullYear() - 1,
      ...transactions.map((t) => (t.date ? parseInt(t.date.split('-')[0]) : now.getFullYear())),
    ])
  ).sort((a, b) => b - a);

  // --- MONTHLY REPORT CALCULATION ---
  const monthKey = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
  const monthTxs = transactions.filter((t) => t.date && t.date.startsWith(monthKey));

  const monthlyIncome = monthTxs
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyExpense = monthTxs
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyBalance = monthlyIncome - monthlyExpense;
  const monthlySavingsRate = monthlyIncome > 0 ? (Math.max(monthlyBalance, 0) / monthlyIncome) * 100 : 0;

  // Category breakdown for the month
  const categoryExpenseMap: Record<string, number> = {};
  monthTxs
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      categoryExpenseMap[t.category] = (categoryExpenseMap[t.category] || 0) + t.amount;
    });

  const categoryExpenseList = Object.entries(categoryExpenseMap)
    .map(([cat, amt]) => ({
      category: cat,
      amount: amt,
      percent: monthlyExpense > 0 ? (amt / monthlyExpense) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const highestExpenseCategory = categoryExpenseList[0] || null;

  // Source breakdown for income
  const incomeSourceMap: Record<string, number> = {};
  monthTxs
    .filter((t) => t.type === 'income')
    .forEach((t) => {
      incomeSourceMap[t.category] = (incomeSourceMap[t.category] || 0) + t.amount;
    });

  const highestIncomeSource = Object.entries(incomeSourceMap).sort((a, b) => b[1] - a[1])[0] || null;

  // Member breakdown for the month
  const memberMonthlyStats = members.map((m) => {
    const memTxs = monthTxs.filter((t) => t.memberId === m.id);
    const inc = memTxs.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const exp = memTxs.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    return {
      id: m.id,
      name: m.name,
      role: m.role,
      income: inc,
      expense: exp,
      balance: inc - exp,
    };
  });

  // --- ANNUAL REPORT CALCULATION ---
  const monthsNamesBn = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
  ];
  const monthsNamesEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const annualMonths = Array.from({ length: 12 }, (_, i) => {
    const mNum = i + 1;
    const key = `${selectedYear}-${String(mNum).padStart(2, '0')}`;
    const txs = transactions.filter((t) => t.date && t.date.startsWith(key));
    const inc = txs.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const exp = txs.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const bal = inc - exp;
    const rate = inc > 0 ? (Math.max(bal, 0) / inc) * 100 : 0;

    return {
      monthNumber: mNum,
      name: lang === 'bn' ? monthsNamesBn[i] : monthsNamesEn[i],
      income: inc,
      expense: exp,
      balance: bal,
      savingsRate: rate,
    };
  });

  const annualTotalIncome = annualMonths.reduce((sum, m) => sum + m.income, 0);
  const annualTotalExpense = annualMonths.reduce((sum, m) => sum + m.expense, 0);
  const annualTotalBalance = annualTotalIncome - annualTotalExpense;
  const annualAvgSavingsRate = annualTotalIncome > 0 ? (Math.max(annualTotalBalance, 0) / annualTotalIncome) * 100 : 0;

  const activeLang: 'bn' | 'en' = lang === 'en' ? 'en' : 'bn';

  // Export handlers
  const handleExportPDF = () => {
    const periodText = reportType === 'monthly'
      ? formatMonthYear(selectedYear, selectedMonth, activeLang)
      : String(selectedYear);
    const title = activeLang === 'bn' ? 'টুকটুকির সংসার – আর্থিক রিপোর্ট' : 'Tuktukir Sangsar – Financial Statement';

    showToast(activeLang === 'bn' ? '📄 PDF তৈরি হচ্ছে এবং Downloads-এ সংরক্ষণ হচ্ছে...' : '📄 Creating PDF and saving it to Downloads...');
    exportReportToPDF({
      title,
      periodText,
      elementId: 'printable-report-area',
      lang: activeLang,
    });
  };

  const handleExportCSV = () => {
    setShowCsvDropdown(false);
    if (reportType === 'monthly') {
      const monthName = activeLang === 'bn' ? monthsNamesBn[selectedMonth - 1] : monthsNamesEn[selectedMonth - 1];
      exportMonthlyReportCSV({
        year: selectedYear,
        month: selectedMonth,
        monthName,
        monthlyIncome,
        monthlyExpense,
        monthlyBalance,
        monthlySavingsRate,
        categoryExpenseList,
        highestExpenseCategory,
        highestIncomeSource,
        memberMonthlyStats,
        monthTxs,
        currencySymbol,
        lang: activeLang,
      });
      showToast(activeLang === 'bn' ? '📊 মাসিক রিপোর্ট CSV ডাউনলোড হয়েছে!' : '📊 Monthly Report CSV downloaded!');
    } else {
      const yearTxs = transactions.filter((t) => t.date && t.date.startsWith(String(selectedYear)));
      exportAnnualReportCSV({
        year: selectedYear,
        annualTotalIncome,
        annualTotalExpense,
        annualTotalBalance,
        annualAvgSavingsRate,
        annualMonths,
        yearTxs,
        currencySymbol,
        lang: activeLang,
      });
      showToast(activeLang === 'bn' ? '📊 বার্ষিক রিপোর্ট CSV ডাউনলোড হয়েছে!' : '📊 Annual Report CSV downloaded!');
    }
  };

  const handleExportAllTransactionsCSV = () => {
    setShowCsvDropdown(false);
    exportTransactionsToCSV(transactions, currencySymbol);
    showToast(lang === 'bn' ? '📁 সকল লেনদেনের CSV ডাউনলোড হয়েছে!' : '📁 Full Transactions CSV downloaded!');
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white text-xs sm:text-sm font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 border border-slate-700">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Control / Filter Bar (Hidden when printing) */}
      <div className="no-print bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Report Type Toggle */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0">
          <button
            onClick={() => setReportType('monthly')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              reportType === 'monthly'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {lang === 'bn' ? '📅 মাসিক রিপোর্ট' : 'Monthly Report'}
          </button>
          <button
            onClick={() => setReportType('annual')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              reportType === 'annual'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {lang === 'bn' ? '📊 বার্ষিক রিপোর্ট' : 'Annual Report'}
          </button>
        </div>

        {/* Date Pickers & Professional Export Actions */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {reportType === 'monthly' && (
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
            >
              {(lang === 'bn' ? monthsNamesBn : monthsNamesEn).map((mName, idx) => (
                <option key={idx} value={idx + 1}>
                  {mName}
                </option>
              ))}
            </select>
          )}

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
          >
            {availableYears.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block mx-0.5" />

          {/* 1. PDF Export Button */}
          <button
            onClick={handleExportPDF}
            className="px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm transition-all flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
            title={lang === 'bn' ? 'প্রফেশনাল PDF ডাউনলোড / প্রিন্ট করুন' : 'Export or Save as PDF'}
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span>{lang === 'bn' ? 'PDF এক্সপোর্ট' : 'Export PDF'}</span>
          </button>

          {/* 2. CSV (Excel) Export Button with Split Dropdown */}
          <div className="relative">
            <div className="inline-flex rounded-xl shadow-xs overflow-hidden">
              <button
                onClick={handleExportCSV}
                className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                title={lang === 'bn' ? 'এক্সেল বা স্প্রেডশিটে ব্যবহারের জন্য CSV ডাউনলোড করুন' : 'Export Report to CSV for Excel'}
              >
                <FileSpreadsheet className="w-4 h-4 shrink-0" />
                <span>{lang === 'bn' ? 'CSV এক্সপোর্ট' : 'Export CSV'}</span>
              </button>
              <button
                onClick={() => setShowCsvDropdown((prev) => !prev)}
                className="px-2 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white border-l border-emerald-500/50 cursor-pointer flex items-center justify-center"
                title={lang === 'bn' ? 'অন্যান্য CSV অপশন' : 'More CSV options'}
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {showCsvDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100">
                <button
                  onClick={handleExportCSV}
                  className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2.5 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div>
                    <div className="font-bold">
                      {reportType === 'monthly'
                        ? (lang === 'bn' ? 'মাসিক স্টেটমেন্ট CSV' : 'Monthly Statement CSV')
                        : (lang === 'bn' ? 'বার্ষিক স্টেটমেন্ট CSV' : 'Annual Statement CSV')}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                      {lang === 'bn' ? 'সারাংশ, খাতভিত্তিক ও বিস্তারিত লেনদেন' : 'Summary, categories & transactions'}
                    </div>
                  </div>
                </button>

                <div className="my-1 border-t border-slate-100 dark:border-slate-700" />

                <button
                  onClick={handleExportAllTransactionsCSV}
                  className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2.5 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <div>
                    <div className="font-bold">
                      {lang === 'bn' ? 'সকল লেনদেনের রেজিস্টার CSV' : 'All Transactions Ledger CSV'}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                      {lang === 'bn' ? 'অ্যাপে থাকা সব লেনদেনের রেকর্ড' : 'Full history of transactions'}
                    </div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* 3. Direct Print Button */}
          <button
            onClick={() => {
              const periodText = reportType === 'monthly'
                ? formatMonthYear(selectedYear, selectedMonth, activeLang)
                : String(selectedYear);
              const title = activeLang === 'bn'
                ? 'টুকটুকির সংসার – আর্থিক রিপোর্ট'
                : 'Tuktukir Sangsar – Financial Statement';
              printFinancialReport({
                title,
                periodText,
                elementId: 'printable-report-area',
                lang: activeLang,
              });
            }}
            className="px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 font-semibold text-xs sm:text-sm transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
            title={lang === 'bn' ? 'সরাসরি প্রিন্ট করুন' : 'Direct Print'}
          >
            <Printer className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">{lang === 'bn' ? 'প্রিন্ট' : 'Print'}</span>
          </button>
        </div>
      </div>

      {/* Professional Documentation Guidance Tip */}
      <div className="no-print p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-start sm:items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5 sm:mt-0" />
          <span>
            {lang === 'bn'
              ? '💡 প্রফেশনাল ডকুমেন্টেশন: "PDF এক্সপোর্ট" বাটনে ক্লিক করে প্রিন্ট অপশনে Destination থেকে "Save as PDF" নির্বাচন করে সরাসরি অফিশিয়াল ডকুমেন্ট ফাইল সংরক্ষণ করুন। অথবা "CSV এক্সপোর্ট" দিয়ে Microsoft Excel বা Google Sheets-এ ওপেন করুন।'
              : '💡 Professional Documentation Tip: Click "Export PDF" and choose "Save as PDF" in the destination dropdown to archive this statement. Click "Export CSV" to open in Microsoft Excel or Google Sheets.'}
          </span>
        </div>
      </div>

      {/* Printable Report Wrapper */}
      <div id="printable-report-area" className="printable-area bg-white dark:bg-slate-900 rounded-xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
        {/* Official Print Header */}
        <div className="border-b-2 border-slate-900 dark:border-slate-700 pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {lang === 'bn' ? 'টুকটুকির সংসার – Family Finance' : 'Tuktukir Sangsar – Family Finance'}
            </h1>
            <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">
              {reportType === 'monthly'
                ? (lang === 'bn' ? `মাসিক আয়-ব্যয় রিপোর্ট: ${formatMonthYear(selectedYear, selectedMonth, lang)}` : `Monthly Financial Report: ${formatMonthYear(selectedYear, selectedMonth, lang)}`)
                : (lang === 'bn' ? `বার্ষিক আর্থিক বিবরণী: ${selectedYear}` : `Annual Financial Statement: ${selectedYear}`)}
            </p>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 text-left sm:text-right">
            <p>{lang === 'bn' ? 'তৈরির তারিখ:' : 'Generated on:'} {formatDate(getTodayDate(), lang)}</p>
            <p className="font-mono text-[11px] text-slate-400">Family Finance Management App</p>
          </div>
        </div>

        {/* 1. MONTHLY REPORT CONTENT */}
        {reportType === 'monthly' && (
          <div className="space-y-6">
            {/* Top 4 Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  💰 {lang === 'bn' ? 'মোট মাসিক আয়' : 'Monthly Income'}
                </span>
                <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(monthlyIncome, currencySymbol)}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  💸 {lang === 'bn' ? 'মোট মাসিক ব্যয়' : 'Monthly Expense'}
                </span>
                <p className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">
                  {formatCurrency(monthlyExpense, currencySymbol)}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  💵 {lang === 'bn' ? 'মাসিক ব্যালেন্স (উদ্বৃত্ত)' : 'Monthly Balance'}
                </span>
                <p
                  className={`text-xl sm:text-2xl font-black ${
                    monthlyBalance >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {formatCurrency(monthlyBalance, currencySymbol)}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  📈 {lang === 'bn' ? 'সঞ্চয়ের হার' : 'Savings Rate'}
                </span>
                <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {monthlySavingsRate.toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Highlights: Highest Category & Income Source */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {lang === 'bn' ? 'সর্বোচ্চ ব্যয়ের খাত' : 'Highest Expense Category'}
                </span>
                <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                  {highestExpenseCategory ? highestExpenseCategory.category : (lang === 'bn' ? 'কোনো ব্যয় নেই' : 'None')}
                </p>
                {highestExpenseCategory && (
                  <span className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
                    {formatCurrency(highestExpenseCategory.amount, currencySymbol)} ({highestExpenseCategory.percent.toFixed(1)}%)
                  </span>
                )}
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {lang === 'bn' ? 'প্রধান আয়ের উৎস' : 'Primary Income Source'}
                </span>
                <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                  {highestIncomeSource ? highestIncomeSource[0] : (lang === 'bn' ? 'কোনো আয় নেই' : 'None')}
                </p>
                {highestIncomeSource && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                    {formatCurrency(highestIncomeSource[1], currencySymbol)}
                  </span>
                )}
              </div>
            </div>

            {/* Member-wise breakdown Table */}
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                <span>👤</span>
                <span>{lang === 'bn' ? 'সদস্যভিত্তিক মাসিক আর্থিক বিবরণ' : 'Member-wise Financial Breakdown'}</span>
              </h3>
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold text-xs border-b border-slate-200 dark:border-slate-700">
                      <th className="p-3">{lang === 'bn' ? 'সদস্য' : 'Member'}</th>
                      <th className="p-3">{lang === 'bn' ? 'ভূমিকা' : 'Role'}</th>
                      <th className="p-3 text-right">{lang === 'bn' ? 'আয়' : 'Income'}</th>
                      <th className="p-3 text-right">{lang === 'bn' ? 'ব্যয়' : 'Expense'}</th>
                      <th className="p-3 text-right">{lang === 'bn' ? 'ব্যালেন্স' : 'Balance'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {memberMonthlyStats.map((mem) => (
                      <tr key={mem.id} className="hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors">
                        <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">{mem.name}</td>
                        <td className="p-3 text-slate-600 dark:text-slate-400">{mem.role}</td>
                        <td className="p-3 text-right text-emerald-600 dark:text-emerald-400 font-semibold">
                          {formatCurrency(mem.income, currencySymbol)}
                        </td>
                        <td className="p-3 text-right text-rose-600 dark:text-rose-400 font-semibold">
                          {formatCurrency(mem.expense, currencySymbol)}
                        </td>
                        <td
                          className={`p-3 text-right font-bold ${
                            mem.balance >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'
                          }`}
                        >
                          {formatCurrency(mem.balance, currencySymbol)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Category-wise Expense Table */}
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                <span>🛒</span>
                <span>{lang === 'bn' ? 'খাতভিত্তিক ব্যয় বিবরণী' : 'Category-wise Expense Summary'}</span>
              </h3>
              {categoryExpenseList.length === 0 ? (
                <p className="text-xs text-slate-500 italic">
                  {lang === 'bn' ? 'এই মাসে কোনো ব্যয়ের হিসাব নেই।' : 'No expenses recorded for this month.'}
                </p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold text-xs border-b border-slate-200 dark:border-slate-700">
                        <th className="p-3">{lang === 'bn' ? 'ব্যয়ের খাত' : 'Expense Category'}</th>
                        <th className="p-3 text-right">{lang === 'bn' ? 'মোট পরিমাণ' : 'Amount'}</th>
                        <th className="p-3 text-right">{lang === 'bn' ? 'শতকরা হার' : 'Percentage'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {categoryExpenseList.map((c) => (
                        <tr key={c.category} className="hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors">
                          <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">{c.category}</td>
                          <td className="p-3 text-right font-bold text-slate-900 dark:text-slate-100">
                            {formatCurrency(c.amount, currencySymbol)}
                          </td>
                          <td className="p-3 text-right font-semibold text-slate-600 dark:text-slate-400">
                            {c.percent.toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Detailed Transaction Ledger of the Month */}
            <div className="break-inside-avoid">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                <span>📋</span>
                <span>{lang === 'bn' ? 'এই মাসের সকল লেনদেনের তালিকা' : 'Detailed Monthly Transactions'}</span>
              </h3>
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                      <th className="p-2.5">ID</th>
                      <th className="p-2.5">{lang === 'bn' ? 'তারিখ' : 'Date'}</th>
                      <th className="p-2.5">{lang === 'bn' ? 'সদস্য' : 'Member'}</th>
                      <th className="p-2.5">{lang === 'bn' ? 'খাত' : 'Category'}</th>
                      <th className="p-2.5">{lang === 'bn' ? 'বিবরণ' : 'Note'}</th>
                      <th className="p-2.5 text-right">{lang === 'bn' ? 'পরিমাণ' : 'Amount'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {monthTxs.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors">
                        <td className="p-2.5 font-mono text-slate-400">{t.id}</td>
                        <td className="p-2.5">{t.date}</td>
                        <td className="p-2.5">{t.memberName}</td>
                        <td className="p-2.5 font-medium">{t.category}</td>
                        <td className="p-2.5 italic text-slate-500">{t.note || '-'}</td>
                        <td
                          className={`p-2.5 text-right font-bold ${
                            t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount, currencySymbol)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 2. ANNUAL REPORT CONTENT */}
        {reportType === 'annual' && (
          <div className="space-y-6">
            {/* Annual 4 Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  💰 {lang === 'bn' ? 'মোট বার্ষিক আয়' : 'Total Annual Income'}
                </span>
                <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(annualTotalIncome, currencySymbol)}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  💸 {lang === 'bn' ? 'মোট বার্ষিক ব্যয়' : 'Total Annual Expense'}
                </span>
                <p className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">
                  {formatCurrency(annualTotalExpense, currencySymbol)}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  💵 {lang === 'bn' ? 'মোট বার্ষিক সঞ্চয় / ব্যালেন্স' : 'Net Annual Savings'}
                </span>
                <p
                  className={`text-xl sm:text-2xl font-black ${
                    annualTotalBalance >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {formatCurrency(annualTotalBalance, currencySymbol)}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  📈 {lang === 'bn' ? 'গড় বার্ষিক সঞ্চয়ের হার' : 'Avg Annual Savings Rate'}
                </span>
                <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {annualAvgSavingsRate.toFixed(1)}%
                </p>
              </div>
            </div>

            {/* 12-Month Table */}
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                <span>🗓️</span>
                <span>{lang === 'bn' ? 'মাসভিত্তিক আর্থিক বিবরণী (জানুয়ারি - ডিসেম্বর)' : '12-Month Statement (Jan - Dec)'}</span>
              </h3>
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold text-xs border-b border-slate-200 dark:border-slate-700">
                      <th className="p-3">{lang === 'bn' ? 'মাস' : 'Month'}</th>
                      <th className="p-3 text-right">{lang === 'bn' ? 'আয়' : 'Income'}</th>
                      <th className="p-3 text-right">{lang === 'bn' ? 'ব্যয়' : 'Expense'}</th>
                      <th className="p-3 text-right">{lang === 'bn' ? 'ব্যালেন্স' : 'Balance'}</th>
                      <th className="p-3 text-right">{lang === 'bn' ? 'সঞ্চয়ের হার' : 'Savings Rate'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {annualMonths.map((m) => (
                      <tr key={m.monthNumber} className="hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors">
                        <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">{m.name}</td>
                        <td className="p-3 text-right text-emerald-600 dark:text-emerald-400 font-semibold">
                          {formatCurrency(m.income, currencySymbol)}
                        </td>
                        <td className="p-3 text-right text-rose-600 dark:text-rose-400 font-semibold">
                          {formatCurrency(m.expense, currencySymbol)}
                        </td>
                        <td
                          className={`p-3 text-right font-bold ${
                            m.balance >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {formatCurrency(m.balance, currencySymbol)}
                        </td>
                        <td className="p-3 text-right font-semibold text-slate-700 dark:text-slate-300">
                          {m.savingsRate.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                    {/* Totals row */}
                    <tr className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-600">
                      <td className="p-3">{lang === 'bn' ? 'মোট বার্ষিক' : 'Total Annual'}</td>
                      <td className="p-3 text-right text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(annualTotalIncome, currencySymbol)}
                      </td>
                      <td className="p-3 text-right text-rose-600 dark:text-rose-400">
                        {formatCurrency(annualTotalExpense, currencySymbol)}
                      </td>
                      <td
                        className={`p-3 text-right ${
                          annualTotalBalance >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {formatCurrency(annualTotalBalance, currencySymbol)}
                      </td>
                      <td className="p-3 text-right text-slate-900 dark:text-white">
                        {annualAvgSavingsRate.toFixed(1)}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Official Verification Signatures Block for Professional Documentation */}
        <div className="pt-8 border-t border-slate-200 dark:border-slate-800 break-inside-avoid grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div className="space-y-1">
            <div className="border-t border-dashed border-slate-400 dark:border-slate-600 pt-2 font-bold text-xs text-slate-700 dark:text-slate-300">
              {lang === 'bn' ? 'হিসাব প্রস্তুতকারক' : 'Prepared By'}
            </div>
            <p className="text-[11px] text-slate-400">{lang === 'bn' ? 'স্বাক্ষর ও তারিখ' : 'Signature & Date'}</p>
          </div>
          <div className="space-y-1">
            <div className="border-t border-dashed border-slate-400 dark:border-slate-600 pt-2 font-bold text-xs text-slate-700 dark:text-slate-300">
              {lang === 'bn' ? 'যাচাইকারী / নিরীক্ষক' : 'Verified By'}
            </div>
            <p className="text-[11px] text-slate-400">{lang === 'bn' ? 'স্বাক্ষর ও তারিখ' : 'Signature & Date'}</p>
          </div>
          <div className="space-y-1">
            <div className="border-t border-dashed border-slate-400 dark:border-slate-600 pt-2 font-bold text-xs text-slate-700 dark:text-slate-300">
              {lang === 'bn' ? 'পারিবারিক প্রধান / অভিভাবক' : 'Head of Family'}
            </div>
            <p className="text-[11px] text-slate-400">{lang === 'bn' ? 'অনুমোদন ও সিল' : 'Approval & Seal'}</p>
          </div>
        </div>

        {/* Official Print Footer */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <span>টুকটুকির সংসার – Family Finance Management Application</span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>স্বয়ংক্রিয়ভাবে তৈরি আর্থিক বিবরণী | Confidential</span>
          </span>
        </div>
      </div>
    </div>
  );
};
