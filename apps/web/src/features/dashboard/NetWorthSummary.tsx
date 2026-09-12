import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ChevronRight, TrendingUp, CreditCard } from 'lucide-react';
import { formatINR } from '../../lib/utils';
import { AnimatedNumber } from '../../components/ui/AnimatedNumber';

interface NetWorthSummaryProps {
  totalAssets: number;
  totalLiabilities: number;
  accountCount: number;
}

export function NetWorthSummary({
  totalAssets,
  totalLiabilities,
  accountCount,
}: NetWorthSummaryProps) {
  const netWorth = totalAssets - totalLiabilities;
  const total = totalAssets + totalLiabilities;
  const assetRatio = total > 0 ? (totalAssets / total) * 100 : 100;
  const debtRatio  = total > 0 ? (totalLiabilities / total) * 100 : 0;

  return (
    <div className="card flex flex-col justify-between">
      <div>
        {/* Title bar */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                Net Worth
              </h3>
              <p className="text-xs text-slate-400">Total equity across {accountCount} accounts</p>
            </div>
          </div>

          <Link
            to="/accounts"
            className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 flex items-center gap-0.5"
          >
            Accounts
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Large Net Worth Value */}
        <div className="my-3">
          <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-slate-100">
            <AnimatedNumber value={netWorth} />
          </div>
        </div>


        {/* Asset / Debt Ratio Bar */}
        <div className="space-y-1.5 my-4">
          <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-700 flex overflow-hidden">
            <div
              className="bg-emerald-500 transition-all duration-500"
              style={{ width: `${assetRatio}%` }}
              title={`Assets: ${assetRatio.toFixed(1)}%`}
            />
            <div
              className="bg-rose-500 transition-all duration-500"
              style={{ width: `${debtRatio}%` }}
              title={`Debt: ${debtRatio.toFixed(1)}%`}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Assets: {formatINR(totalAssets)} ({assetRatio.toFixed(0)}%)
            </span>
            <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              Debt: {formatINR(totalLiabilities)} ({debtRatio.toFixed(0)}%)
            </span>
          </div>
        </div>
      </div>

      {/* Mini footer */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
          Healthy financial position
        </span>
        <span className="font-medium text-slate-600 dark:text-slate-300">
          {totalLiabilities === 0 ? 'Debt Free 🎉' : `${debtRatio.toFixed(0)}% Leverage`}
        </span>
      </div>
    </div>
  );
}
