import React from 'react';
import { Calendar } from 'lucide-react';
import { cn } from '../../lib/utils';

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  className?: string;
  min?: string;
  max?: string;
  required?: boolean;
}

export function DatePicker({
  value,
  onChange,
  className,
  min,
  max,
  required,
}: DatePickerProps) {
  return (
    <div className="relative flex items-center">
      <div className="absolute left-3.5 pointer-events-none text-slate-400">
        <Calendar className="w-4 h-4" />
      </div>
      <input
        type="date"
        required={required}
        value={value}
        min={min}
        max={max}
        onChange={e => onChange(e.target.value)}
        className={cn(
          'input pl-10 pr-3 py-2 text-sm appearance-none',
          className
        )}
      />
    </div>
  );
}
