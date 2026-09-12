import React from 'react';
import { cn } from '../../lib/utils';

interface AmountInputProps {
  value: string | number;
  onChange: (value: string) => void;
  currency?: string;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  required?: boolean;
}

export function AmountInput({
  value,
  onChange,
  currency = '₹',
  placeholder = '0.00',
  className,
  autoFocus,
  required,
}: AmountInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Allow numbers and at most one decimal dot
    if (raw === '' || /^\d*\.?\d*$/.test(raw)) {
      onChange(raw);
    }
  };

  return (
    <div className="relative flex items-center">
      <div className="absolute left-3.5 pointer-events-none text-slate-400 dark:text-slate-500 font-semibold text-base">
        {currency}
      </div>
      <input
        type="text"
        inputMode="decimal"
        autoFocus={autoFocus}
        required={required}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={cn(
          'input pl-9 pr-3 py-2.5 text-base font-mono font-medium tracking-tight',
          className
        )}
      />
    </div>
  );
}
