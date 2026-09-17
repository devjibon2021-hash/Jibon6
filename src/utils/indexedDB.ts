import { Transaction, FamilyMember, CategoryBudget, SavingsGoal, DebtItem, AppSettings } from '../types';

const DB_NAME = 'FamilyFinanceDB';
const DB_VERSION = 1;

export const STORES = {
  TRANSACTIONS: 'transactions',
  MEMBERS: 'members',
  BUDGETS: 'budgets',
  SAVINGS: 'savings',
  DEBTS: 'debts',
  SETTINGS: 'settings',
} as const;

export type StoreName = typeof STORES[keyof typeof STORES] | 'savings_goals';

function resolveStoreName(name: StoreName): typeof STORES[keyof typeof STORES] {
  if (name === 'savings_goals') return STORES.SAVINGS;
  return name;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORES.TRANSACTIONS)) {
        const txStore = db.createObjectStore(STORES.TRANSACTIONS, { keyPath: 'id' });
        txStore.createIndex('date', 'date', { unique: false });
        txStore.createIndex('type', 'type', { unique: false });
        txStore.createIndex('memberId', 'memberId', { unique: false });
        txStore.createIndex('category', 'category', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.MEMBERS)) {
        db.createObjectStore(STORES.MEMBERS, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORES.BUDGETS)) {
        db.createObjectStore(STORES.BUDGETS, { keyPath: 'category' });
      }

      if (!db.objectStoreNames.contains(STORES.SAVINGS)) {
        db.createObjectStore(STORES.SAVINGS, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORES.DEBTS)) {
        db.createObjectStore(STORES.DEBTS, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// LocalStorage fallback in case IndexedDB fails or is unavailable in certain sandboxes
function getFallback<T>(store: StoreName): T[] {
  try {
    const raw = localStorage.getItem(`ff_${store}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setFallback<T>(store: StoreName, data: T[]): void {
  try {
    localStorage.setItem(`ff_${store}`, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export async function getAllFromStore<T>(rawStoreName: StoreName): Promise<T[]> {
  const storeName = resolveStoreName(rawStoreName);
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result as T[];
        // Mirror to fallback
        setFallback(storeName, results);
        resolve(results || []);
      };
      request.onerror = () => {
        resolve(getFallback<T>(storeName));
      };
    });
  } catch {
    return getFallback<T>(storeName);
  }
}

export async function saveToStore<T extends Record<string, any>>(rawStoreName: StoreName, item: T): Promise<void> {
  const storeName = resolveStoreName(rawStoreName);
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(item);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    // fallback
    const list = getFallback<T>(storeName);
    const keyProp = storeName === STORES.BUDGETS ? 'category' : storeName === STORES.SETTINGS ? 'key' : 'id';
    const index = list.findIndex((x) => x[keyProp] === item[keyProp]);
    if (index >= 0) {
      list[index] = item;
    } else {
      list.push(item);
    }
    setFallback(storeName, list);
  }
}

export async function deleteFromStore(rawStoreName: StoreName, key: string): Promise<void> {
  const storeName = resolveStoreName(rawStoreName);
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    // fallback
    const keyProp = storeName === STORES.BUDGETS ? 'category' : storeName === STORES.SETTINGS ? 'key' : 'id';
    const list = getFallback<any>(storeName).filter((x) => x[keyProp] !== key);
    setFallback(storeName, list);
  }
}

export async function initDB(): Promise<IDBDatabase> {
  return openDB();
}

export async function clearStore(rawStoreName: StoreName): Promise<void> {
  const storeName = resolveStoreName(rawStoreName);
  try {
    const db = await openDB();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // ignore
  }
  try {
    localStorage.removeItem(`ff_${storeName}`);
  } catch {
    // ignore
  }
}

export async function clearAllStores(): Promise<void> {
  for (const storeName of Object.values(STORES)) {
    try {
      const db = await openDB();
      await new Promise<void>((resolve) => {
        const tx = db.transaction(storeName, 'readwrite');
        tx.objectStore(storeName).clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    } catch {
      // ignore
    }
    localStorage.removeItem(`ff_${storeName}`);
  }
}

export interface BackupData {
  version: number;
  exportDate: string;
  transactions: Transaction[];
  members: FamilyMember[];
  budgets: CategoryBudget[];
  savings: SavingsGoal[];
  debts: DebtItem[];
  settings?: AppSettings;
}

export async function exportDatabase(): Promise<BackupData> {
  const transactions = await getAllFromStore<Transaction>(STORES.TRANSACTIONS);
  const members = await getAllFromStore<FamilyMember>(STORES.MEMBERS);
  const budgets = await getAllFromStore<CategoryBudget>(STORES.BUDGETS);
  const savings = await getAllFromStore<SavingsGoal>(STORES.SAVINGS);
  const debts = await getAllFromStore<DebtItem>(STORES.DEBTS);
  const settingsArray = await getAllFromStore<any>(STORES.SETTINGS);

  const settingsObj = settingsArray.find(s => s.key === 'app_settings')?.value;

  return {
    version: DB_VERSION,
    exportDate: new Date().toISOString(),
    transactions,
    members,
    budgets,
    savings,
    debts,
    settings: settingsObj,
  };
}

export async function importDatabase(data: BackupData): Promise<void> {
  await clearAllStores();

  for (const t of data.transactions || []) {
    await saveToStore(STORES.TRANSACTIONS, t);
  }
  for (const m of data.members || []) {
    await saveToStore(STORES.MEMBERS, m);
  }
  for (const b of data.budgets || []) {
    await saveToStore(STORES.BUDGETS, b);
  }
  for (const s of data.savings || []) {
    await saveToStore(STORES.SAVINGS, s);
  }
  for (const d of data.debts || []) {
    await saveToStore(STORES.DEBTS, d);
  }
  if (data.settings) {
    await saveToStore(STORES.SETTINGS, { key: 'app_settings', value: data.settings });
  }
}
