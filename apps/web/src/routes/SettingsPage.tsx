import React, { useState } from 'react';
import {
  Settings,
  User,
  Lock,
  Download,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  ShieldAlert,
  Coins,
  ArrowDownToLine,
  RefreshCw,
} from 'lucide-react';
import { useSettings } from '../features/settings/api/useSettings';
import { ExportModal } from '../features/settings/ExportModal';
import { formatDate } from '../lib/utils';
import { useToast } from '../components/ui/Toast';

const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
];

export default function SettingsPage() {
  const {
    settings,
    loading,
    exporting,
    updateSettings,
    resetData,
    downloadTransactionsCsv,
    downloadAnnualCsv,
  } = useSettings();

  const toast = useToast();

  // Profile form
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Annual export year
  const [annualYear, setAnnualYear] = useState<number>(new Date().getFullYear());
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Danger zone reset modal
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetConfirmation, setResetConfirmation] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetting, setResetting] = useState(false);

  // Sync settings when loaded
  React.useEffect(() => {
    if (settings) {
      setName(settings.name || '');
      setCurrency(settings.currency || 'INR');
    }
  }, [settings]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      await updateSettings({ name, currency });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    try {
      setSavingPassword(true);
      await updateSettings({
        currentPassword,
        newPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleExecuteReset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setResetting(true);
      await resetData(resetConfirmation, resetPassword);
      setIsResetModalOpen(false);
      setResetConfirmation('');
      setResetPassword('');
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } finally {
      setResetting(false);
    }
  };

  if (loading && !settings) {
    return (
      <div className="space-y-6">
        <div className="h-20 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card h-64 animate-pulse bg-slate-100 dark:bg-slate-800" />
          <div className="card h-64 animate-pulse bg-slate-100 dark:bg-slate-800" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-brand-600 dark:text-brand-400" />
          Settings & Data Management
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Profile configurations, system security, CSV exports, and database maintenance
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Profile & Preferences */}
        <div className="card space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                Profile & Preferences
              </h3>
              <p className="text-xs text-slate-400">Personal details and default display currency</p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your Name"
                className="input text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                disabled
                value={settings?.email || ''}
                className="input text-xs bg-slate-50 dark:bg-slate-800/60 text-slate-400 cursor-not-allowed"
              />
              <p className="text-[10px] text-slate-400 mt-1">Single-user administrative email</p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Coins className="w-3.5 h-3.5" />
                Default Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="input text-xs"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.symbol} - {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            {settings?.createdAt && (
              <p className="text-[11px] text-slate-400 pt-1">
                Member since {formatDate(settings.createdAt, { relative: false })}
              </p>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingProfile}
                className="btn-primary text-xs font-bold py-2 px-4"
              >
                {savingProfile ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* 2. Security & Password */}
        <div className="card space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                Security & Authentication
              </h3>
              <p className="text-xs text-slate-400">Update your administrative access password</p>
            </div>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="input text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                New Password (min 6 characters)
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="input text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="input text-xs"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingPassword || !currentPassword || !newPassword}
                className="btn-secondary text-xs font-bold py-2 px-4 disabled:opacity-40"
              >
                {savingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 3. Data Export Center */}
      <div className="card space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                Data Export & Portability Center
              </h3>
              <p className="text-xs text-slate-400">
                Export your personal financial records in standardized CSV format
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Card 1: Transactions Export */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 bg-slate-50/50 dark:bg-slate-850/40">
            <div className="flex items-center gap-2">
              <ArrowDownToLine className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                Transaction History CSV
              </h4>
            </div>
            <p className="text-xs text-slate-400">
              Complete log of income, expense, and transfer transactions with accounts and categories.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => downloadTransactionsCsv({})}
                disabled={exporting}
                className="btn-primary text-xs py-2 px-3 flex items-center gap-1.5 font-bold"
              >
                <Download className="w-3.5 h-3.5" />
                Quick Export All
              </button>
              <button
                type="button"
                onClick={() => setIsExportModalOpen(true)}
                className="btn-secondary text-xs py-2 px-3 font-semibold"
              >
                Filtered Export...
              </button>
            </div>
          </div>

          {/* Card 2: Annual Report Export */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 bg-slate-50/50 dark:bg-slate-850/40">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                Annual Financial Report CSV
              </h4>
            </div>
            <p className="text-xs text-slate-400">
              12-month consolidated summary including run-rates, savings rates, and category shares.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <select
                value={annualYear}
                onChange={(e) => setAnnualYear(parseInt(e.target.value, 10))}
                className="input text-xs w-28 py-1.5"
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => downloadAnnualCsv(annualYear)}
                disabled={exporting}
                className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5 font-bold"
              >
                <Download className="w-3.5 h-3.5" />
                Download {annualYear} Report
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Danger Zone */}
      <div className="card p-6 border-2 border-rose-200 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/10 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-rose-700 dark:text-rose-400 text-sm">
              Danger Zone: Reset All Financial Data
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Irreversible action to clear all transactions, recurring schedules, budgets, and goals
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Resetting will permanently wipe your transaction logs, delete all monthly budgets, remove recurring rules, and reset all account balances back to zero. Your user account and login credentials will remain active.
        </p>

        <button
          type="button"
          onClick={() => setIsResetModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors shadow-sm"
        >
          Reset All Financial Records...
        </button>
      </div>

      {/* Filtered Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={downloadTransactionsCsv}
        exporting={exporting}
      />

      {/* Danger Zone Confirmation Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
          <div className="card w-full max-w-md shadow-2xl p-6 relative border-2 border-rose-500 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-bold text-base">Confirm Financial Data Wipe</h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              This action cannot be undone. To proceed, type <span className="font-mono font-bold text-rose-600 select-all">RESET DATA</span> below and enter your password.
            </p>

            <form onSubmit={handleExecuteReset} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Confirmation Phrase
                </label>
                <input
                  type="text"
                  required
                  value={resetConfirmation}
                  onChange={(e) => setResetConfirmation(e.target.value)}
                  placeholder="RESET DATA"
                  className="input font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Your Account Password
                </label>
                <input
                  type="password"
                  required
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsResetModalOpen(false);
                    setResetConfirmation('');
                    setResetPassword('');
                  }}
                  className="btn-secondary text-xs py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetting || resetConfirmation !== 'RESET DATA' || !resetPassword}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {resetting ? 'Resetting...' : 'Yes, Delete Everything'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
