import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface InfoTooltipProps {
  title?: string;
  content: string | React.ReactNode;
  className?: string;
}

export function InfoTooltip({ title, content, className = '' }: InfoTooltipProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      <button
        type="button"
        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-0.5 rounded-full transition-colors focus:outline-none"
        aria-label="Information"
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>

      {visible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-900 text-white rounded-xl shadow-xl border border-slate-700 text-xs z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-100">
          {title && <p className="font-bold text-slate-200 mb-1">{title}</p>}
          <div className="text-slate-300 text-[11px] leading-relaxed">{content}</div>
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
        </div>
      )}
    </div>
  );
}
