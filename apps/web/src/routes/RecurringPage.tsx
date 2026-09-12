import React, { useState } from 'react';
import {
  RefreshCcw,
  Plus,
  Search,
  Calendar,
  TrendingDown,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Filter,
} from 'lucide-react';
import {
  useRecurring,
  RecurringTransaction,
  CreateRecurringInput,
  UpdateRecurringInput,
  MarkPaidInput,
} from '../features/recurring/api/useRecurring';
import { RecurringCard } from '../features/recurring/RecurringCard';
import { RecurringModal } from '../features/recurring/RecurringModal';
import { MarkPaidModal } from '../features/recurring/MarkPaidModal';
import { formatINR } from '../lib/utils';

export default function RecurringPage() {
  const {
    recurringList,
    totalCount,
    loading,
    error,
    filterType,
    setFilterType,
    filterStatus,
    setFilterStatus,
    searchQuery,
    setSearchQuery,
    refresh,
    createRecurring,
    updateRecurring,
    markPaid,
    deactivateRecurring,
    deleteRecurring,
  } = useRecurring();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RecurringTransaction | null>(null);

  const [isMarkPaidOpen, setIsMarkPaidOpen] = useState(false);
  const [payingItem, setPayingItem] = useState<RecurringTransaction | null>(null);

  // Compute monthly equivalent estimates for active rules
  const activeRules = recurringList.filter(
    (r) => !r.endDate || new Date(r.endDate) >= new Date()
  );

  const calculateMonthlyAmount = (amount: number, freq: string) => {
    switch (freq) {
      case 'WEEKLY':
        return amount * 4.33;
      case 'BIWEEKLY':
        return amount * 2.16;
      case 'MONTHLY':
        return amount;
      case 'QUARTERLY':
        return amount / 3;
      case 'YEARLY':
        return amount / 12;
      default:
        return 0;
    }
  };

  const monthlyOutflow = activeRules
    .filter((r) => r.type === 'EXPENSE')
    .reduce((acc, r) => acc + calculateMonthlyAmount(parseFloat(String(r.amount)), r.frequency), 0);

  const monthlyInflow = activeRules
    .filter((r) => r.type === 'INCOME')
    .reduce((acc, r) => acc + calculateMonthlyAmount(parseFloat(String(r.amount)), r.frequency), 0);

  // Next upcoming payment
  const sortedUpcoming = [...activeRules].sort(
    (a, b) => new Date(a.nextOccurrence).getTime() - new Date(b.nextOccurrence).getTime()
  );
  const nextPayment = sortedUpcoming[0];

  const handleOpenCreate = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: RecurringTransaction) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleOpenMarkPaid = (item: RecurringTransaction) => {
    setPayingItem(item);
    setIsMarkPaidOpen(true);
  };

  const handleSubmitModal = async (input: CreateRecurringInput | UpdateRecurringInput) => {
    if (editingItem) {
      await updateRecurring(editingItem.id, input);
    } else {
      await createRecurring(input as CreateRecurringInput);
    }
  };

  const handleConfirmMarkPaid = async (id: string, input: MarkPaidInput) => {
    await markPaid(id, input);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <RefreshCcw className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            Recurring & Scheduled Payments
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage recurring subscriptions, automated bills, predictable income, and future cash flow projections
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="btn-primary flex items-center gap-2 text-xs font-bold py-2.5 px-4 self-start sm:self-auto shadow-md shadow-brand-500/20"
        >
          <Plus className="w-4 h-4" />
          Add Recurring Rule
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Rules */}
        <div className="card p-4 space-y-1.5 border-l-4 border-l-brand-500">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Active Schedules</span>
            <RefreshCcw className="w-4 h-4 text-brand-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {activeRules.length}
          </p>
          <p className="text-[11px] text-slate-400">
            Out of {totalCount} total configured rules
          </p>
        </div>

        {/* Estimated Monthly Outflow */}
        <div className="card p-4 space-y-1.5 border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Est. Monthly Outflow</span>
            <TrendingDown className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400">
            {formatINR(Math.round(monthlyOutflow))}
          </p>
          <p className="text-[11px] text-slate-400">
            Normalized monthly fixed commitments
          </p>
        </div>

        {/* Estimated Monthly Inflow */}
        <div className="card p-4 space-y-1.5 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Est. Monthly Inflow</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {formatINR(Math.round(monthlyInflow))}
          </p>
          <p className="text-[11px] text-slate-400">
            Normalized predictable revenues
          </p>
        </div>

        {/* Next Due Payment */}
        <div className="card p-4 space-y-1.5 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Next Scheduled</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          {nextPayment ? (
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {nextPayment.description}
              </p>
              <p className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                {formatINR(parseFloat(String(nextPayment.amount)))}
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-1">No active schedule</p>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by description, account, category, or frequency..."
              className="input pl-9 text-xs"
            />
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
            {(['ALL', 'EXPENSE', 'INCOME'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filterType === t
                    ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm font-bold'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {t === 'ALL' ? 'All Types' : t === 'EXPENSE' ? 'Bills/Expenses' : 'Income'}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
            {(['ACTIVE', 'INACTIVE', 'ALL'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filterStatus === s
                    ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm font-bold'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {s === 'ACTIVE' ? 'Active' : s === 'INACTIVE' ? 'Deactivated' : 'All'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Grid */}
      {loading && recurringList.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card h-48 animate-pulse bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      ) : recurringList.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-4">
            <RefreshCcw className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">
            No Recurring Rules Found
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            {searchQuery
              ? 'No rules match your current search query or active filter.'
              : 'Create recurring transactions for your recurring rent, subscriptions, loan EMIs, or monthly paychecks.'}
          </p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="btn-primary mt-5 text-xs font-bold flex items-center gap-1.5 py-2 px-4"
          >
            <Plus className="w-4 h-4" />
            Create First Recurring Rule
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recurringList.map((item) => (
            <RecurringCard
              key={item.id}
              recurring={item}
              onMarkPaid={handleOpenMarkPaid}
              onEdit={handleOpenEdit}
              onDeactivate={deactivateRecurring}
              onDelete={deleteRecurring}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <RecurringModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitModal}
        initialData={editingItem}
      />

      {/* Mark as Paid Confirmation Modal */}
      <MarkPaidModal
        isOpen={isMarkPaidOpen}
        onClose={() => setIsMarkPaidOpen(false)}
        onConfirm={handleConfirmMarkPaid}
        recurring={payingItem}
      />
    </div>
  );
}
