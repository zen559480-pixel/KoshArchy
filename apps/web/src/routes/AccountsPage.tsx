import React, { useState, useMemo } from 'react';
import { Plus, Wallet, TrendingUp, TrendingDown, Layers } from 'lucide-react';
import { useAccounts, Account, CreateAccountInput, UpdateAccountInput } from '../features/accounts/api/useAccounts';
import { AccountCard } from '../features/accounts/AccountCard';
import { AccountModal } from '../features/accounts/AccountModal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { formatINR } from '../lib/utils';

export default function AccountsPage() {
  const { accounts, loading, createAccount, updateAccount, deleteAccount } = useAccounts();

  const [filterType, setFilterType]         = useState<string>('ALL');
  const [modalOpen, setModalOpen]           = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<Account | null>(null);
  const [isDeleting, setIsDeleting]         = useState(false);

  // Financial calculations
  const summary = useMemo(() => {
    let assets = 0;
    let liabilities = 0;

    accounts.forEach(acc => {
      if (!acc.isActive || !acc.includeInNetWorth) return;
      const b = parseFloat(acc.balance) || 0;
      if (['BANK', 'CASH', 'WALLET', 'INVESTMENT'].includes(acc.type)) {
        assets += b;
      } else if (['CREDIT_CARD', 'LOAN'].includes(acc.type)) {
        liabilities += b;
      }
    });

    const netWorth = assets - liabilities;
    return { assets, liabilities, netWorth };
  }, [accounts]);

  const filteredAccounts = useMemo(() => {
    if (filterType === 'ALL') return accounts;
    if (filterType === 'BANK') return accounts.filter(a => a.type === 'BANK');
    if (filterType === 'CREDIT_CARD') return accounts.filter(a => a.type === 'CREDIT_CARD');
    if (filterType === 'CASH_WALLET') return accounts.filter(a => ['CASH', 'WALLET'].includes(a.type));
    if (filterType === 'INVESTMENT') return accounts.filter(a => a.type === 'INVESTMENT');
    if (filterType === 'LOAN') return accounts.filter(a => a.type === 'LOAN');
    return accounts;
  }, [accounts, filterType]);

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setModalOpen(true);
  };

  const handleCreate = () => {
    setEditingAccount(null);
    setModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingAccount) return;
    try {
      setIsDeleting(true);
      await deleteAccount(deletingAccount.id);
      setDeletingAccount(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFormSubmit = async (data: CreateAccountInput | UpdateAccountInput) => {
    if (editingAccount) {
      await updateAccount(editingAccount.id, data as UpdateAccountInput);
    } else {
      await createAccount(data as CreateAccountInput);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Accounts</h1>
          <p className="page-subtitle">
            Manage your bank accounts, credit cards, wallets and investments
          </p>
        </div>
        <button onClick={handleCreate} className="btn-primary shrink-0 self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          Add Account
        </button>
      </div>

      {/* KPI Cards Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Net Worth */}
        <div className="card bg-gradient-to-br from-brand-50 to-indigo-50/40 dark:from-brand-950/40 dark:to-slate-800 border-brand-100 dark:border-brand-900/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-700 dark:text-brand-300">
              Net Worth
            </span>
            <div className="w-8 h-8 rounded-lg bg-brand-100 dark:bg-brand-900/60 flex items-center justify-center text-brand-600 dark:text-brand-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-slate-100">
            {formatINR(summary.netWorth)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Across {accounts.filter(a => a.isActive && a.includeInNetWorth).length} active accounts
          </div>
        </div>

        {/* Liquid Assets */}
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Assets
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {formatINR(summary.assets)}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Bank, cash, wallets & investments
          </div>
        </div>

        {/* Liabilities */}
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Liabilities
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-rose-600 dark:text-rose-400">
            {formatINR(summary.liabilities)}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Credit cards & outstanding loans
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs sm:text-sm font-medium border-b border-slate-200 dark:border-slate-700">
        {[
          { id: 'ALL',         label: 'All Accounts', count: accounts.length },
          { id: 'BANK',        label: 'Banks',        count: accounts.filter(a => a.type === 'BANK').length },
          { id: 'CREDIT_CARD', label: 'Credit Cards', count: accounts.filter(a => a.type === 'CREDIT_CARD').length },
          { id: 'CASH_WALLET', label: 'Cash & Wallet',count: accounts.filter(a => ['CASH', 'WALLET'].includes(a.type)).length },
          { id: 'INVESTMENT',  label: 'Investments',  count: accounts.filter(a => a.type === 'INVESTMENT').length },
          { id: 'LOAN',        label: 'Loans',        count: accounts.filter(a => a.type === 'LOAN').length },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id)}
            className={`px-3 py-2 rounded-t-lg transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              filterType === tab.id
                ? 'border-brand-600 text-brand-600 dark:text-brand-400 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span>{tab.label}</span>
            <span className="text-xs px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Grid of Accounts */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="card h-44 animate-pulse bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      ) : filteredAccounts.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title={accounts.length === 0 ? 'No accounts added yet' : 'No accounts found in this category'}
          description={
            accounts.length === 0
              ? 'Add your bank accounts, credit cards or cash wallets to begin tracking transactions.'
              : 'Try selecting a different filter tab or create a new account.'
          }
          actionLabel="Add Account"
          onAction={handleCreate}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAccounts.map(account => (
            <AccountCard
              key={account.id}
              account={account}
              onEdit={handleEdit}
              onDelete={setDeletingAccount}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <AccountModal
        isOpen={modalOpen}
        account={editingAccount}
        onClose={() => setModalOpen(false)}
        onSubmit={handleFormSubmit}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deletingAccount}
        title="Remove Account"
        message={`Are you sure you want to remove "${deletingAccount?.name}"? All transaction records associated with this account will remain safely preserved in history.`}
        confirmLabel="Remove Account"
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeletingAccount(null)}
      />
    </div>
  );
}
