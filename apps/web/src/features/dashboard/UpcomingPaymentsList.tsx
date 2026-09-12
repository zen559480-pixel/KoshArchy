import { CalendarClock, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { UpcomingPayment } from './api/useDashboard';
import { formatINR, formatDate } from '../../lib/utils';

interface UpcomingPaymentsListProps {
  payments: UpcomingPayment[];
  loading: boolean;
}

export function UpcomingPaymentsList({ payments, loading }: UpcomingPaymentsListProps) {
  return (
    <div className="card space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <CalendarClock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              Upcoming Payments (Next 14 Days)
            </h3>
            <p className="text-xs text-slate-400">Scheduled subscriptions and fixed bills</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
            {payments.length} Due
          </span>
          <Link
            to="/recurring"
            className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 flex items-center gap-0.5 transition-colors"
          >
            Manage
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>


      {loading ? (
        <div className="space-y-2">
          {[1, 2].map(i => (
            <div key={i} className="h-12 bg-slate-100 dark:bg-slate-700/50 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : payments.length === 0 ? (
        <div className="p-5 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-center text-xs text-slate-400 flex flex-col items-center gap-1.5">
          <CheckCircle2 className="w-6 h-6 text-emerald-500/80 mb-0.5" />
          <span>No upcoming bills scheduled in the next 14 days.</span>
        </div>
      ) : (
        <div className="space-y-2">
          {payments.map(item => {
            const amountNum = parseFloat(item.amount);
            return (
              <div
                key={item.id}
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/70 hover:bg-slate-50 dark:hover:bg-slate-750/50 transition-colors"
              >
                <div>
                  <p className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                    {item.description}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Due: {formatDate(item.nextOccurrence)} • {item.frequency}
                  </p>
                </div>

                <div className="font-mono font-bold text-xs text-rose-600 dark:text-rose-400">
                  -{formatINR(amountNum)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
