import React from 'react';
import { cn } from '../../lib/utils';

interface CategoryBadgeProps {
  name: string;
  color?: string | null;
  className?: string;
}

export function CategoryBadge({ name, color, className }: CategoryBadgeProps) {
  const defaultColor = '#6366F1';
  const badgeColor = color || defaultColor;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-600/60 shrink-0',
        className
      )}
    >
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: badgeColor }}
      />
      <span className="truncate max-w-[120px]">{name}</span>
    </span>
  );
}
