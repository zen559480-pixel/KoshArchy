import React, { useState } from 'react';
import { Plus, Tag, ArrowLeftRight } from 'lucide-react';
import { useTransactions, Transaction, CreateTransactionInput, UpdateTransactionInput } from '../features/transactions/api/useTransactions';
import { useAccounts } from '../features/accounts/api/useAccounts';
import { useCategories } from '../features/categories/api/useCategories';
import { FilterBar } from '../features/transactions/FilterBar';
import { TransactionTable } from '../features/transactions/TransactionTable';
import { TransactionModal } from '../features/transactions/TransactionModal';
import { CategoriesModal } from '../features/categories/CategoriesModal';
import { Pagination } from '../components/ui/Pagination';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';

export default function TransactionsPage() {
  const { accounts } = useAccounts();
  const { categories } = useCategories();
  const {
    transactions,
    pagination,
    filters,
    loading,
    updateFilters,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  } = useTransactions();

  const [modalOpen, setModalOpen]               = useState(false);
  const [categoriesOpen, setCategoriesOpen]     = useState(false);
  const [editingTxn, setEditingTxn]             = useState<Transaction | null>(null);
  const [deletingTxn, setDeletingTxn]           = useState<Transaction | null>(null);
  const [isDeleting, setIsDeleting]             = useState(false);

  const handleCreate = () => {
    setEditingTxn(null);
    setModalOpen(true);
  };

  const handleEdit = (txn: Transaction) => {
    setEditingTxn(txn);
    setModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTxn) return;
    try {
      setIsDeleting(true);
      await deleteTransaction(deletingTxn.id);
      setDeletingTxn(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFormSubmit = async (data: CreateTransactionInput | UpdateTransactionInput) => {
    if (editingTxn) {
      await updateTransaction(editingTxn.id, data as UpdateTransactionInput);
    } else {
      await createTransaction(data as CreateTransactionInput);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Transactions</h1>
          <p className="page-subtitle">
            Track, filter and review all your income, expenses, and transfers
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setCategoriesOpen(true)}
            className="btn-secondary"
          >
            <Tag className="w-4 h-4" />
            Categories
          </button>
          <button
            onClick={handleCreate}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" />
            Add Transaction
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        filters={filters}
        accounts={accounts}
        categories={categories}
        onFilterChange={updateFilters}
      />

      {/* Transactions List */}
      {!loading && transactions.length === 0 ? (
        <EmptyState
          icon={ArrowLeftRight}
          title="No transactions found"
          description={
            Object.values(filters).some(Boolean)
              ? 'No records match your active filter criteria. Try clearing or adjusting filters.'
              : 'Start logging your daily income, expenses or transfers to see them here.'
          }
          actionLabel="Add Transaction"
          onAction={handleCreate}
        />
      ) : (
        <>
          <TransactionTable
            transactions={transactions}
            loading={loading}
            onEdit={handleEdit}
            onDelete={setDeletingTxn}
          />

          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={pagination.limit}
            onPageChange={page => updateFilters({ page })}
          />
        </>
      )}

      {/* Transaction Modal (Create & Edit) */}
      <TransactionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        transaction={editingTxn}
        accounts={accounts}
        categories={categories}
        onSubmit={handleFormSubmit}
      />

      {/* Categories Management Modal */}
      <CategoriesModal
        isOpen={categoriesOpen}
        onClose={() => setCategoriesOpen(false)}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deletingTxn}
        title="Delete Transaction"
        message={`Are you sure you want to delete this transaction of ₹${deletingTxn?.amount}? Your account balance will be automatically adjusted to revert its effect.`}
        confirmLabel="Delete Transaction"
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeletingTxn(null)}
      />
    </div>
  );
}
