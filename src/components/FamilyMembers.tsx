import React, { useState } from 'react';
import { FamilyMember, Transaction } from '../types';
import { MEMBER_ROLES, AVATAR_COLORS } from '../utils/translations';
import { formatCurrency } from '../utils/formatters';

interface FamilyMembersProps {
  members: FamilyMember[];
  transactions: Transaction[];
  onAddMember: (member: FamilyMember) => void;
  onEditMember: (member: FamilyMember) => void;
  onDeleteMember: (member: FamilyMember) => void;
  currencySymbol?: string;
  lang?: 'bn' | 'en';
}

export const FamilyMembers: React.FC<FamilyMembersProps> = ({
  members,
  transactions,
  onAddMember,
  onEditMember,
  onDeleteMember,
  currencySymbol = '৳',
  lang = 'bn',
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [role, setRole] = useState(MEMBER_ROLES[0]);
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [phone, setPhone] = useState('');
  const [monthlyTarget, setMonthlyTarget] = useState('');
  const [formError, setFormError] = useState('');

  const openAddForm = () => {
    setName('');
    setRole(MEMBER_ROLES[0]);
    setAvatarColor(AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]);
    setPhone('');
    setMonthlyTarget('');
    setFormError('');
    setEditingMember(null);
    setIsAdding(true);
  };

  const openEditForm = (m: FamilyMember) => {
    setEditingMember(m);
    setName(m.name);
    setRole(m.role);
    setAvatarColor(m.avatarColor || AVATAR_COLORS[0]);
    setPhone(m.phone || '');
    setMonthlyTarget(m.monthlyTarget ? m.monthlyTarget.toString() : '');
    setFormError('');
    setIsAdding(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError(lang === 'bn' ? 'সদস্যের নাম আবশ্যক' : 'Member name is required');
      return;
    }

    if (editingMember) {
      onEditMember({
        ...editingMember,
        name: name.trim(),
        role,
        avatarColor,
        phone: phone.trim() || undefined,
        monthlyTarget: monthlyTarget ? parseFloat(monthlyTarget) : undefined,
      });
    } else {
      onAddMember({
        id: `mem-${Date.now()}`,
        name: name.trim(),
        role,
        avatarColor,
        phone: phone.trim() || undefined,
        monthlyTarget: monthlyTarget ? parseFloat(monthlyTarget) : undefined,
      });
    }

    setIsAdding(false);
    setEditingMember(null);
  };

  // Calculate statistics per member
  const memberStats = members.map((m) => {
    const memberTxs = transactions.filter((t) => t.memberId === m.id);
    const totalIncome = memberTxs
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = memberTxs
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    const balance = totalIncome - totalExpense;

    return {
      ...m,
      totalIncome,
      totalExpense,
      balance,
      transactionCount: memberTxs.length,
    };
  });

  return (
    <div className="space-y-6">
      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>👨‍👩‍👧</span>
            <span>{lang === 'bn' ? 'পরিবারের সদস্য ব্যবস্থাপনা' : 'Family Members Management'}</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {lang === 'bn'
              ? 'পরিবারের প্রতিটি সদস্যের আয়, ব্যয় ও ব্যক্তিগত ব্যালেন্স ট্র্যাকিং'
              : 'Track income, expense, and individual balance per family member'}
          </p>
        </div>

        <button
          onClick={openAddForm}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-semibold text-sm shadow-xs transition-all flex items-center gap-2 cursor-pointer"
        >
          <span>➕</span>
          <span>{lang === 'bn' ? 'নতুন সদস্য যোগ করুন' : 'Add New Member'}</span>
        </button>
      </div>

      {/* Add / Edit Member Modal / Box */}
      {isAdding && (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-indigo-200 dark:border-indigo-800/60 shadow-xs">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg mb-4 flex items-center gap-2">
            <span>{editingMember ? '✏️' : '👤'}</span>
            <span>
              {editingMember
                ? (lang === 'bn' ? 'সদস্যের তথ্য সম্পাদনা করুন' : 'Edit Member Details')
                : (lang === 'bn' ? 'নতুন পরিবারের সদস্য যোগ করুন' : 'Add New Family Member')}
            </span>
          </h3>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'bn' ? 'নাম' : 'Name'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder={lang === 'bn' ? 'যেমন: মো: রফিকুল ইসলাম' : 'e.g., Rafiqul Islam'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'bn' ? 'পারিবারিক ভূমিকা / সম্পর্ক' : 'Family Role / Relationship'}
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  {MEMBER_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'bn' ? 'মোবাইল নম্বর (ঐচ্ছিক)' : 'Mobile Phone (Optional)'}
                </label>
                <input
                  type="tel"
                  placeholder="017xxxxxxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'bn' ? 'মাসিক আয়ের লক্ষ্যমাত্রা (ঐচ্ছিক)' : 'Monthly Income Target (Optional)'}
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={monthlyTarget}
                  onChange={(e) => setMonthlyTarget(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Avatar Color Picker */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {lang === 'bn' ? 'প্রোফাইল কালার' : 'Avatar Color'}
              </label>
              <div className="flex items-center gap-3">
                {AVATAR_COLORS.map((c) => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => setAvatarColor(c)}
                    className={`w-8 h-8 rounded-full transition-all cursor-pointer ${
                      avatarColor === c ? 'ring-4 ring-offset-2 ring-indigo-500 scale-110' : 'opacity-80 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {formError && <p className="text-xs text-rose-500 font-semibold">{formError}</p>}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all cursor-pointer"
              >
                {lang === 'bn' ? 'সংরক্ষণ করুন' : 'Save Member'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setEditingMember(null);
                }}
                className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                {lang === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Member Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {memberStats.map((m) => {
          const isPositive = m.balance >= 0;
          return (
            <div
              key={m.id}
              className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header info */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-xs"
                      style={{ backgroundColor: m.avatarColor }}
                    >
                      {m.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                        {m.name}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-medium text-slate-700 dark:text-slate-300">
                          {m.role}
                        </span>
                        {m.phone && <span>📞 {m.phone}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditForm(m)}
                      className="p-2 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                      title={lang === 'bn' ? 'সম্পাদনা' : 'Edit'}
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => onDeleteMember(m)}
                      className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer"
                      title={lang === 'bn' ? 'মুছে ফেলুন' : 'Delete'}
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Stat Badges */}
                <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">
                      {lang === 'bn' ? 'আয়' : 'Income'}
                    </span>
                    <span className="font-black text-emerald-700 dark:text-emerald-300 text-sm">
                      {formatCurrency(m.totalIncome, currencySymbol)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">
                      {lang === 'bn' ? 'ব্যয়' : 'Expense'}
                    </span>
                    <span className="font-black text-rose-700 dark:text-rose-300 text-sm">
                      {formatCurrency(m.totalExpense, currencySymbol)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">
                      {lang === 'bn' ? 'ব্যালেন্স' : 'Balance'}
                    </span>
                    <span
                      className={`font-black text-sm ${
                        isPositive ? 'text-indigo-700 dark:text-indigo-300' : 'text-rose-700 dark:text-rose-300'
                      }`}
                    >
                      {formatCurrency(m.balance, currencySymbol)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>
                  {lang === 'bn' ? 'মোট লেনদেন:' : 'Transactions:'}{' '}
                  <b>{m.transactionCount}</b> {lang === 'bn' ? 'টি' : ''}
                </span>
                {m.monthlyTarget && (
                  <span>
                    {lang === 'bn' ? 'টার্গেট:' : 'Target:'}{' '}
                    <b>{formatCurrency(m.monthlyTarget, currencySymbol)}</b>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
