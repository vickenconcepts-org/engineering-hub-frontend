import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export function Input({
  label,
  helperText,
  error,
  className = '',
  id,
  ...props
}: InputProps) {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
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
      <input
        id={inputId}
        className={`w-full px-4 py-2 rounded-lg border ${
          error
            ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]'
            : 'border-[#E5E7EB] focus:border-[#1E3A8A] focus:ring-[#1E3A8A]'
        } focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors text-sm text-[#334155] placeholder:text-[#64748B] ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-xs text-[#DC2626]">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-xs text-[#64748B]">{helperText}</p>
      )}
    </div>
  );
}
