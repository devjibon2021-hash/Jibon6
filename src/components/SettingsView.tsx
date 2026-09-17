import React, { useRef, useState } from 'react';
import { AppSettings, CategoryBudget, DebtItem, FamilyMember, SavingsGoal, Transaction } from '../types';
import { exportTransactionsToCSV, formatDate, getTodayDate } from '../utils/formatters';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  transactions: Transaction[];
  members: FamilyMember[];
  budgets: CategoryBudget[];
  goals: SavingsGoal[];
  debts: DebtItem[];
  onRestoreAllData: (data: {
    transactions: Transaction[];
    members: FamilyMember[];
    budgets: CategoryBudget[];
    goals: SavingsGoal[];
    debts: DebtItem[];
    settings?: AppSettings;
  }) => Promise<void>;
  onResetToSampleData: () => Promise<void>;
  onClearAllData: () => Promise<void>;
  onOpenApkModal?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  transactions,
  members,
  budgets,
  goals,
  debts,
  onRestoreAllData,
  onResetToSampleData,
  onClearAllData,
  onOpenApkModal,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [confirmModal, setConfirmModal] = useState<'reset' | 'clear' | null>(null);
  const isOnline = navigator.onLine;
  const sharedUrl = 'https://ais-pre-3canktu22lbz7qy3igjdyu-568031923881.europe-west2.run.app';

  // JSON Export
  const handleExportJSON = () => {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      appName: 'টুকটুকির সংসার – Family Finance',
      settings,
      transactions,
      members,
      budgets,
      goals,
      debts,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `family_finance_backup_${getTodayDate()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // JSON Import / Restore
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        if (!parsed.transactions && !parsed.members) {
          setImportStatus('ত্রুটি: ভুল ব্যাকআপ ফাইল ফরম্যাট।');
          return;
        }

        await onRestoreAllData({
          transactions: parsed.transactions || [],
          members: parsed.members || [],
          budgets: parsed.budgets || [],
          goals: parsed.goals || [],
          debts: parsed.debts || [],
          settings: parsed.settings,
        });

        setImportStatus('✅ ডেটা সফলভাবে রিস্টোর হয়েছে!');
        setTimeout(() => setImportStatus(''), 4000);
      } catch (err) {
        console.error(err);
        setImportStatus('ত্রুটি: ফাইলটি পড়া সম্ভব হয়নি। সঠিক JSON ফাইল দিন।');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <span>⚙️</span>
          <span>{settings.language === 'bn' ? 'অ্যাপ সেটিংস ও ব্যাকআপ' : 'App Settings & Backup'}</span>
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {settings.language === 'bn'
            ? 'অ্যাপ পার্সোনালাইজেশন, অফলাইন স্টোরেজ এবং সম্পূর্ণ ডেটা ব্যাকআপ-রিস্টোর'
            : 'Personalization, offline storage, and full data backup/restore'}
        </p>
      </div>

      {/* Preferences Section */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
          <span>🎨</span>
          <span>{settings.language === 'bn' ? 'সাধারণ পছন্দসমূহ (Preferences)' : 'General Preferences'}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Theme Mode */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-900 dark:text-slate-100 block text-sm">
                {settings.language === 'bn' ? 'ডার্ক মোড (Dark Mode)' : 'Dark Mode'}
              </span>
              <span className="text-xs text-slate-500">
                {settings.theme === 'dark'
                  ? (settings.language === 'bn' ? 'ডার্ক মোড সক্রিয়' : 'Dark theme active')
                  : (settings.language === 'bn' ? 'লাইট মোড সক্রিয়' : 'Light theme active')}
              </span>
            </div>
            <button
              onClick={() => onUpdateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })}
              className={`w-14 h-8 flex items-center rounded-full p-1 transition-all cursor-pointer ${
                settings.theme === 'dark' ? 'bg-indigo-600 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
              }`}
            >
              <span className="w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center text-xs">
                {settings.theme === 'dark' ? '🌙' : '☀️'}
              </span>
            </button>
          </div>

          {/* Language Switcher */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-900 dark:text-slate-100 block text-sm">
                {settings.language === 'bn' ? 'ভাষা (Language)' : 'Language'}
              </span>
              <span className="text-xs text-slate-500">
                {settings.language === 'bn' ? 'বাংলা সিলেক্টেড' : 'English Selected'}
              </span>
            </div>
            <div className="flex bg-slate-200 dark:bg-slate-700 p-1 rounded-xl">
              <button
                onClick={() => onUpdateSettings({ language: 'bn' })}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  settings.language === 'bn' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                বাংলা
              </button>
              <button
                onClick={() => onUpdateSettings({ language: 'en' })}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  settings.language === 'en' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                English
              </button>
            </div>
          </div>

          {/* Currency Symbol */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-900 dark:text-slate-100 block text-sm">
                {settings.language === 'bn' ? 'মুদ্রার প্রতীক (Currency)' : 'Currency Symbol'}
              </span>
              <span className="text-xs text-slate-500">
                {settings.language === 'bn' ? 'টাকার চিহ্ন পরিবর্তন করুন' : 'Change currency display'}
              </span>
            </div>
            <select
              value={settings.currencySymbol}
              onChange={(e) => onUpdateSettings({ currencySymbol: e.target.value })}
              className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            >
              <option value="৳">৳ (বাংলাদেশি টাকা)</option>
              <option value="$">$ (USD)</option>
              <option value="₹">₹ (INR)</option>
              <option value="€">€ (EUR)</option>
              <option value="£">£ (GBP)</option>
              <option value="AED">AED (Dirham)</option>
              <option value="SAR">SAR (Riyal)</option>
            </select>
          </div>

          {/* Offline / IndexedDB Status Indicator */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-900 dark:text-slate-100 block text-sm">
                {settings.language === 'bn' ? 'নেটওয়ার্ক ও স্টোরেজ' : 'Network & Storage'}
              </span>
              <span className="text-xs text-slate-500">
                {isOnline
                  ? (settings.language === 'bn' ? 'অনলাইন ও IndexedDB সক্রিয়' : 'Online & IndexedDB active')
                  : (settings.language === 'bn' ? 'অফলাইন মোড (IndexedDB সচল)' : 'Offline Mode (IndexedDB active)')}
              </span>
            </div>
            <span
              className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                isOnline
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
              <span>{isOnline ? 'Online' : 'Offline'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Data Backup & Restore Section */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
          <span>💾</span>
          <span>{settings.language === 'bn' ? 'ডেটা ব্যাকআপ ও রিস্টোর' : 'Data Backup & Restore'}</span>
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {settings.language === 'bn'
            ? 'আপনার সকল পারিবারিক আয়, ব্যয়, সদস্য, বাজেট ও দেনা-পাওনার হিসাব সম্পূর্ণ নিরাপদ রাখতে JSON ব্যাকআপ ডাউনলোড করুন অথবা পূর্বের ব্যাকআপ ফাইল থেকে ডেটা ফিরিয়ে আনুন।'
            : 'Download JSON backup of all family finances or restore from a previously saved backup file.'}
        </p>

        {importStatus && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 text-emerald-800 dark:text-emerald-200 text-sm font-semibold">
            {importStatus}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* JSON Export */}
          <button
            onClick={handleExportJSON}
            className="p-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-semibold text-sm shadow-xs transition-all flex flex-col items-center justify-center gap-2 cursor-pointer"
          >
            <span className="text-2xl">📤</span>
            <span>{settings.language === 'bn' ? 'JSON ব্যাকআপ ডাউনলোড' : 'Export JSON Backup'}</span>
            <span className="text-[11px] font-normal opacity-90">
              {transactions.length} {settings.language === 'bn' ? 'টি লেনদেনসহ' : 'transactions'}
            </span>
          </button>

          {/* JSON Restore / Import */}
          <label className="p-4 rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 active:scale-98 text-white font-semibold text-sm shadow-xs transition-all flex flex-col items-center justify-center gap-2 cursor-pointer text-center">
            <span className="text-2xl">📥</span>
            <span>{settings.language === 'bn' ? 'ব্যাকআপ ফাইল রিস্টোর' : 'Restore from JSON'}</span>
            <span className="text-[11px] font-normal opacity-90">
              {settings.language === 'bn' ? 'ফাইল সিলেক্ট করুন' : 'Select backup file'}
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportJSON}
              className="hidden"
            />
          </label>

          {/* CSV Export */}
          <button
            onClick={() => exportTransactionsToCSV(transactions, settings.currencySymbol)}
            className="p-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 active:scale-98 text-slate-800 dark:text-slate-100 font-semibold text-sm shadow-xs transition-all flex flex-col items-center justify-center gap-2 cursor-pointer"
          >
            <span className="text-2xl">📊</span>
            <span>{settings.language === 'bn' ? 'Excel / CSV এক্সপোর্ট' : 'Export to Excel/CSV'}</span>
            <span className="text-[11px] font-normal opacity-70">
              UTF-8 BOM (বাংলা অক্ষরের জন্য)
            </span>
          </button>
        </div>
      </div>

      {/* Android APK & Shared Link Section */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-indigo-200 dark:border-indigo-800/60 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <img
              src="/icon-192.png"
              alt="টুকটুকির সংসার App Icon"
              className="w-11 h-11 rounded-xl object-contain shadow-xs border border-slate-200 dark:border-slate-700 bg-white p-0.5"
              referrerPolicy="no-referrer"
            />
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                {settings.language === 'bn' ? 'টুকটুকির সংসার – APK ও শেয়ারিং' : 'Tuktukir Sangsar – APK & Sharing'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {settings.language === 'bn'
                  ? 'পরিবারের সদস্যদের সাথে অ্যাপটি শেয়ার করুন অথবা সরাসরি অ্যান্ড্রয়েড অ্যাপ হিসেবে ইনস্টল করুন'
                  : 'Share app with family members or install as an Android WebAPK'}
              </p>
            </div>
          </div>
          <span className="self-start sm:self-auto px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
            ● Live Active
          </span>
        </div>

        {/* Share Link Box */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {settings.language === 'bn' ? 'অ্যাপটির লাইভ পাবলিক শেয়ার লিংক:' : 'Live Public Share Link:'}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={sharedUrl}
              className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 select-all"
            />
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(sharedUrl);
                setCopiedLink(true);
                setTimeout(() => setCopiedLink(false), 2500);
              }}
              className={`px-4 py-2 rounded-lg text-xs font-semibold shrink-0 cursor-pointer transition-all flex items-center gap-1.5 ${
                copiedLink
                  ? 'bg-emerald-600 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs active:scale-98'
              }`}
            >
              <span>{copiedLink ? '✓' : '📋'}</span>
              <span>{copiedLink ? (settings.language === 'bn' ? 'কপি হয়েছে!' : 'Copied!') : (settings.language === 'bn' ? 'কপি করুন' : 'Copy')}</span>
            </button>
          </div>
        </div>

        {/* APK Modal Trigger & Root File Info */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          {onOpenApkModal && (
            <button
              type="button"
              onClick={onOpenApkModal}
              className="px-4 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-semibold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
            >
              <span>📲</span>
              <span>{settings.language === 'bn' ? 'APK ইনস্টলেশন গাইড ও বিস্তারিত' : 'Open APK Install Guide'}</span>
            </button>
          )}

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img
                src="/icon-192.png"
                alt="টুকটুকির সংসার App Icon"
                className="w-12 h-12 rounded-xl object-contain shadow-xs border border-indigo-200 dark:border-indigo-800 bg-white p-0.5"
                referrerPolicy="no-referrer"
              />
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  {settings.language === 'bn' ? 'অফিশিয়াল অ্যাপ আইকন (টুকটুকির সংসার)' : 'Official App Icon'}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                  {settings.language === 'bn' ? 'ফোনের হোম স্ক্রিন ও অ্যাপ ড্রয়ার আইকন' : 'Home screen & launcher icon'}
                </span>
              </div>
            </div>
            <a
              href="/icon-512.png"
              download="tuktukir-sangsar-icon-512.png"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors shrink-0 flex items-center gap-1"
            >
              <span>⬇️</span>
              <span>{settings.language === 'bn' ? 'আইকন' : 'Icon'}</span>
            </a>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <span>📁</span>
            <span>
              {settings.language === 'bn'
                ? 'প্রজেক্টের রুট ডিরেক্টরীতে family ফাইলে মেটাডাটা সংরক্ষিত আছে।'
                : 'Project metadata saved in root /family file.'}
            </span>
          </div>
        </div>
      </div>

      {/* Danger Zone: Reset & Clear */}
      <div className="bg-slate-50 dark:bg-slate-850/50 rounded-xl p-5 border border-rose-200 dark:border-rose-900/50 space-y-4">
        <h3 className="font-bold text-rose-800 dark:text-rose-300 text-base flex items-center gap-2">
          <span>⚠️</span>
          <span>{settings.language === 'bn' ? 'সতর্কতামূলক ব্যবস্থা (Danger Zone)' : 'Danger Zone'}</span>
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          {settings.language === 'bn'
            ? 'টেস্টিং করার জন্য ডেমো ডাটা রিসেট করতে পারেন অথবা সম্পূর্ণ নতুনভাবে শুরু করতে সব ডাটা মুছে ফেলতে পারেন।'
            : 'Reset sample data for testing or clear all local records to start fresh.'}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setConfirmModal('reset')}
            className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs sm:text-sm transition-all cursor-pointer"
          >
            🔄 {settings.language === 'bn' ? 'নমুনা ডেটা লোড করুন (Reset to Sample)' : 'Reset to Sample Data'}
          </button>

          <button
            onClick={() => setConfirmModal('clear')}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-white font-semibold text-xs sm:text-sm transition-all cursor-pointer shadow-xs"
          >
            🗑️ {settings.language === 'bn' ? 'সকল ডেটা মুছে ফেলুন (Clear All)' : 'Clear All Data'}
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md w-full">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg mb-2 flex items-center gap-2">
              <span>⚠️</span>
              <span>
                {confirmModal === 'reset'
                  ? (settings.language === 'bn' ? 'নমুনা ডেটা লোড করতে চান?' : 'Reset to Sample Data?')
                  : (settings.language === 'bn' ? 'সকল ডেটা মুছে ফেলতে চান?' : 'Permanently Clear All Data?')}
              </span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-5">
              {confirmModal === 'reset'
                ? (settings.language === 'bn'
                    ? 'এটি আপনার বর্তমান ডেটা প্রতিস্থাপন করে প্রস্তুতকৃত নমুনা পারিবারিক ডেটা লোড করবে।'
                    : 'This will replace current data with initial sample family financial records.')
                : (settings.language === 'bn'
                    ? 'সতর্কতা: এই কাজটি পূর্বাবস্থায় ফেরানো সম্ভব নয়! আপনার সকল হিসাব স্থায়ীভাবে মুছে যাবে।'
                    : 'Warning: This action cannot be undone. All your financial records will be permanently erased.')}
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={async () => {
                  if (confirmModal === 'reset') {
                    await onResetToSampleData();
                  } else {
                    await onClearAllData();
                  }
                  setConfirmModal(null);
                }}
                className={`flex-1 py-2.5 rounded-xl font-semibold text-sm text-white cursor-pointer transition-all active:scale-98 ${
                  confirmModal === 'reset' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {settings.language === 'bn' ? 'হ্যাঁ, নিশ্চিত' : 'Yes, Confirm'}
              </button>
              <button
                onClick={() => setConfirmModal(null)}
                className="py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                {settings.language === 'bn' ? 'না, বাতিল' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
