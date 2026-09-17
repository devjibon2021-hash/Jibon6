import { Transaction } from '../types';

export function toBengaliDigits(num: number | string): string {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num.toString().replace(/[0-9]/g, (w) => bengaliDigits[+w]);
}

export function formatCurrency(
  amount: number,
  currencySymbol = '৳',
  useBengaliDigits = false
): string {
  const rounded = Number(amount || 0);
  const formattedStandard = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(rounded);

  if (useBengaliDigits) {
    return `${currencySymbol} ${toBengaliDigits(formattedStandard)}`;
  }
  return `${currencySymbol} ${formattedStandard}`;
}

export function getTodayDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentTime(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function formatDate(dateStr: string, lang: string = 'bn'): string {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    if (lang === 'bn') {
      const monthsBn = [
        'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
        'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
      ];
      return `${day} ${monthsBn[month - 1]}, ${year}`;
    } else {
      return date.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }
  } catch {
    return dateStr;
  }
}

export function formatMonthYear(year: number, month: number, lang: string = 'bn'): string {
  const monthsBn = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
  ];
  const monthsEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  if (lang === 'bn') {
    return `${monthsBn[month - 1]} ${year}`;
  }
  return `${monthsEn[month - 1]} ${year}`;
}

export function generateTxnId(): string {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `TXN-${rand}`;
}

export function exportTransactionsToCSV(
  transactions: Transaction[],
  currencySymbol = '৳'
): void {
  // UTF-8 BOM for Excel to render Bengali characters properly
  const BOM = '\uFEFF';
  const headers = ['Transaction ID', 'Date', 'Time', 'Type', 'Member', 'Category', 'Subcategory', `Amount (${currencySymbol})`, 'Payment Method', 'Note'];

  const rows = transactions.map((t) => [
    t.id,
    t.date,
    t.time,
    t.type === 'income' ? 'আয় (Income)' : 'ব্যয় (Expense)',
    `"${(t.memberName || '').replace(/"/g, '""')}"`,
    `"${(t.category || '').replace(/"/g, '""')}"`,
    `"${(t.subcategory || '').replace(/"/g, '""')}"`,
    t.amount,
    `"${(t.paymentMethod || '').replace(/"/g, '""')}"`,
    `"${(t.note || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = BOM + [headers.join(','), ...rows.map((e) => e.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `family_finance_transactions_${getTodayDate()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function printCurrentReport(): void {
  window.print();
}
