import React from 'react';

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  helperText?: string;
  error?: string;
  currency?: string;
}

export function CurrencyInput({
  label,
  helperText,
  error,
  currency = 'USD',
  className = '',
  id,
  ...props
}: CurrencyInputProps) {
  const inputId = id || `currency-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs uppercase tracking-wide text-[#64748B] mb-2"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#64748B]">
          {currency === 'USD' ? '$' : currency}
        </span>
        <input
          id={inputId}
          type="number"
          step="0.01"
          min="0"
          className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
            error
              ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]'
              : 'border-[#E5E7EB] focus:border-[#1E3A8A] focus:ring-[#1E3A8A]'
          } focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors text-sm text-[#334155] placeholder:text-[#64748B] ${className}`}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1 text-xs text-[#DC2626]">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-xs text-[#64748B]">{helperText}</p>
      )}
    </div>
  );
}
