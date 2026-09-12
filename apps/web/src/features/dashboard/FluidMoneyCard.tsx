import React, { useState } from 'react';
import { Sparkles, Info, HelpCircle, ArrowUpRight, ArrowDownRight, Target, CalendarClock } from 'lucide-react';
import { FluidMoneyData } from './api/useDashboard';
import { formatINR, cn } from '../../lib/utils';
import { AnimatedNumber } from '../../components/ui/AnimatedNumber';

interface FluidMoneyCardProps {
  data: FluidMoneyData | null;
  loading: boolean;
}

export function FluidMoneyCard({ data, loading }: FluidMoneyCardProps) {
  const [showExplainer, setShowExplainer] = useState(false);

  if (loading || !data) {
    return (
      <div className="card h-64 animate-pulse bg-slate-100 dark:bg-slate-800 border-brand-100 dark:border-brand-900/40" />
    );
  }

  const fluidVal      = parseFloat(data.fluidMoney) || 0;
  const assetsVal     = parseFloat(data.totalAssets) || 0;
  const debtVal       = parseFloat(data.totalLiabilities) || 0;
  const goalsVal      = parseFloat(data.reservedForGoals) || 0;
  const upcomingVal   = parseFloat(data.upcomingExpenses) || 0;

  const isHealthy = fluidVal > 0;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-brand-700/40">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-brand-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 -mb-10 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

      {/* Top row: Brand badge + Tooltip trigger */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-semibold tracking-wide text-brand-200">
          <Sparkles className="w-3.5 h-3.5 text-brand-300" />
          <span>TRUE SPENDABLE MONEY</span>
        </div>

        <button
          type="button"
          onClick={() => setShowExplainer(prev => !prev)}
          className="flex items-center gap-1.5 text-xs text-brand-200/80 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-white/5"
        >
          <HelpCircle className="w-4 h-4" />
          <span className="hidden sm:inline">How is this calculated?</span>
        </button>
      </div>

      {/* Main KPI Number */}
      <div className="mb-6">
        <div className="text-xs sm:text-sm font-medium text-brand-200/90 mb-1">
          Fluid Money Available
        </div>
        <div className="flex flex-wrap items-baseline gap-3">
          <div
            className={cn(
              'text-3xl sm:text-5xl font-extrabold font-mono tracking-tight text-white'
            )}
          >
            <AnimatedNumber value={fluidVal} />
          </div>

          <span
            className={cn(
              'text-xs font-semibold px-2.5 py-1 rounded-full border',
              isHealthy
                ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-300'
                : 'bg-rose-500/20 border-rose-400/30 text-rose-300'
            )}
          >
            {isHealthy ? 'Liquid & Safe' : 'Deficit Warning'}
          </span>
        </div>
      </div>

      {/* Explainer Accordion/Card */}
      {showExplainer && (
        <div className="mb-6 p-4 rounded-xl bg-white/10 border border-white/15 text-xs text-brand-100 leading-relaxed animate-fade-in backdrop-blur-md space-y-1.5">
          <div className="font-bold text-white flex items-center gap-1.5">
            <Info className="w-4 h-4 text-brand-300" />
            Fluid Money Formula:
          </div>
          <p className="font-mono bg-black/20 p-2 rounded text-emerald-300 text-[11px] sm:text-xs">
            Fluid Money = Liquid Assets − Debt − Reserved for Goals − Upcoming Month Bills
          </p>
          <p>
            Unlike regular net worth, Fluid Money deducts money you’ve locked away for savings goals and recurring bills due before month-end. This is what you can guilt-free spend today!
          </p>
        </div>
      )}

      {/* 4 Pillars Breakdown Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-white/10">
        {/* Assets */}
        <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
          <div className="flex items-center gap-1.5 text-xs text-emerald-300 font-medium mb-1">
            <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
            <span>Liquid Assets</span>
          </div>
          <div className="text-sm sm:text-base font-bold font-mono text-white">
            +{formatINR(assetsVal)}
          </div>
        </div>

        {/* Debt */}
        <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
          <div className="flex items-center gap-1.5 text-xs text-rose-300 font-medium mb-1">
            <ArrowDownRight className="w-3.5 h-3.5 shrink-0" />
            <span>Liabilities</span>
          </div>
          <div className="text-sm sm:text-base font-bold font-mono text-white">
            -{formatINR(debtVal)}
          </div>
        </div>

        {/* Goals */}
        <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
          <div className="flex items-center gap-1.5 text-xs text-amber-300 font-medium mb-1">
            <Target className="w-3.5 h-3.5 shrink-0" />
            <span>Goal Reserves</span>
          </div>
          <div className="text-sm sm:text-base font-bold font-mono text-white">
            -{formatINR(goalsVal)}
          </div>
        </div>

        {/* Upcoming Bills */}
        <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
          <div className="flex items-center gap-1.5 text-xs text-blue-300 font-medium mb-1">
            <CalendarClock className="w-3.5 h-3.5 shrink-0" />
            <span>Upcoming Bills</span>
          </div>
          <div className="text-sm sm:text-base font-bold font-mono text-white">
            -{formatINR(upcomingVal)}
          </div>
        </div>
      </div>
    </div>
  );
}
