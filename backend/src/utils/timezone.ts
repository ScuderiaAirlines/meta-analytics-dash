/**
 * Timezone utility for handling IST (Indian Standard Time)
 * UTC offset: +5:30
 */

/**
 * Convert a date string to IST start of day (00:00:00.000 IST)
 * @param dateString - Date string in YYYY-MM-DD format or ISO format
 * @returns Date object set to midnight IST
 */
export function toISTStartOfDay(dateString: string): Date {
  const date = new Date(dateString);

  // Get the date components in IST
  const istDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));

  // Create a new date with IST midnight
  const year = istDate.getFullYear();
  const month = istDate.getMonth();
  const day = istDate.getDate();

  // Create date in IST timezone at midnight
  const istMidnight = new Date(year, month, day, 0, 0, 0, 0);

  // Convert back to UTC for database storage
  const offset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
  return new Date(istMidnight.getTime() - offset);
}

/**
 * Convert a date string to IST end of day (23:59:59.999 IST)
 * @param dateString - Date string in YYYY-MM-DD format or ISO format
 * @returns Date object set to end of day IST
 */
export function toISTEndOfDay(dateString: string): Date {
  const date = new Date(dateString);

  // Get the date components in IST
  const istDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));

  // Create a new date with IST end of day
  const year = istDate.getFullYear();
  const month = istDate.getMonth();
  const day = istDate.getDate();

  // Create date in IST timezone at end of day
  const istEndOfDay = new Date(year, month, day, 23, 59, 59, 999);

  // Convert back to UTC for database storage
  const offset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
  return new Date(istEndOfDay.getTime() - offset);
}

/**
 * Get current date/time in IST
 * @returns Date object representing current time in IST
 */
export function nowIST(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
}

/**
 * Format a date in IST timezone
 * @param date - Date to format
 * @param format - 'date' | 'datetime' | 'time'
 * @returns Formatted date string
 */
export function formatIST(date: Date, format: 'date' | 'datetime' | 'time' = 'datetime'): string {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Kolkata',
  };

  switch (format) {
    case 'date':
      options.year = 'numeric';
      options.month = '2-digit';
      options.day = '2-digit';
      break;
    case 'time':
      options.hour = '2-digit';
      options.minute = '2-digit';
      options.second = '2-digit';
      break;
    case 'datetime':
    default:
      options.year = 'numeric';
      options.month = '2-digit';
      options.day = '2-digit';
      options.hour = '2-digit';
      options.minute = '2-digit';
      options.second = '2-digit';
      break;
  }

  return new Intl.DateTimeFormat('en-IN', options).format(date);
}

/**
 * Calculate days elapsed from start date to now in IST
 * @param startDate - Start date
 * @returns Number of days elapsed (minimum 0, maximum totalDays)
 */
export function getDaysElapsedIST(startDate: Date, endDate: Date): number {
  const now = nowIST();
  const start = new Date(startDate.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const end = new Date(endDate.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));

  const totalDays = Math.max(
    Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
    1
  );

  const daysElapsed = Math.min(
    Math.max(
      Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
      0
    ),
    totalDays
  );

  return daysElapsed;
}
