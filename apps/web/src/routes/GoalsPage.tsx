import React, { useState, useMemo } from 'react';
import { Plus, Target, CheckCircle2, ShoppingBag, Layers, Shield } from 'lucide-react';
import { useGoals, Goal, CreateGoalInput, UpdateGoalInput, DepositGoalInput, PurchaseGoalInput } from '../features/goals/api/useGoals';
import { useAccounts } from '../features/accounts/api/useAccounts';
import { useCategories } from '../features/categories/api/useCategories';
import { GoalCard } from '../features/goals/GoalCard';
import { GoalModal } from '../features/goals/GoalModal';
import { GoalDepositModal } from '../features/goals/GoalDepositModal';
import { GoalPurchaseModal } from '../features/goals/GoalPurchaseModal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { formatINR } from '../lib/utils';

export default function GoalsPage() {
  const { goals, loading, createGoal, updateGoal, depositGoal, purchaseGoal, deleteGoal } = useGoals();
  const { accounts } = useAccounts();
  const { categories } = useCategories();

  const [statusFilter, setStatusFilter]       = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter]   = useState<string>('ALL');

  // Modal states
  const [goalModalOpen, setGoalModalOpen]         = useState(false);
  const [depositModalOpen, setDepositModalOpen]   = useState(false);
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [deletingGoal, setDeletingGoal]           = useState<Goal | null>(null);
  const [activeGoal, setActiveGoal]               = useState<Goal | null>(null);
  const [isDeleting, setIsDeleting]               = useState(false);

  // Financial summary of goals
  const summary = useMemo(() => {
    let totalTarget = 0;
    let totalSaved  = 0;
    let activeCount = 0;

    goals.forEach(g => {
      if (g.status === 'ACTIVE' || g.status === 'ACHIEVED') {
        totalTarget += parseFloat(g.targetAmount) || 0;
        totalSaved  += parseFloat(g.savedAmount) || 0;
        activeCount++;
      }
    });

    const overallProgress = totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0;
    return { totalTarget, totalSaved, activeCount, overallProgress };
  }, [goals]);

  // Filtering
  const filteredGoals = useMemo(() => {
    return goals.filter(g => {
      const matchStatus   = statusFilter === 'ALL' || g.status === statusFilter;
      const matchPriority = priorityFilter === 'ALL' || g.priority === priorityFilter;
      return matchStatus && matchPriority;
    });
  }, [goals, statusFilter, priorityFilter]);

  // Handlers
  const handleCreate = () => {
    setActiveGoal(null);
    setGoalModalOpen(true);
  };

  const handleEdit = (goal: Goal) => {
    setActiveGoal(goal);
    setGoalModalOpen(true);
  };

  const handleDeposit = (goal: Goal) => {
    setActiveGoal(goal);
    setDepositModalOpen(true);
  };

  const handlePurchase = (goal: Goal) => {
    setActiveGoal(goal);
    setPurchaseModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingGoal) return;
    try {
      setIsDeleting(true);
      await deleteGoal(deletingGoal.id);
      setDeletingGoal(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleGoalSubmit = async (data: CreateGoalInput | UpdateGoalInput) => {
    if (activeGoal) {
      await updateGoal(activeGoal.id, data as UpdateGoalInput);
    } else {
      await createGoal(data as CreateGoalInput);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Savings Goals</h1>
          <p className="page-subtitle">
            Set targets, track deposits, calculate ETAs and achieve milestones
          </p>
        </div>

        <button onClick={handleCreate} className="btn-primary shrink-0 self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          New Goal
        </button>
      </div>

      {/* KPI Cards Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Saved */}
        <div className="card bg-gradient-to-br from-emerald-50 to-teal-50/40 dark:from-emerald-950/40 dark:to-slate-800 border-emerald-100 dark:border-emerald-900/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
              Total Saved Towards Goals
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {formatINR(summary.totalSaved)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {summary.overallProgress}% of {formatINR(summary.totalTarget)} total targets
          </div>
        </div>

        {/* Active Targets */}
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Active Targets
            </span>
            <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-950/60 flex items-center justify-center text-orange-600 dark:text-orange-400">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-slate-100">
            {formatINR(summary.totalTarget)}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Across {summary.activeCount} active & reached goals
          </div>
        </div>

        {/* Overall Completion */}
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Goals
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-brand-600 dark:text-brand-400">
            {goals.length}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {goals.filter(g => g.status === 'PURCHASED').length} goals fulfilled 🎉
          </div>
        </div>
      </div>

      {/* Filter Tabs and Priority Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700 pb-2">
        {/* Status tabs */}
        <div className="flex items-center gap-1 overflow-x-auto text-xs sm:text-sm font-medium">
          {[
            { id: 'ALL',       label: 'All Goals',  count: goals.length },
            { id: 'ACTIVE',    label: 'In Progress', count: goals.filter(g => g.status === 'ACTIVE').length },
            { id: 'ACHIEVED',  label: 'Ready',      count: goals.filter(g => g.status === 'ACHIEVED').length },
            { id: 'PURCHASED', label: 'Purchased',  count: goals.filter(g => g.status === 'PURCHASED').length },
            { id: 'CANCELLED', label: 'Cancelled',  count: goals.filter(g => g.status === 'CANCELLED').length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-black/20">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs self-start sm:self-auto">
          <span className="text-slate-400 px-1 text-[11px]">Priority:</span>
          {['ALL', 'ESSENTIAL', 'HIGH', 'MEDIUM', 'LOW'].map(p => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              className={`px-2 py-0.5 rounded font-medium ${
                priorityFilter === p
                  ? 'bg-white dark:bg-slate-700 text-brand-600 font-bold shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Goals */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="card h-56 animate-pulse bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      ) : filteredGoals.length === 0 ? (
        <EmptyState
          icon={Target}
          title={goals.length === 0 ? 'No savings goals yet' : 'No goals found matching criteria'}
          description={
            goals.length === 0
              ? 'Start setting financial milestones like Emergency Fund, Vacation, or Tech upgrades.'
              : 'Try clearing your status or priority filters.'
          }
          actionLabel="Create Goal"
          onAction={handleCreate}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGoals.map(goal => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={handleEdit}
              onDeposit={handleDeposit}
              onPurchase={handlePurchase}
              onDelete={setDeletingGoal}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <GoalModal
        isOpen={goalModalOpen}
        goal={activeGoal}
        accounts={accounts}
        onClose={() => setGoalModalOpen(false)}
        onSubmit={handleGoalSubmit}
      />

      {/* Deposit Savings Modal */}
      <GoalDepositModal
        isOpen={depositModalOpen}
        goal={activeGoal}
        accounts={accounts}
        onClose={() => setDepositModalOpen(false)}
        onDeposit={depositGoal}
      />

      {/* Purchase Completion Modal */}
      <GoalPurchaseModal
        isOpen={purchaseModalOpen}
        goal={activeGoal}
        accounts={accounts}
        categories={categories}
        onClose={() => setPurchaseModalOpen(false)}
        onPurchase={purchaseGoal}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deletingGoal}
        title="Remove Goal"
        message={`Are you sure you want to remove "${deletingGoal?.name}"? If it has linked purchase records, it will be marked as cancelled to protect your transaction history.`}
        confirmLabel="Remove Goal"
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeletingGoal(null)}
      />
    </div>
  );
}
