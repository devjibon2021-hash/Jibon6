export type TransactionType = 'income' | 'expense';

export type PaymentMethod = 'cash' | 'bank' | 'mobile_banking' | 'other';

export interface Transaction {
  id: string; // e.g. TXN-1001
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  type: TransactionType;
  memberId: string;
  memberName: string;
  category: string;
  subcategory?: string;
  amount: number;
  paymentMethod: PaymentMethod;
  note?: string;
  receiptImage?: string; // Base64 data URL of receipt / memo photo
  createdAt: number;
}

export interface FamilyMember {
  id: string;
  name: string;
  role: string; // বাবা, মা, ভাই, বোন, ইত্যাদি
  avatarColor: string;
  phone?: string;
  monthlyTarget?: number;
}

export interface CategoryBudget {
  category: string;
  amount: number; // Monthly allocated budget in Taka
}

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string; // YYYY-MM-DD
  note?: string;
  createdAt: number;
}

export type DebtType = 'receivable' | 'payable'; // 'receivable' = আমি পাব, 'payable' = আমি দেব
export type DebtStatus = 'pending' | 'partial' | 'paid'; // বাকি, আংশিক, সম্পূর্ণ পরিশোধ

export interface DebtPayment {
  id: string;
  date: string;
  amount: number;
  note?: string;
}

export interface DebtItem {
  id: string;
  type: DebtType;
  personName: string;
  phone: string;
  amount: number;
  paidAmount: number;
  date: string;
  dueDate: string;
  note?: string;
  status: DebtStatus;
  payments: DebtPayment[];
  createdAt: number;
}

export interface AppSettings {
  appName: string;
  currencySymbol: string; // default ৳
  currencyCode: string; // BDT
  language: 'bn' | 'en';
  theme: 'light' | 'dark';
  numberFormat: 'bengali' | 'english'; // ১২৩৪ vs 1234
  lastBackupDate?: string;
}

export type ActiveTab =
  | 'dashboard'
  | 'income'
  | 'expense'
  | 'transactions'
  | 'members'
  | 'budget'
  | 'savings'
  | 'debts'
  | 'reports'
  | 'settings';
