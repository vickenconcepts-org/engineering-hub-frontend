import React, { useState, useRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';

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
  type,
  ...props
}: InputProps) {
  const idRef = useRef<string | null>(null);
  if (!idRef.current) {
    idRef.current = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  }
  const inputId = id || idRef.current;
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;
  
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
      <input
        id={inputId}
          type={inputType}
        className={`w-full px-4 py-2 rounded-lg border ${
          error
            ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]'
            : 'border-[#E5E7EB] focus:border-[#1E3A8A] focus:ring-[#1E3A8A]'
          } focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors text-sm text-[#334155] placeholder:text-[#64748B] ${
            isPassword ? 'pr-10' : ''
          } ${className}`}
        {...props}
      />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#334155] transition-colors"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        )}
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
