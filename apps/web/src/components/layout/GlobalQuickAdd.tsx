import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { TransactionModal } from '../../features/transactions/TransactionModal';
import { useTransactions } from '../../features/transactions/api/useTransactions';
import { useAccounts } from '../../features/accounts/api/useAccounts';
import { useCategories } from '../../features/categories/api/useCategories';

export function GlobalQuickAdd() {
  const [isOpen, setIsOpen] = useState(false);
  const { createTransaction } = useTransactions();
  const { accounts } = useAccounts();
  const { categories } = useCategories();

  // Keyboard shortcut listener: Ctrl+N or Cmd+N to open, Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSubmit = async (data: any) => {
    await createTransaction(data);
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-16 lg:bottom-6 right-6 z-30 w-12 h-12 rounded-full bg-brand-600 hover:bg-brand-500 text-white shadow-lg hover:shadow-brand-500/30 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-brand-500/20 group"
        title="Quick Add Transaction (Ctrl+N)"
        aria-label="Quick Add Transaction"
      >
        <Plus className="w-6 h-6 transition-transform group-hover:rotate-90 duration-200" />
      </button>

      {/* Transaction Modal */}
      {isOpen && (
        <TransactionModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          transaction={null}
          accounts={accounts}
          categories={categories}
          onSubmit={handleSubmit}
        />
      )}
    </>
  );
}

