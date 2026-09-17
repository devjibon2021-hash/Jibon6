import React, { useEffect, useState, useTransition } from 'react';
import {
  AppSettings,
  CategoryBudget,
  DebtItem,
  FamilyMember,
  SavingsGoal,
  Transaction,
} from './types';
import {
  clearStore,
  deleteFromStore,
  getAllFromStore,
  initDB,
  saveToStore,
} from './utils/indexedDB';
import {
  INITIAL_SAMPLE_BUDGETS,
  INITIAL_SAMPLE_DEBTS,
  INITIAL_SAMPLE_GOALS,
  INITIAL_SAMPLE_MEMBERS,
  INITIAL_SAMPLE_TRANSACTIONS,
} from './utils/sampleData';
import { formatCurrency } from './utils/formatters';

// Components
import { DashboardView } from './components/DashboardView';
import { TransactionLedger } from './components/TransactionLedger';
import { FamilyMembers } from './components/FamilyMembers';
import { BudgetManager } from './components/BudgetManager';
import { SavingsGoals } from './components/SavingsGoals';
import { DebtManager } from './components/DebtManager';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { IncomeForm } from './components/IncomeForm';
import { ExpenseForm } from './components/ExpenseForm';
import { ApkInstallModal } from './components/ApkInstallModal';

export default function App() {
  // App-wide data states
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [budgets, setBudgets] = useState<CategoryBudget[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [debts, setDebts] = useState<DebtItem[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    currencySymbol: '৳',
    language: 'bn',
    theme: 'light',
    enableNotifications: true,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  // Modal states for forms and APK
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isApkModalOpen, setIsApkModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Deletion confirmation dialog
  const [itemToDelete, setItemToDelete] = useState<{
    type: 'transaction' | 'member' | 'goal' | 'debt';
    item: any;
    name: string;
  } | null>(null);

  // 1. Initial load from IndexedDB
  useEffect(() => {
    async function loadData() {
      try {
        await initDB();

        let loadedMembers = await getAllFromStore<FamilyMember>('members');
        let loadedTxs = await getAllFromStore<Transaction>('transactions');
        let loadedBudgets = await getAllFromStore<CategoryBudget>('budgets');
        let loadedGoals = await getAllFromStore<SavingsGoal>('savings_goals');
        let loadedDebts = await getAllFromStore<DebtItem>('debts');
        let loadedSettings = await getAllFromStore<any>('settings');

        // Check if first-time user: populate initial sample data so the app is instantly testable
        if (loadedMembers.length === 0 && loadedTxs.length === 0) {
          for (const m of INITIAL_SAMPLE_MEMBERS) {
            await saveToStore('members', m);
          }
          for (const b of INITIAL_SAMPLE_BUDGETS) {
            await saveToStore('budgets', b);
          }
          for (const g of INITIAL_SAMPLE_GOALS) {
            await saveToStore('savings_goals', g);
          }
          for (const d of INITIAL_SAMPLE_DEBTS) {
            await saveToStore('debts', d);
          }
          for (const t of INITIAL_SAMPLE_TRANSACTIONS) {
            await saveToStore('transactions', t);
          }

          loadedMembers = INITIAL_SAMPLE_MEMBERS;
          loadedBudgets = INITIAL_SAMPLE_BUDGETS;
          loadedGoals = INITIAL_SAMPLE_GOALS;
          loadedDebts = INITIAL_SAMPLE_DEBTS;
          loadedTxs = INITIAL_SAMPLE_TRANSACTIONS;
        }

        setMembers(loadedMembers);
        setBudgets(loadedBudgets);
        setGoals(loadedGoals);
        setDebts(loadedDebts);
        setTransactions(loadedTxs);

        if (loadedSettings && loadedSettings.length > 0) {
          const appConfig = loadedSettings[0];
          setSettings(appConfig);
          if (appConfig.theme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      } catch (err) {
        console.error('Error loading data from IndexedDB:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  // Synchronize Dark Theme class
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  // Update Settings
  const handleUpdateSettings = async (newSettings: Partial<AppSettings>) => {
    const updated: AppSettings = { ...settings, ...newSettings };
    setSettings(updated);
    await saveToStore('settings', { id: 'app_settings', ...updated });
  };

  // --- TRANSACTION HANDLERS ---
  const handleSaveTransaction = async (tx: Transaction) => {
    await saveToStore('transactions', tx);
    setTransactions((prev) => {
      const idx = prev.findIndex((t) => t.id === tx.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = tx;
        return copy;
      }
      return [tx, ...prev];
    });

    setIsIncomeModalOpen(false);
    setIsExpenseModalOpen(false);
    setEditingTransaction(null);
  };

  const handleDeleteTransaction = async (tx: Transaction) => {
    await deleteFromStore('transactions', tx.id);
    setTransactions((prev) => prev.filter((t) => t.id !== tx.id));
    setItemToDelete(null);
  };

  // --- FAMILY MEMBER HANDLERS ---
  const handleAddMember = async (member: FamilyMember) => {
    await saveToStore('members', member);
    setMembers((prev) => [...prev, member]);
  };

  const handleEditMember = async (member: FamilyMember) => {
    await saveToStore('members', member);
    setMembers((prev) => prev.map((m) => (m.id === member.id ? member : m)));
    // Also update memberName in existing transactions
    setTransactions((prev) =>
      prev.map((t) => (t.memberId === member.id ? { ...t, memberName: member.name } : t))
    );
  };

  const handleDeleteMember = async (member: FamilyMember) => {
    await deleteFromStore('members', member.id);
    setMembers((prev) => prev.filter((m) => m.id !== member.id));
    setItemToDelete(null);
  };

  // --- BUDGET HANDLERS ---
  const handleSaveBudget = async (budget: CategoryBudget) => {
    await saveToStore('budgets', budget);
    setBudgets((prev) => {
      const idx = prev.findIndex((b) => b.category === budget.category);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = budget;
        return copy;
      }
      return [...prev, budget];
    });
  };

  const handleDeleteBudget = async (category: string) => {
    await deleteFromStore('budgets', category);
    setBudgets((prev) => prev.filter((b) => b.category !== category));
  };

  // --- SAVINGS GOAL HANDLERS ---
  const handleAddGoal = async (goal: SavingsGoal) => {
    await saveToStore('savings_goals', goal);
    setGoals((prev) => [...prev, goal]);
  };

  const handleEditGoal = async (goal: SavingsGoal) => {
    await saveToStore('savings_goals', goal);
    setGoals((prev) => prev.map((g) => (g.id === goal.id ? goal : g)));
  };

  const handleDeleteGoal = async (goal: SavingsGoal) => {
    await deleteFromStore('savings_goals', goal.id);
    setGoals((prev) => prev.filter((g) => g.id !== goal.id));
    setItemToDelete(null);
  };

  // --- DEBT HANDLERS ---
  const handleAddDebt = async (debt: DebtItem) => {
    await saveToStore('debts', debt);
    setDebts((prev) => [debt, ...prev]);
  };

  const handleEditDebt = async (debt: DebtItem) => {
    await saveToStore('debts', debt);
    setDebts((prev) => prev.map((d) => (d.id === debt.id ? debt : d)));
  };

  const handleDeleteDebt = async (debt: DebtItem) => {
    await deleteFromStore('debts', debt.id);
    setDebts((prev) => prev.filter((d) => d.id !== debt.id));
    setItemToDelete(null);
  };

  // --- RESTORE & RESET HANDLERS ---
  const handleRestoreAllData = async (data: {
    transactions: Transaction[];
    members: FamilyMember[];
    budgets: CategoryBudget[];
    goals: SavingsGoal[];
    debts: DebtItem[];
    settings?: AppSettings;
  }) => {
    // Clear all existing stores
    await clearStore('transactions');
    await clearStore('members');
    await clearStore('budgets');
    await clearStore('savings_goals');
    await clearStore('debts');

    // Populate new
    for (const t of data.transactions) await saveToStore('transactions', t);
    for (const m of data.members) await saveToStore('members', m);
    for (const b of data.budgets) await saveToStore('budgets', b);
    for (const g of data.goals) await saveToStore('savings_goals', g);
    for (const d of data.debts) await saveToStore('debts', d);

    setTransactions(data.transactions);
    setMembers(data.members);
    setBudgets(data.budgets);
    setGoals(data.goals);
    setDebts(data.debts);

    if (data.settings) {
      await handleUpdateSettings(data.settings);
    }
  };

  const handleResetToSampleData = async () => {
    await handleRestoreAllData({
      transactions: INITIAL_SAMPLE_TRANSACTIONS,
      members: INITIAL_SAMPLE_MEMBERS,
      budgets: INITIAL_SAMPLE_BUDGETS,
      goals: INITIAL_SAMPLE_GOALS,
      debts: INITIAL_SAMPLE_DEBTS,
    });
  };

  const handleClearAllData = async () => {
    await clearStore('transactions');
    await clearStore('members');
    await clearStore('budgets');
    await clearStore('savings_goals');
    await clearStore('debts');

    setTransactions([]);
    setMembers([]);
    setBudgets([]);
    setGoals([]);
    setDebts([]);
  };

  // Calculate live net balance
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const netBalance = totalIncome - totalExpense;

  const lang = settings.language;
  const currency = settings.currencySymbol;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F1F5F9] dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          টুকটুকির সংসার – Family Finance
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          অফলাইন ডেটা লোড হচ্ছে...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9] dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Application Header (Hidden in Print Mode) */}
      <header className="no-print sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Logo & App Name */}
          <div
            className="flex items-center gap-3 cursor-pointer select-none"
            onClick={() => setActiveTab('dashboard')}
          >
            <img
              src="/icon-192.png"
              alt="টুকটুকির সংসার App Icon"
              className="w-10 h-10 rounded-xl object-contain shadow-xs border border-slate-200/80 dark:border-slate-700 bg-white p-0.5 hover:scale-105 transition-transform"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/app-icon.png';
              }}
            />
            <div>
              <h1 className="font-bold text-base sm:text-lg text-indigo-700 dark:text-indigo-400 tracking-tight leading-tight">
                {lang === 'bn' ? 'টুকটুকির সংসার' : 'Tuktukir Sangsar'}
              </h1>
              <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400 block tracking-wide">
                Family Finance • টুকটুকির সংসার
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {[
              { id: 'dashboard', icon: '🏠', bn: 'ড্যাশবোর্ড', en: 'Dashboard' },
              { id: 'transactions', icon: '📋', bn: 'লেনদেন', en: 'Ledger' },
              { id: 'members', icon: '👨‍👩‍👧', bn: 'সদস্য', en: 'Members' },
              { id: 'budget', icon: '💰', bn: 'বাজেট', en: 'Budget' },
              { id: 'savings', icon: '🏦', bn: 'সঞ্চয়', en: 'Savings' },
              { id: 'debts', icon: '🤝', bn: 'ধার-পাওনা', en: 'Debts' },
              { id: 'reports', icon: '📊', bn: 'রিপোর্ট', en: 'Reports' },
              { id: 'settings', icon: '⚙️', bn: 'সেটিংস', en: 'Settings' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{lang === 'bn' ? tab.bn : tab.en}</span>
              </button>
            ))}
          </nav>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Net Balance Pill */}
            <div
              onClick={() => setActiveTab('transactions')}
              className="hidden sm:flex flex-col items-end px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-indigo-400 transition-all"
              title="Current Family Net Balance"
            >
              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-none">
                {lang === 'bn' ? 'নেট ব্যালেন্স' : 'Net Balance'}
              </span>
              <span
                className={`text-sm font-black mt-0.5 leading-none ${
                  netBalance >= 0 ? 'text-indigo-700 dark:text-indigo-400' : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {formatCurrency(netBalance, currency)}
              </span>
            </div>

            {/* Quick Add Income & Expense Buttons (Header) */}
            <button
              onClick={() => {
                setEditingTransaction(null);
                setIsIncomeModalOpen(true);
              }}
              className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold text-xs shadow-xs transition-all cursor-pointer"
            >
              <span>➕</span>
              <span>{lang === 'bn' ? 'আয়' : 'Income'}</span>
            </button>

            <button
              onClick={() => {
                setEditingTransaction(null);
                setIsExpenseModalOpen(true);
              }}
              className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-semibold text-xs shadow-xs transition-all cursor-pointer"
            >
              <span>➖</span>
              <span>{lang === 'bn' ? 'ব্যয়' : 'Expense'}</span>
            </button>

            {/* APK & Share Modal Trigger */}
            <button
              onClick={() => setIsApkModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 font-semibold text-xs shadow-2xs transition-all cursor-pointer"
              title={lang === 'bn' ? 'অ্যান্ড্রয়েড APK ও শেয়ার লিংক' : 'Android APK & Share Link'}
            >
              <span>📲</span>
              <span className="hidden md:inline">{lang === 'bn' ? 'APK / শেয়ার' : 'APK & Share'}</span>
            </button>

            {/* Dark Mode Quick Toggle */}
            <button
              onClick={() => handleUpdateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all cursor-pointer"
              title="Toggle Theme"
            >
              {settings.theme === 'dark' ? '☀️' : '🌙'}
            </button>

            {/* Language Quick Toggle */}
            <button
              onClick={() => handleUpdateSettings({ language: settings.language === 'bn' ? 'en' : 'bn' })}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-xs hover:bg-slate-50 transition-all cursor-pointer"
            >
              {settings.language === 'bn' ? 'English' : 'বাংলা'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 pb-24 lg:pb-12">
        {activeTab === 'dashboard' && (
          <DashboardView
            transactions={transactions}
            members={members}
            budgets={budgets}
            goals={goals}
            debts={debts}
            onNavigate={(tab) => setActiveTab(tab)}
            onOpenIncomeModal={() => {
              setEditingTransaction(null);
              setIsIncomeModalOpen(true);
            }}
            onOpenExpenseModal={() => {
              setEditingTransaction(null);
              setIsExpenseModalOpen(true);
            }}
            currencySymbol={currency}
            lang={lang}
          />
        )}

        {activeTab === 'transactions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>📋</span>
                  <span>{lang === 'bn' ? 'পারিবারিক লেনদেন খতিয়ান (Ledger)' : 'Family Transaction Ledger'}</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {lang === 'bn'
                    ? 'সকল আয় ও ব্যয়ের ফিল্টারিং, অনুসন্ধান এবং বিস্তারিত ইতিহাস'
                    : 'Search, filter, edit, and view complete transaction history'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditingTransaction(null);
                    setIsIncomeModalOpen(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                >
                  <span>➕</span>
                  <span>{lang === 'bn' ? 'আয়' : 'Income'}</span>
                </button>
                <button
                  onClick={() => {
                    setEditingTransaction(null);
                    setIsExpenseModalOpen(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                >
                  <span>➖</span>
                  <span>{lang === 'bn' ? 'ব্যয়' : 'Expense'}</span>
                </button>
              </div>
            </div>

            <TransactionLedger
              transactions={transactions}
              members={members}
              onEdit={(tx) => {
                setEditingTransaction(tx);
                if (tx.type === 'income') {
                  setIsIncomeModalOpen(true);
                } else {
                  setIsExpenseModalOpen(true);
                }
              }}
              onDelete={(tx) => {
                setItemToDelete({
                  type: 'transaction',
                  item: tx,
                  name: `${tx.category} (${formatCurrency(tx.amount, currency)})`,
                });
              }}
              currencySymbol={currency}
              lang={lang}
            />
          </div>
        )}

        {activeTab === 'members' && (
          <FamilyMembers
            members={members}
            transactions={transactions}
            onAddMember={handleAddMember}
            onEditMember={handleEditMember}
            onDeleteMember={(mem) => {
              setItemToDelete({
                type: 'member',
                item: mem,
                name: mem.name,
              });
            }}
            currencySymbol={currency}
            lang={lang}
          />
        )}

        {activeTab === 'budget' && (
          <BudgetManager
            budgets={budgets}
            transactions={transactions}
            onSaveBudget={handleSaveBudget}
            onDeleteBudget={handleDeleteBudget}
            currencySymbol={currency}
            lang={lang}
          />
        )}

        {activeTab === 'savings' && (
          <SavingsGoals
            goals={goals}
            onAddGoal={handleAddGoal}
            onEditGoal={handleEditGoal}
            onDeleteGoal={(g) => {
              setItemToDelete({
                type: 'goal',
                item: g,
                name: g.title,
              });
            }}
            currencySymbol={currency}
            lang={lang}
          />
        )}

        {activeTab === 'debts' && (
          <DebtManager
            debts={debts}
            onAddDebt={handleAddDebt}
            onEditDebt={handleEditDebt}
            onDeleteDebt={(d) => {
              setItemToDelete({
                type: 'debt',
                item: d,
                name: `${d.personName} (${formatCurrency(d.amount, currency)})`,
              });
            }}
            currencySymbol={currency}
            lang={lang}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsView
            transactions={transactions}
            members={members}
            currencySymbol={currency}
            lang={lang}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            transactions={transactions}
            members={members}
            budgets={budgets}
            goals={goals}
            debts={debts}
            onRestoreAllData={handleRestoreAllData}
            onResetToSampleData={handleResetToSampleData}
            onClearAllData={handleClearAllData}
            onOpenApkModal={() => setIsApkModalOpen(true)}
          />
        )}
      </main>

      {/* MOBILE STICKY BOTTOM NAVIGATION BAR (Requirement 5) */}
      <div className="no-print lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 flex items-center justify-around shadow-lg">
        {/* Dashboard */}
        <button
          onClick={() => {
            setActiveTab('dashboard');
            setIsMoreMenuOpen(false);
          }}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer min-w-[56px] min-h-[48px] ${
            activeTab === 'dashboard' && !isMoreMenuOpen
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <span className="text-xl">🏠</span>
          <span className="text-[10px] mt-0.5">{lang === 'bn' ? 'ড্যাশবোর্ড' : 'Home'}</span>
        </button>

        {/* Transactions */}
        <button
          onClick={() => {
            setActiveTab('transactions');
            setIsMoreMenuOpen(false);
          }}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer min-w-[56px] min-h-[48px] ${
            activeTab === 'transactions' && !isMoreMenuOpen
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <span className="text-xl">📋</span>
          <span className="text-[10px] mt-0.5">{lang === 'bn' ? 'লেনদেন' : 'Ledger'}</span>
        </button>

        {/* Floating Center Quick-Add button */}
        <button
          onClick={() => setIsQuickAddOpen(true)}
          className="w-12 h-12 -mt-5 rounded-full bg-indigo-600 hover:bg-indigo-700 active:scale-90 text-white shadow-md flex items-center justify-center text-2xl font-bold cursor-pointer transition-all border-4 border-[#F1F5F9] dark:border-slate-950"
          title="Add Income or Expense"
        >
          ➕
        </button>

        {/* Reports */}
        <button
          onClick={() => {
            setActiveTab('reports');
            setIsMoreMenuOpen(false);
          }}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer min-w-[56px] min-h-[48px] ${
            activeTab === 'reports' && !isMoreMenuOpen
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <span className="text-xl">📊</span>
          <span className="text-[10px] mt-0.5">{lang === 'bn' ? 'রিপোর্ট' : 'Reports'}</span>
        </button>

        {/* More Menu Drawer Trigger */}
        <button
          onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer min-w-[56px] min-h-[48px] ${
            isMoreMenuOpen || ['members', 'budget', 'savings', 'debts', 'settings'].includes(activeTab)
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <span className="text-xl">⋯</span>
          <span className="text-[10px] mt-0.5">{lang === 'bn' ? 'আরও' : 'More'}</span>
        </button>
      </div>

      {/* MOBILE "MORE" SHEET DRAWER */}
      {isMoreMenuOpen && (
        <div className="no-print fixed inset-0 z-50 flex flex-col justify-end bg-slate-900/50 backdrop-blur-xs lg:hidden">
          <div
            className="flex-1"
            onClick={() => setIsMoreMenuOpen(false)}
          />
          <div className="bg-white dark:bg-slate-900 rounded-t-2xl p-6 border-t border-slate-200 dark:border-slate-800 shadow-xl space-y-3 max-h-[80vh] overflow-y-auto">
            <div className="w-12 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-3" />
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 mb-2">
              {lang === 'bn' ? 'পারিবারিক মেনু ও ব্যবস্থাপনা' : 'Family Menu'}
            </h3>

            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'members', icon: '👨‍👩‍👧', bn: 'পরিবারের সদস্য', en: 'Family Members' },
                { id: 'budget', icon: '💰', bn: 'মাসিক বাজেট', en: 'Category Budget' },
                { id: 'savings', icon: '🏦', bn: 'সঞ্চয় লক্ষ্য', en: 'Savings Goals' },
                { id: 'debts', icon: '🤝', bn: 'ধার ও পাওনা', en: 'Debts & Receivables' },
                { id: 'reports', icon: '📊', bn: 'আর্থিক রিপোর্ট', en: 'Reports & Print' },
                { id: 'settings', icon: '⚙️', bn: 'অ্যাপ সেটিংস', en: 'App Settings' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMoreMenuOpen(false);
                  }}
                  className={`p-3.5 rounded-xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                    activeTab === item.id
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-700 dark:text-indigo-300 font-semibold'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="text-xs sm:text-sm font-semibold">{lang === 'bn' ? item.bn : item.en}</span>
                </button>
              ))}

              {/* Mobile APK Modal Trigger */}
              <button
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  setIsApkModalOpen(true);
                }}
                className="col-span-2 p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-left transition-all flex items-center gap-2.5 cursor-pointer"
              >
                <span className="text-xl">📲</span>
                <div className="flex-1">
                  <div className="text-xs sm:text-sm font-bold">{lang === 'bn' ? 'অ্যান্ড্রয়েড APK ও শেয়ার লিংক' : 'Android APK & Share Link'}</div>
                  <div className="text-[11px] text-indigo-600 dark:text-indigo-400">{lang === 'bn' ? 'ফোনে ইনস্টল বা শেয়ার করুন' : 'Install on phone or copy link'}</div>
                </div>
              </button>
            </div>

            <button
              onClick={() => setIsMoreMenuOpen(false)}
              className="w-full py-2.5 mt-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs sm:text-sm cursor-pointer"
            >
              {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
            </button>
          </div>
        </div>
      )}

      {/* MOBILE QUICK ADD MODAL (Income vs Expense Choice) */}
      {isQuickAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-sm w-full space-y-4 text-center">
            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
              {lang === 'bn' ? 'নতুন লেনদেন নির্বাচন করুন' : 'Select Transaction'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {lang === 'bn' ? 'আপনি কি আয় নাকি ব্যয় যোগ করতে চান?' : 'Would you like to record an income or expense?'}
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => {
                  setIsQuickAddOpen(false);
                  setEditingTransaction(null);
                  setIsIncomeModalOpen(true);
                }}
                className="p-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm flex flex-col items-center gap-2 shadow-xs cursor-pointer active:scale-98 transition-all"
              >
                <span className="text-2xl">💰</span>
                <span>{lang === 'bn' ? 'আয় যোগ করুন' : 'Add Income'}</span>
              </button>

              <button
                onClick={() => {
                  setIsQuickAddOpen(false);
                  setEditingTransaction(null);
                  setIsExpenseModalOpen(true);
                }}
                className="p-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm flex flex-col items-center gap-2 shadow-xs cursor-pointer active:scale-98 transition-all"
              >
                <span className="text-2xl">💸</span>
                <span>{lang === 'bn' ? 'ব্যয় যোগ করুন' : 'Add Expense'}</span>
              </button>
            </div>

            <button
              onClick={() => setIsQuickAddOpen(false)}
              className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-semibold cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              {lang === 'bn' ? 'বাতিল' : 'Cancel'}
            </button>
          </div>
        </div>
      )}

      {/* INCOME FORM MODAL */}
      {isIncomeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-xl w-full p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>💰</span>
                <span>
                  {editingTransaction
                    ? (lang === 'bn' ? 'আয় সম্পাদনা করুন' : 'Edit Income')
                    : (lang === 'bn' ? 'নতুন আয় যুক্ত করুন' : 'Add New Income')}
                </span>
              </h3>
              <button
                onClick={() => {
                  setIsIncomeModalOpen(false);
                  setEditingTransaction(null);
                }}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center cursor-pointer transition-colors"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <IncomeForm
              members={members}
              initialData={editingTransaction?.type === 'income' ? editingTransaction : undefined}
              onSave={(tx) => {
                handleSaveTransaction(tx);
                setIsIncomeModalOpen(false);
                setEditingTransaction(null);
              }}
              onCancel={() => {
                setIsIncomeModalOpen(false);
                setEditingTransaction(null);
              }}
              currencySymbol={currency}
              lang={lang}
            />
          </div>
        </div>
      )}

      {/* EXPENSE FORM MODAL */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-xl w-full p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>💸</span>
                <span>
                  {editingTransaction
                    ? (lang === 'bn' ? 'ব্যয় সম্পাদনা করুন' : 'Edit Expense')
                    : (lang === 'bn' ? 'নতুন ব্যয় যুক্ত করুন' : 'Add New Expense')}
                </span>
              </h3>
              <button
                onClick={() => {
                  setIsExpenseModalOpen(false);
                  setEditingTransaction(null);
                }}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center cursor-pointer transition-colors"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <ExpenseForm
              members={members}
              budgets={budgets}
              transactions={transactions}
              initialData={editingTransaction?.type === 'expense' ? editingTransaction : undefined}
              onSave={(tx) => {
                handleSaveTransaction(tx);
                setIsExpenseModalOpen(false);
                setEditingTransaction(null);
              }}
              onCancel={() => {
                setIsExpenseModalOpen(false);
                setEditingTransaction(null);
              }}
              currencySymbol={currency}
              lang={lang}
            />
          </div>
        </div>
      )}

      {/* ITEM DELETION CONFIRMATION DIALOG */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md w-full">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg mb-2 flex items-center gap-2">
              <span>🗑️</span>
              <span>{lang === 'bn' ? 'মুছে ফেলার নিশ্চিতকরণ' : 'Confirm Deletion'}</span>
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
              {lang === 'bn' ? 'আপনি কি নিশ্চিতভাবে ' : 'Are you sure you want to delete '}
              <b>"{itemToDelete.name}"</b>
              {lang === 'bn' ? ' মুছে ফেলতে চান?' : '?'}
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (itemToDelete.type === 'transaction') {
                    handleDeleteTransaction(itemToDelete.item);
                  } else if (itemToDelete.type === 'member') {
                    handleDeleteMember(itemToDelete.item);
                  } else if (itemToDelete.type === 'goal') {
                    handleDeleteGoal(itemToDelete.item);
                  } else if (itemToDelete.type === 'debt') {
                    handleDeleteDebt(itemToDelete.item);
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-white font-semibold text-sm cursor-pointer transition-all"
              >
                {lang === 'bn' ? 'হ্যাঁ, মুছে ফেলুন' : 'Yes, Delete'}
              </button>
              <button
                onClick={() => setItemToDelete(null)}
                className="py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                {lang === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* APK & App Sharing Modal */}
      <ApkInstallModal
        isOpen={isApkModalOpen}
        onClose={() => setIsApkModalOpen(false)}
        lang={lang}
      />
    </div>
  );
}
