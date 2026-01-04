/**
 * Formatting utilities for consistent display across the app
 */

/**
 * Format currency in INR
 * @param value - Amount to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted currency string in INR
 */
export function formatINR(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format number with Indian number system (lakhs, crores)
 * @param value - Number to format
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted number string
 */
export function formatNumber(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format percentage
 * @param value - Value to format (e.g., 2.5 for 2.5%)
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format percentage with sign for deltas
 * @param value - Value to format (e.g., 0.05 for 5% increase)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage string with + or - sign
 */
export function formatDelta(value: number, decimals: number = 1): string {
  const percent = value * 100;
  const sign = percent > 0 ? '+' : '';
  return `${sign}${percent.toFixed(decimals)}%`;
}

/**
 * Format large numbers with K, L, Cr suffixes
 * @param value - Number to format
 * @returns Formatted string with suffix
 */
export function formatCompact(value: number): string {
  if (value >= 10000000) {
    // 1 Crore = 10,000,000
    return `₹${(value / 10000000).toFixed(2)}Cr`;
  } else if (value >= 100000) {
    // 1 Lakh = 100,000
    return `₹${(value / 100000).toFixed(2)}L`;
  } else if (value >= 1000) {
    return `₹${(value / 1000).toFixed(2)}K`;
  }
  return formatINR(value);
}

/**
 * Format ROAS (Return on Ad Spend)
 * @param value - ROAS value
 * @returns Formatted ROAS string (e.g., "2.5x")
 */
export function formatROAS(value: number): string {
  return `${value.toFixed(2)}x`;
}

/**
 * Format date in IST
 * @param date - Date to format
 * @param format - 'short' | 'medium' | 'long'
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string,
  format: 'short' | 'medium' | 'long' = 'medium'
): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Kolkata',
  };

  switch (format) {
    case 'short':
      options.year = '2-digit';
      options.month = 'short';
      options.day = 'numeric';
      break;
    case 'long':
      options.year = 'numeric';
      options.month = 'long';
      options.day = 'numeric';
      options.weekday = 'long';
      break;
    case 'medium':
    default:
      options.year = 'numeric';
      options.month = 'short';
      options.day = 'numeric';
      break;
  }

  return new Intl.DateTimeFormat('en-IN', options).format(d);
}

/**
 * Format date range for display
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Formatted date range string
 */
export function formatDateRange(
  startDate: Date | string,
  endDate: Date | string
): string {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

  const startStr = formatDate(start, 'short');
  const endStr = formatDate(end, 'short');

  return `${startStr} - ${endStr}`;
}
