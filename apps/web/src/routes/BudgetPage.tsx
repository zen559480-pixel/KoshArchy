import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Copy, PieChart, AlertCircle, ShieldAlert, Sparkles, Layers } from 'lucide-react';
import { useBudget, BudgetItemEnriched } from '../features/budget/api/useBudget';
import { useCategories } from '../features/categories/api/useCategories';
import { BudgetProgressRow } from '../features/budget/BudgetProgressRow';
import { AddBudgetItemModal } from '../features/budget/AddBudgetItemModal';
import { CopyBudgetModal } from '../features/budget/CopyBudgetModal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { CategoryBadge } from '../components/ui/CategoryBadge';
import { EmptyState } from '../components/ui/EmptyState';
import { formatINR, formatMonthYear, cn } from '../lib/utils';

export default function BudgetPage() {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear  = now.getFullYear();

  const {
    data,
    month,
    year,
    loading,
    prevMonth,
    nextMonth,
    setMonthYear,
    createBudget,
    upsertItem,
    deleteItem,
    copyBudget,
  } = useBudget();

  const { categories } = useCategories('EXPENSE');

  // Modals state
  const [addModalOpen, setAddModalOpen]         = useState(false);
  const [copyModalOpen, setCopyModalOpen]       = useState(false);
  const [editingItem, setEditingItem]           = useState<BudgetItemEnriched | null>(null);
  const [deletingItem, setDeletingItem]         = useState<BudgetItemEnriched | null>(null);
  const [isDeleting, setIsDeleting]             = useState(false);

  const budget = data?.budget;
  const items  = data?.items || [];
  const unbudgetedItems = data?.unbudgetedItems || [];
  const summary = data?.summary || {
    totalBudgeted: '0',
    totalSpentInBudget: '0',
    totalUnbudgetedSpent: '0',
    totalSpentOverall: '0',
    remainingBudget: '0',
    overallPercent: 0,
  };

  const totalBudgetedNum  = parseFloat(summary.totalBudgeted) || 0;
  const totalSpentNum     = parseFloat(summary.totalSpentInBudget) || 0;
  const totalRemainingNum = parseFloat(summary.remainingBudget) || 0;
  const overallPercent    = summary.overallPercent;

  const isCurrentMonth = month === currentMonth && year === currentYear;

  // Split into variable and fixed expenses
  const variableItems = items.filter(i => !i.isFixed);
  const fixedItems    = items.filter(i => i.isFixed);

  // Handlers
  const handleCreateOrAdd = () => {
    setEditingItem(null);
    setAddModalOpen(true);
  };

  const handleEdit = (item: BudgetItemEnriched) => {
    setEditingItem(item);
    setAddModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;
    try {
      setIsDeleting(true);
      await deleteItem(deletingItem.id);
      setDeletingItem(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleModalSubmit = async (payload: { categoryId: string; expectedAmount: string | number; isFixed: boolean }) => {
    if (budget) {
      await upsertItem(budget.id, payload);
    } else {
      // If no budget exists yet, initialize budget with this item
      await createBudget({
        month,
        year,
        items: [payload],
      });
    }
  };

  const handleQuickBudgetUnbudgeted = (catId: string, currentSpent: string) => {
    setEditingItem(null);
    setAddModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Header: Title & Month Picker */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Monthly Budget</h1>
          <p className="page-subtitle">
            Plan your monthly spending limits and track actuals in real time
          </p>
        </div>

        {/* Month Selector Navigation */}
        <div className="flex items-center gap-2 self-start md:self-auto bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white dark:hover:bg-slate-700 transition-colors"
            title="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="font-bold text-xs sm:text-sm px-2 text-slate-800 dark:text-slate-200 min-w-[130px] text-center">
            {formatMonthYear(month, year)}
          </span>

          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white dark:hover:bg-slate-700 transition-colors"
            title="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {!isCurrentMonth && (
            <button
              onClick={() => setMonthYear(currentMonth, currentYear)}
              className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 px-2 py-1 rounded hover:bg-white dark:hover:bg-slate-700 ml-1 border-l border-slate-200 dark:border-slate-700"
            >
              Today
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Budgeted */}
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Budgeted
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <PieChart className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
            {formatINR(totalBudgetedNum)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Across {items.length} categories
          </div>
        </div>

        {/* Total Spent in Budget */}
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Spent in Budget
            </span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
            {formatINR(totalSpentNum)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {overallPercent}% of planned allowance
          </div>
        </div>

        {/* Remaining Allowance */}
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Remaining Budget
            </span>
            <div
              className={cn(
                'w-7 h-7 rounded-lg flex items-center justify-center',
                totalRemainingNum >= 0
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600'
                  : 'bg-rose-100 dark:bg-rose-950/60 text-rose-600'
              )}
            >
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
          <div
            className={cn(
              'text-xl sm:text-2xl font-bold font-mono',
              totalRemainingNum >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            )}
          >
            {formatINR(totalRemainingNum)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {totalRemainingNum >= 0 ? 'Remaining to spend' : 'Over budget by ' + formatINR(Math.abs(totalRemainingNum))}
          </div>
        </div>

        {/* Health Status */}
        <div className="card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Budget Health
            </span>
            {overallPercent > 100 ? (
              <ShieldAlert className="w-4 h-4 text-rose-500" />
            ) : overallPercent > 80 ? (
              <AlertCircle className="w-4 h-4 text-amber-500" />
            ) : (
              <Sparkles className="w-4 h-4 text-emerald-500" />
            )}
          </div>

          <div>
            <span
              className={cn(
                'text-xs font-bold px-2.5 py-1 rounded-full border inline-block',
                overallPercent > 100
                  ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/50 dark:border-rose-800'
                  : overallPercent > 80
                  ? 'bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-950/50 dark:border-amber-800'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-950/50 dark:border-emerald-800'
              )}
            >
              {overallPercent > 100
                ? 'Over Budget 🚨'
                : overallPercent > 80
                ? 'Approaching Limit ⚠️'
                : 'On Track ✨'}
            </span>
            <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 mt-2.5 overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full',
                  overallPercent > 100 ? 'bg-rose-500' : overallPercent > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                )}
                style={{ width: `${Math.min(100, overallPercent)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons Bar */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <button
          onClick={() => setCopyModalOpen(true)}
          className="btn-secondary text-xs"
        >
          <Copy className="w-3.5 h-3.5" />
          Copy from another month
        </button>

        <button
          onClick={handleCreateOrAdd}
          className="btn-primary text-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Category Limit
        </button>
      </div>

      {/* Budget Items Sections */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="card h-20 animate-pulse bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={PieChart}
          title={`No budget created for ${formatMonthYear(month, year)}`}
          description="Plan your monthly expenses by adding spending caps to categories like Food, Transport, or Shopping."
          actionLabel="Add Category Limit"
          onAction={handleCreateOrAdd}
        />
      ) : (
        <div className="space-y-6">
          {/* Variable Expenses */}
          {variableItems.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Variable Spending ({variableItems.length})
              </h3>
              <div className="space-y-2.5">
                {variableItems.map(item => (
                  <BudgetProgressRow
                    key={item.id}
                    item={item}
                    onEdit={handleEdit}
                    onDelete={setDeletingItem}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Fixed Expenses */}
          {fixedItems.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Fixed Commitments ({fixedItems.length})
              </h3>
              <div className="space-y-2.5">
                {fixedItems.map(item => (
                  <BudgetProgressRow
                    key={item.id}
                    item={item}
                    onEdit={handleEdit}
                    onDelete={setDeletingItem}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Unbudgeted Spending Alert & Quick Add */}
          {unbudgetedItems.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Unbudgeted Expenses This Month</span>
                </div>
                <span className="text-xs font-mono font-bold text-amber-900 dark:text-amber-200">
                  Total: {formatINR(parseFloat(summary.totalUnbudgetedSpent))}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {unbudgetedItems.map(item => (
                  <div
                    key={item.categoryId}
                    className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-amber-200/60 dark:border-slate-700 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <CategoryBadge name={item.categoryName} color={item.color} />
                      <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                        {formatINR(parseFloat(item.actualAmount))}
                      </span>
                    </div>

                    <button
                      onClick={() => handleQuickBudgetUnbudgeted(item.categoryId, item.actualAmount)}
                      className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3" />
                      Set Limit
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Limit Modal */}
      <AddBudgetItemModal
        isOpen={addModalOpen}
        item={editingItem}
        existingCategoryIds={items.map(i => i.categoryId)}
        categories={categories}
        onClose={() => setAddModalOpen(false)}
        onSubmit={handleModalSubmit}
      />

      {/* Copy Budget Modal */}
      <CopyBudgetModal
        isOpen={copyModalOpen}
        targetMonth={month}
        targetYear={year}
        onClose={() => setCopyModalOpen(false)}
        onCopy={copyBudget}
      />

      {/* Confirm Delete Item Dialog */}
      <ConfirmDialog
        isOpen={!!deletingItem}
        title="Remove Budget Limit"
        message={`Are you sure you want to remove the budget limit for "${deletingItem?.category.name}"? Transactions under this category will not be deleted.`}
        confirmLabel="Remove Limit"
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeletingItem(null)}
      />
    </div>
  );
}
