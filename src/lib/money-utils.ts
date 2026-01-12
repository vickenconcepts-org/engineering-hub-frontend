/**
 * Money formatting utilities
 * Handles formatted amounts from backend (K, M, B notation) and displays them correctly
 */

/**
 * Parse formatted amount string (e.g., "10K" -> 10000, "1.5M" -> 1500000)
 * Handles K (thousands), M (millions), B (billions)
 */
export function parseFormattedAmount(amount: string | number | null | undefined): number {
  if (amount === null || amount === undefined) {
    return 0;
  }
  
  if (typeof amount === 'number') {
    return amount;
  }
  
  if (!amount || amount === '') {
    return 0;
  }

  const str = amount.toString().trim().toUpperCase();
  
  // Check if it's already a plain number (no K/M/B suffix)
  if (!/[KMB]/.test(str)) {
    // Remove currency symbols and thousand separators, then parse
    const cleaned = str.replace(/[₦,\s]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }

  // Extract number and suffix
  const match = str.match(/^([\d.]+)([KMB])?$/);
  if (!match) {
    return 0;
  }

  const numValue = parseFloat(match[1]);
  const suffix = match[2];

  switch (suffix) {
    case 'K':
      return numValue * 1000;
    case 'M':
      return numValue * 1000000;
    case 'B':
      return numValue * 1000000000;
    default:
      return numValue;
  }
}

/**
 * Check if amount is already formatted (contains K, M, or B)
 */
export function isFormattedAmount(amount: string | number | null | undefined): boolean {
  if (amount === null || amount === undefined) {
    return false;
  }
  
  if (typeof amount === 'number') {
    return false;
  }
  
  return /[KMB]/i.test(amount.toString());
}

/**
 * Format amount for display
 * If already formatted (contains K/M/B), display as-is
 * Otherwise, format as number with locale string
 */
export function formatAmountForDisplay(
  amount: string | number | null | undefined,
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string {
  if (amount === null || amount === undefined) {
    return '0.00';
  }

  const amountStr = amount.toString();
  
  // If already formatted (contains K/M/B), display it directly
  if (isFormattedAmount(amountStr)) {
    return amountStr;
  }
  
  // Otherwise, parse and format as number
  const numValue = parseFormattedAmount(amountStr);
  return numValue.toLocaleString('en-NG', {
    minimumFractionDigits: options?.minimumFractionDigits ?? 2,
    maximumFractionDigits: options?.maximumFractionDigits ?? 2,
  });
}

/**
 * Format amount with currency symbol
 */
export function formatAmountWithCurrency(
  amount: string | number | null | undefined,
  currency: string = '₦',
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string {
  const formatted = formatAmountForDisplay(amount, options);
  return `${currency}${formatted}`;
}
