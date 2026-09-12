import React, { useState } from 'react';
import { RefreshCw, Plus, ArrowUpRight } from 'lucide-react';
import { useDashboard } from '../features/dashboard/api/useDashboard';
import { FluidMoneyCard } from '../features/dashboard/FluidMoneyCard';
import { NetWorthSummary } from '../features/dashboard/NetWorthSummary';
import { MonthSummaryCard } from '../features/dashboard/MonthSummaryCard';
import { AccountSummaryCard } from '../features/dashboard/AccountSummaryCard';
import { ForecastWidget } from '../features/dashboard/ForecastWidget';
import { UpcomingPaymentsList } from '../features/dashboard/UpcomingPaymentsList';
import { RecentTransactionsList } from '../features/dashboard/RecentTransactionsList';
import { TransactionModal } from '../features/transactions/TransactionModal';
import { AccountModal } from '../features/accounts/AccountModal';
import { useAccounts, CreateAccountInput } from '../features/accounts/api/useAccounts';
import { useCategories } from '../features/categories/api/useCategories';
import { useTransactions, CreateTransactionInput } from '../features/transactions/api/useTransactions';
import { getStoredUser } from '../lib/auth';
import { formatDate } from '../lib/utils';

export default function DashboardPage() {
  const user = getStoredUser();
  const {
    fluidMoney,
    forecast,
    summary,
    categorySpending,
    upcomingPayments,
    recentTransactions,
    accounts,
    forecastDays,
    loading,
    refresh,
    changeForecastDays,
  } = useDashboard();

  const { createAccount } = useAccounts();
  const { categories } = useCategories();
  const { createTransaction } = useTransactions();

  const [txnModalOpen, setTxnModalOpen]         = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [refreshing, setRefreshing]             = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setTimeout(() => setRefreshing(false), 400);
  };

  const handleCreateAccount = async (input: CreateAccountInput) => {
    await createAccount(input);
    refresh();
  };

  const handleCreateTransaction = async (input: CreateTransactionInput) => {
    await createTransaction(input);
    refresh();
  };

  // Calculate Net Worth totals
  const totalAssets = accounts
    .filter(a => a.isActive && a.includeInNetWorth && ['BANK', 'CASH', 'WALLET', 'INVESTMENT'].includes(a.type))
    .reduce((sum, a) => sum + (parseFloat(a.balance) || 0), 0);

  const totalLiabilities = accounts
    .filter(a => a.isActive && a.includeInNetWorth && ['CREDIT_CARD', 'LOAN'].includes(a.type))
    .reduce((sum, a) => sum + (parseFloat(a.balance) || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Welcome & Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <span>Good day, {user?.name || 'there'}</span>
            <span className="text-xl">👋</span>
          </h1>
          <p className="page-subtitle">
            Here is your live financial snapshot for {formatDate(new Date())}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-secondary text-xs"
            title="Refresh dashboard data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={() => setTxnModalOpen(true)}
            className="btn-primary text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Quick Transaction
          </button>
        </div>
      </div>

      {/* 1. Fluid Money Hero Card */}
      <FluidMoneyCard data={fluidMoney} loading={loading} />

      {/* 2. Middle Row: Net Worth Summary & Month Cash Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <NetWorthSummary
          totalAssets={totalAssets}
          totalLiabilities={totalLiabilities}
          accountCount={accounts.filter(a => a.isActive).length}
        />
        <MonthSummaryCard
          summary={summary}
          categories={categorySpending}
          loading={loading}
        />
      </div>

      {/* 3. 30/90 Days Cashflow Forecast Widget */}
      <ForecastWidget
        forecast={forecast}
        forecastDays={forecastDays}
        onDaysChange={changeForecastDays}
        loading={loading}
      />

      {/* 4. Bottom Row: Accounts & Upcoming Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AccountSummaryCard
          accounts={accounts}
          loading={loading}
          onAddAccount={() => setAccountModalOpen(true)}
        />
        <UpcomingPaymentsList
          payments={upcomingPayments}
          loading={loading}
        />
      </div>

      {/* 5. Recent Activity */}
      <RecentTransactionsList
        transactions={recentTransactions}
        loading={loading}
        onAddTransaction={() => setTxnModalOpen(true)}
      />

      {/* Quick Modals */}
      <TransactionModal
        isOpen={txnModalOpen}
        onClose={() => setTxnModalOpen(false)}
        accounts={accounts}
        categories={categories}
        onSubmit={handleCreateTransaction as any}
      />

      <AccountModal
        isOpen={accountModalOpen}
        onClose={() => setAccountModalOpen(false)}
        onSubmit={handleCreateAccount as any}
      />
    </div>
  );
}
