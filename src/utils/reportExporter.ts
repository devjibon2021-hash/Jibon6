import { FamilyMember, Transaction } from '../types';
import { registerPlugin } from '@capacitor/core';
import { formatCurrency, formatDate, formatMonthYear, getTodayDate } from './formatters';

interface MonthlyReportData {
  year: number;
  month: number;
  monthName: string;
  monthlyIncome: number;
  monthlyExpense: number;
  monthlyBalance: number;
  monthlySavingsRate: number;
  categoryExpenseList: { category: string; amount: number; percent: number }[];
  highestExpenseCategory: { category: string; amount: number; percent: number } | null;
  highestIncomeSource: [string, number] | null;
  memberMonthlyStats: { id: string; name: string; role: string; income: number; expense: number; balance: number }[];
  monthTxs: Transaction[];
  currencySymbol: string;
  lang: 'bn' | 'en';
}

interface AnnualReportData {
  year: number;
  annualTotalIncome: number;
  annualTotalExpense: number;
  annualTotalBalance: number;
  annualAvgSavingsRate: number;
  annualMonths: {
    monthNumber: number;
    name: string;
    income: number;
    expense: number;
    balance: number;
    savingsRate: number;
  }[];
  yearTxs: Transaction[];
  currencySymbol: string;
  lang: 'bn' | 'en';
}

// Utility to safely escape CSV values
function escapeCSV(val: string | number | undefined | null): string {
  if (val === undefined || val === null) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

// Helper to trigger file download
function triggerDownload(content: string, filename: string, mimeType: string = 'text/csv;charset=utf-8;'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generates and downloads a comprehensive Monthly Report CSV file
 */
export function exportMonthlyReportCSV(data: MonthlyReportData): void {
  const BOM = '\uFEFF'; // UTF-8 Byte Order Mark for Excel
  const lines: string[] = [];

  const appName = 'টুকটুকির সংসার – Family Finance';
  const isBn = data.lang === 'bn';

  // 1. Header Information
  lines.push(`${escapeCSV(appName)},${escapeCSV('')},${escapeCSV('')},${escapeCSV('')},${escapeCSV('')}`);
  lines.push(`${escapeCSV(isBn ? 'মাসিক আর্থিক বিবরণী (Monthly Financial Statement)' : 'Monthly Financial Statement')},${escapeCSV(formatMonthYear(data.year, data.month, data.lang))}`);
  lines.push(`${escapeCSV(isBn ? 'রিপোর্ট তৈরির তারিখ' : 'Report Generated Date')},${escapeCSV(formatDate(getTodayDate(), data.lang))}`);
  lines.push(`${escapeCSV(isBn ? 'মুদ্রা' : 'Currency')},${escapeCSV(data.currencySymbol)}`);
  lines.push('');

  // 2. Executive Summary
  lines.push(escapeCSV(isBn ? '--- ১. আর্থিক সারাংশ (Executive Summary) ---' : '--- 1. Executive Summary ---'));
  lines.push(`${escapeCSV(isBn ? 'সূচক (Metric)' : 'Metric')},${escapeCSV(isBn ? 'পরিমাণ (Amount)' : 'Amount')}`);
  lines.push(`${escapeCSV(isBn ? 'মোট মাসিক আয় (Total Income)' : 'Total Income')},${escapeCSV(data.monthlyIncome)}`);
  lines.push(`${escapeCSV(isBn ? 'মোট মাসিক ব্যয় (Total Expense)' : 'Total Expense')},${escapeCSV(data.monthlyExpense)}`);
  lines.push(`${escapeCSV(isBn ? 'নিট ব্যালেন্স / উদ্বৃত্ত (Net Balance)' : 'Net Balance')},${escapeCSV(data.monthlyBalance)}`);
  lines.push(`${escapeCSV(isBn ? 'সঞ্চয়ের হার (Savings Rate %)' : 'Savings Rate %')},${escapeCSV(`${data.monthlySavingsRate.toFixed(2)}%`)}`);
  lines.push('');

  // 3. Category Breakdown
  lines.push(escapeCSV(isBn ? '--- ২. খাতভিত্তিক ব্যয় বিবরণী (Category-wise Expenses) ---' : '--- 2. Category-wise Expenses ---'));
  lines.push(`${escapeCSV(isBn ? 'ব্যয়ের খাত (Category)' : 'Category')},${escapeCSV(isBn ? 'মোট পরিমাণ (Amount)' : 'Amount')},${escapeCSV(isBn ? 'শতকরা হার (Percentage)' : 'Percentage')}`);
  if (data.categoryExpenseList.length > 0) {
    data.categoryExpenseList.forEach((cat) => {
      lines.push(`${escapeCSV(cat.category)},${escapeCSV(cat.amount)},${escapeCSV(`${cat.percent.toFixed(1)}%`)}`);
    });
  } else {
    lines.push(`${escapeCSV(isBn ? 'কোনো ব্যয় নেই' : 'No expenses recorded')},0,0%`);
  }
  lines.push('');

  // 4. Member Contributions
  lines.push(escapeCSV(isBn ? '--- ৩. সদস্যভিত্তিক আর্থিক হিসাব (Member Contributions) ---' : '--- 3. Member Contributions ---'));
  lines.push(`${escapeCSV(isBn ? 'সদস্যের নাম (Member)' : 'Member')},${escapeCSV(isBn ? 'ভূমিকা (Role)' : 'Role')},${escapeCSV(isBn ? 'আয় (Income)' : 'Income')},${escapeCSV(isBn ? 'ব্যয় (Expense)' : 'Expense')},${escapeCSV(isBn ? 'ব্যালেন্স (Balance)' : 'Balance')}`);
  data.memberMonthlyStats.forEach((m) => {
    lines.push(`${escapeCSV(m.name)},${escapeCSV(m.role)},${escapeCSV(m.income)},${escapeCSV(m.expense)},${escapeCSV(m.balance)}`);
  });
  lines.push('');

  // 5. Itemized Transactions Ledger
  lines.push(escapeCSV(isBn ? '--- ৪. এই মাসের সকল লেনদেনের বিস্তারিত খতিয়ান (Itemized Transaction Ledger) ---' : '--- 4. Itemized Transaction Ledger ---'));
  lines.push([
    escapeCSV(isBn ? 'লেনদেন আইডি (ID)' : 'Txn ID'),
    escapeCSV(isBn ? 'তারিখ (Date)' : 'Date'),
    escapeCSV(isBn ? 'সময় (Time)' : 'Time'),
    escapeCSV(isBn ? 'ধরণ (Type)' : 'Type'),
    escapeCSV(isBn ? 'সদস্য (Member)' : 'Member'),
    escapeCSV(isBn ? 'খাত (Category)' : 'Category'),
    escapeCSV(isBn ? 'উপ-খাত (Subcategory)' : 'Subcategory'),
    escapeCSV(isBn ? `পরিমাণ (${data.currencySymbol})` : `Amount (${data.currencySymbol})`),
    escapeCSV(isBn ? 'পেমেন্ট মাধ্যম (Payment Method)' : 'Payment Method'),
    escapeCSV(isBn ? 'বিবরণ / নোট (Note)' : 'Note'),
  ].join(','));

  data.monthTxs.forEach((t) => {
    lines.push([
      escapeCSV(t.id),
      escapeCSV(t.date),
      escapeCSV(t.time || ''),
      escapeCSV(t.type === 'income' ? (isBn ? 'আয় (Income)' : 'Income') : (isBn ? 'ব্যয় (Expense)' : 'Expense')),
      escapeCSV(t.memberName || ''),
      escapeCSV(t.category || ''),
      escapeCSV(t.subcategory || ''),
      escapeCSV(t.amount),
      escapeCSV(t.paymentMethod || ''),
      escapeCSV(t.note || ''),
    ].join(','));
  });

  const csvContent = BOM + lines.join('\r\n');
  const monthStr = String(data.month).padStart(2, '0');
  const filename = `tuktukir_sangsar_monthly_${data.year}_${monthStr}.csv`;
  triggerDownload(csvContent, filename);
}

/**
 * Generates and downloads a comprehensive Annual Report CSV file
 */
export function exportAnnualReportCSV(data: AnnualReportData): void {
  const BOM = '\uFEFF';
  const lines: string[] = [];

  const appName = 'টুকটুকির সংসার – Family Finance';
  const isBn = data.lang === 'bn';

  // Header
  lines.push(`${escapeCSV(appName)},${escapeCSV('')},${escapeCSV('')},${escapeCSV('')},${escapeCSV('')}`);
  lines.push(`${escapeCSV(isBn ? 'বার্ষিক আর্থিক বিবরণী (Annual Financial Statement)' : 'Annual Financial Statement')},${escapeCSV(String(data.year))}`);
  lines.push(`${escapeCSV(isBn ? 'রিপোর্ট তৈরির তারিখ' : 'Report Generated Date')},${escapeCSV(formatDate(getTodayDate(), data.lang))}`);
  lines.push(`${escapeCSV(isBn ? 'মুদ্রা' : 'Currency')},${escapeCSV(data.currencySymbol)}`);
  lines.push('');

  // Executive Summary
  lines.push(escapeCSV(isBn ? '--- ১. বার্ষিক সারাংশ (Annual Summary) ---' : '--- 1. Annual Summary ---'));
  lines.push(`${escapeCSV(isBn ? 'সূচক (Metric)' : 'Metric')},${escapeCSV(isBn ? 'পরিমাণ (Amount)' : 'Amount')}`);
  lines.push(`${escapeCSV(isBn ? 'মোট বার্ষিক আয় (Total Annual Income)' : 'Total Annual Income')},${escapeCSV(data.annualTotalIncome)}`);
  lines.push(`${escapeCSV(isBn ? 'মোট বার্ষিক ব্যয় (Total Annual Expense)' : 'Total Annual Expense')},${escapeCSV(data.annualTotalExpense)}`);
  lines.push(`${escapeCSV(isBn ? 'মোট বার্ষিক সঞ্চয় (Net Annual Savings)' : 'Net Annual Savings')},${escapeCSV(data.annualTotalBalance)}`);
  lines.push(`${escapeCSV(isBn ? 'গড় বার্ষিক সঞ্চয়ের হার (Avg Savings Rate %)' : 'Avg Savings Rate %')},${escapeCSV(`${data.annualAvgSavingsRate.toFixed(2)}%`)}`);
  lines.push('');

  // 12-Month Breakdown
  lines.push(escapeCSV(isBn ? '--- ২. মাসভিত্তিক তুলনামূলক হিসাব (Month-by-Month Statement) ---' : '--- 2. Month-by-Month Statement ---'));
  lines.push(`${escapeCSV(isBn ? 'মাস (Month)' : 'Month')},${escapeCSV(isBn ? 'আয় (Income)' : 'Income')},${escapeCSV(isBn ? 'ব্যয় (Expense)' : 'Expense')},${escapeCSV(isBn ? 'ব্যালেন্স (Balance)' : 'Balance')},${escapeCSV(isBn ? 'সঞ্চয়ের হার % (Savings Rate %)' : 'Savings Rate %')}`);

  data.annualMonths.forEach((m) => {
    lines.push(`${escapeCSV(m.name)},${escapeCSV(m.income)},${escapeCSV(m.expense)},${escapeCSV(m.balance)},${escapeCSV(`${m.savingsRate.toFixed(1)}%`)}`);
  });

  // Total Row
  lines.push(`${escapeCSV(isBn ? 'সর্বমোট (Total)' : 'Grand Total')},${escapeCSV(data.annualTotalIncome)},${escapeCSV(data.annualTotalExpense)},${escapeCSV(data.annualTotalBalance)},${escapeCSV(`${data.annualAvgSavingsRate.toFixed(1)}%`)}`);
  lines.push('');

  // Itemized Ledger for Year
  lines.push(escapeCSV(isBn ? '--- ৩. বছরের সকল লেনদেনের খতিয়ান (Yearly Transactions Ledger) ---' : '--- 3. Yearly Transactions Ledger ---'));
  lines.push([
    escapeCSV(isBn ? 'লেনদেন আইডি (ID)' : 'Txn ID'),
    escapeCSV(isBn ? 'তারিখ (Date)' : 'Date'),
    escapeCSV(isBn ? 'সময় (Time)' : 'Time'),
    escapeCSV(isBn ? 'ধরণ (Type)' : 'Type'),
    escapeCSV(isBn ? 'সদস্য (Member)' : 'Member'),
    escapeCSV(isBn ? 'খাত (Category)' : 'Category'),
    escapeCSV(isBn ? `পরিমাণ (${data.currencySymbol})` : `Amount (${data.currencySymbol})`),
    escapeCSV(isBn ? 'পেমেন্ট মাধ্যম (Payment Method)' : 'Payment Method'),
    escapeCSV(isBn ? 'বিবরণ (Note)' : 'Note'),
  ].join(','));

  data.yearTxs.forEach((t) => {
    lines.push([
      escapeCSV(t.id),
      escapeCSV(t.date),
      escapeCSV(t.time || ''),
      escapeCSV(t.type === 'income' ? (isBn ? 'আয় (Income)' : 'Income') : (isBn ? 'ব্যয় (Expense)' : 'Expense')),
      escapeCSV(t.memberName || ''),
      escapeCSV(t.category || ''),
      escapeCSV(t.amount),
      escapeCSV(t.paymentMethod || ''),
      escapeCSV(t.note || ''),
    ].join(','));
  });

  const csvContent = BOM + lines.join('\r\n');
  const filename = `tuktukir_sangsar_annual_${data.year}.csv`;
  triggerDownload(csvContent, filename);
}

interface NativePrintPlugin {
  printReport(options: { html: string; jobName: string }): Promise<void>;
  savePdf(options: { html: string; fileName: string }): Promise<{ fileName: string; uri?: string }>;
}

const NativePrint = registerPlugin<NativePrintPlugin>('NativePrint');

function buildPrintableHtml(options: {
  title: string;
  periodText: string;
  elementId?: string;
  lang?: 'bn' | 'en';
}): string | null {
  const printableEl = document.getElementById(options.elementId || 'printable-report-area');
  if (!printableEl) return null;

  const isBn = options.lang !== 'en';
  return `
    <!DOCTYPE html>
    <html lang="${isBn ? 'bn' : 'en'}">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${options.title} - ${options.periodText}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          @page { size: A4 portrait; margin: 12mm 15mm; }
          body {
            font-family: 'Noto Sans Bengali', 'Hind Siliguri', 'Noto Sans', system-ui, sans-serif;
            color: #0f172a; background: #ffffff; font-size: 10pt; line-height: 1.5;
            -webkit-print-color-adjust: exact; print-color-adjust: exact; padding: 15px;
          }
          .report-container { width: 100%; max-width: 800px; margin: 0 auto; }
          h1, h2, h3, h4 { color: #0f172a; line-height: 1.25; }
          .border-bottom { border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px; }
          .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
          .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 20px; }
          .stat-card { border: 1px solid #cbd5e1; background: #f8fafc; border-radius: 8px; padding: 10px 14px; }
          .stat-title { font-size: 8pt; font-weight: 600; color: #475569; text-transform: uppercase; margin-bottom: 4px; }
          .stat-value { font-size: 15pt; font-weight: 800; }
          .text-emerald { color: #059669; } .text-rose { color: #e11d48; } .text-indigo { color: #4338ca; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 22px; font-size: 9pt; }
          th, td { border: 1px solid #e2e8f0; padding: 7px 10px; text-align: left; }
          th { background-color: #f1f5f9; color: #334155; font-weight: 700; font-size: 8.5pt; }
          tr:nth-child(even) td { background-color: #f8fafc; }
          .text-right { text-align: right; } .font-bold { font-weight: 700; }
          .font-mono { font-family: monospace; font-size: 8pt; }
          .avoid-break { break-inside: avoid; page-break-inside: avoid; }
          .signatures { margin-top: 35px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; text-align: center; padding-top: 15px; }
          .sig-line { border-top: 1px dashed #94a3b8; padding-top: 6px; font-size: 8.5pt; color: #475569; font-weight: 600; }
          .footer { margin-top: 25px; padding-top: 10px; border-top: 1px solid #cbd5e1; display: flex; justify-content: space-between; font-size: 8pt; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="report-container">
          ${printableEl.innerHTML}
          <div class="avoid-break signatures">
            <div><div class="sig-line">${isBn ? 'হিসাব প্রস্তুতকারক' : 'Prepared By'}</div></div>
            <div><div class="sig-line">${isBn ? 'যাচাইকারী' : 'Verified By'}</div></div>
            <div><div class="sig-line">${isBn ? 'পারিবারিক প্রধান / অভিভাবক' : 'Head of Family'}</div></div>
          </div>
          <div class="footer">
            <span>টুকটুকির সংসার – Family Finance Management Application</span>
            <span>স্বয়ংক্রিয়ভাবে তৈরি আর্থিক বিবরণী | Confidential</span>
          </div>
        </div>
      </body>
    </html>
  `;
}

/** Export the visible financial report as a real PDF file on Android. */
export async function exportReportToPDF(options: {
  title: string;
  periodText: string;
  elementId?: string;
  lang?: 'bn' | 'en';
}): Promise<void> {
  const html = buildPrintableHtml(options);
  if (!html) {
    window.print();
    return;
  }

  try {
    const fileName = `tuktukir_sangsar_${options.periodText.replace(/[^0-9A-Za-z\u0980-\u09FF_-]+/g, '_')}.pdf`;
    await NativePrint.savePdf({ html, fileName });
    alert(options.lang === 'en'
      ? 'PDF saved successfully in the Downloads folder.'
      : 'PDF সফলভাবে ফোনের Downloads ফোল্ডারে সংরক্ষণ করা হয়েছে।');
  } catch (error) {
    console.warn('Native PDF export unavailable; using browser print fallback.', error);
    // Web/PWA fallback: browser print dialog can still choose Save as PDF.
    const printableEl = document.getElementById(options.elementId || 'printable-report-area');
    if (!printableEl) { window.print(); return; }
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed'; iframe.style.right = '0'; iframe.style.bottom = '0';
    iframe.style.width = '0'; iframe.style.height = '0'; iframe.style.border = '0';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (!doc) { window.print(); iframe.remove(); return; }
    doc.open(); doc.write(html); doc.close();
    setTimeout(() => {
      try { iframe.contentWindow?.focus(); iframe.contentWindow?.print(); }
      finally { setTimeout(() => iframe.remove(), 2000); }
    }, 500);
  }
}

/** Open the Android system print dialog for the current financial report. */
export async function printFinancialReport(options: {
  title: string;
  periodText: string;
  elementId?: string;
  lang?: 'bn' | 'en';
}): Promise<void> {
  const html = buildPrintableHtml(options);
  if (!html) { window.print(); return; }

  try {
    await NativePrint.printReport({ html, jobName: `${options.title} - ${options.periodText}` });
  } catch (error) {
    console.warn('Native print unavailable; using browser print fallback.', error);
    window.print();
  }
}
