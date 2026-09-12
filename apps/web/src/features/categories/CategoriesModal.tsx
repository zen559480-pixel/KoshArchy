import React, { useState, FormEvent } from 'react';
import { X, Plus, Tag, Trash2 } from 'lucide-react';
import { useCategories, Category, CategoryType } from './api/useCategories';
import { CategoryBadge } from '../../components/ui/CategoryBadge';

interface CategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COLOR_PALETTE = [
  '#EF4444', '#F97316', '#F59E0B', '#EAB308',
  '#10B981', '#14B8A6', '#06B6D4', '#3B82F6',
  '#6366F1', '#8B5CF6', '#D946EF', '#EC4899',
  '#64748B', '#000000',
];

export function CategoriesModal({ isOpen, onClose }: CategoriesModalProps) {
  const { categories, loading, createCategory, deleteCategory } = useCategories();

  const [activeTab, setActiveTab] = useState<CategoryType>('EXPENSE');
  const [name, setName]           = useState('');
  const [color, setColor]         = useState(COLOR_PALETTE[4]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState('');

  if (!isOpen) return null;

  const filteredCategories = categories.filter(c => c.type === activeTab);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setSubmitting(true);
      setError('');
      await createCategory({
        name: name.trim(),
        type: activeTab,
        color,
      });
      setName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchive = async (cat: Category) => {
    if (confirm(`Archive category "${cat.name}"?`)) {
      await deleteCategory(cat.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-lg w-full p-6 animate-slide-up flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Manage Categories
              </h3>
              <p className="text-xs text-slate-400">
                Customize tags for transactions and monthly budgets
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex gap-2 my-4 p-1 bg-slate-100 dark:bg-slate-700/50 rounded-xl shrink-0 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('EXPENSE')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              activeTab === 'EXPENSE'
                ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Expense Categories
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('INCOME')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              activeTab === 'INCOME'
                ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Income Categories
          </button>
        </div>

        {/* Add Category Form */}
        <form onSubmit={handleCreate} className="mb-4 p-3.5 bg-slate-50 dark:bg-slate-750 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0 space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={`New ${activeTab.toLowerCase()} category name...`}
              className="input text-sm py-1.5 flex-1"
            />
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="btn-primary text-xs py-2 px-3"
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>
          </div>

          {/* Color choices */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-slate-400 mr-1">Color:</span>
            {COLOR_PALETTE.map(c => (
              <button
                type="button"
                key={c}
                onClick={() => setColor(c)}
                className={`w-5 h-5 rounded-full transition-transform ${
                  color === c ? 'scale-125 ring-2 ring-offset-2 ring-brand-500' : 'hover:scale-110'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          {error && <p className="text-xs text-rose-500">{error}</p>}
        </form>

        {/* Category list */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-1.5">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Existing ({filteredCategories.length})
          </div>

          {loading ? (
            <p className="text-sm text-slate-400 py-4 text-center">Loading categories...</p>
          ) : filteredCategories.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">No categories found</p>
          ) : (
            filteredCategories.map(cat => (
              <div
                key={cat.id}
                className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors"
              >
                <CategoryBadge name={cat.name} color={cat.color} />

                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>{cat._count?.transactions || 0} used</span>
                  <button
                    onClick={() => handleArchive(cat)}
                    className="p-1 text-slate-400 hover:text-rose-500 rounded hover:bg-rose-50 dark:hover:bg-rose-900/20"
                    title="Archive category"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
