/**
 * Date utility functions for the property management system
 */

export interface DateRange {
  start: Date;
  end: Date;
}

export interface DateFormatOptions {
  includeTime?: boolean;
  includeDay?: boolean;
  shortMonth?: boolean;
  locale?: string;
}

// Format date based on options
export function formatDate(
  date: Date | string | number,
  options: DateFormatOptions = {}
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;

  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }

  const {
    includeTime = false,
    includeDay = true,
    shortMonth = false,
    locale = 'en-US'
  } = options;

  const formatOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: shortMonth ? 'short' : 'long',
    day: 'numeric'
  };

  if (includeDay) {
    formatOptions.weekday = 'short';
  }

  if (includeTime) {
    formatOptions.hour = '2-digit';
    formatOptions.minute = '2-digit';
  }

  return dateObj.toLocaleDateString(locale, formatOptions);
}

// Format time only
export function formatTime(
  date: Date | string | number,
  includeSeconds: boolean = false
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;

  if (isNaN(dateObj.getTime())) {
    return 'Invalid Time';
  }

  return dateObj.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: includeSeconds ? '2-digit' : undefined
  });
}

// Get relative time (e.g., "2 hours ago")
export function getRelativeTime(
  date: Date | string | number,
  locale: string = 'en'
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;

  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }

  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (diffYears > 0) return rtf.format(-diffYears, 'year');
  if (diffMonths > 0) return rtf.format(-diffMonths, 'month');
  if (diffWeeks > 0) return rtf.format(-diffWeeks, 'week');
  if (diffDays > 0) return rtf.format(-diffDays, 'day');
  if (diffHours > 0) return rtf.format(-diffHours, 'hour');
  if (diffMinutes > 0) return rtf.format(-diffMinutes, 'minute');
  
  return rtf.format(-diffSeconds, 'second');
}

// Get date range for period (today, this week, this month, etc.)
export function getDateRange(period: 'today' | 'yesterday' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear'): DateRange {
  const now = new Date();
  const start = new Date();
  const end = new Date();

  switch (period) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;

    case 'yesterday':
      start.setDate(now.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(now.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      break;

    case 'thisWeek':
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;

    case 'lastWeek':
      const lastWeekStart = new Date(now);
      lastWeekStart.setDate(now.getDate() - 7 - now.getDay() + 1);
      lastWeekStart.setHours(0, 0, 0, 0);
      
      const lastWeekEnd = new Date(lastWeekStart);
      lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
      lastWeekEnd.setHours(23, 59, 59, 999);
      
      start.setTime(lastWeekStart.getTime());
      end.setTime(lastWeekEnd.getTime());
      break;

    case 'thisMonth':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(now.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      break;

    case 'lastMonth':
      start.setMonth(now.getMonth() - 1, 1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(now.getMonth(), 0);
      end.setHours(23, 59, 59, 999);
      break;

    case 'thisYear':
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(11, 31);
      end.setHours(23, 59, 59, 999);
      break;

    case 'lastYear':
      start.setFullYear(now.getFullYear() - 1, 0, 1);
      start.setHours(0, 0, 0, 0);
      end.setFullYear(now.getFullYear() - 1, 11, 31);
      end.setHours(23, 59, 59, 999);
      break;
  }

  return { start, end };
}

// Check if date is within range
export function isDateInRange(date: Date | string | number, range: DateRange): boolean {
  const dateObj = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;

  if (isNaN(dateObj.getTime())) {
    return false;
  }

  return dateObj >= range.start && dateObj <= range.end;
}

// Calculate days between two dates
export function daysBetween(start: Date | string | number, end: Date | string | number): number {
  const startDate = typeof start === 'string' || typeof start === 'number' 
    ? new Date(start) 
    : start;
  
  const endDate = typeof end === 'string' || typeof end === 'number' 
    ? new Date(end) 
    : end;

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return 0;
  }

  const diffMs = Math.abs(endDate.getTime() - startDate.getTime());
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

// Calculate months between two dates
export function monthsBetween(start: Date | string | number, end: Date | string | number): number {
  const startDate = typeof start === 'string' || typeof start === 'number' 
    ? new Date(start) 
    : start;
  
  const endDate = typeof end === 'string' || typeof end === 'number' 
    ? new Date(end) 
    : end;

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return 0;
  }

  const startYear = startDate.getFullYear();
  const startMonth = startDate.getMonth();
  const endYear = endDate.getFullYear();
  const endMonth = endDate.getMonth();

  return (endYear - startYear) * 12 + (endMonth - startMonth);
}

// Add days to date
export function addDays(date: Date | string | number, days: number): Date {
  const dateObj = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;

  const result = new Date(dateObj);
  result.setDate(result.getDate() + days);
  return result;
}

// Add months to date
export function addMonths(date: Date | string | number, months: number): Date {
  const dateObj = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;

  const result = new Date(dateObj);
  result.setMonth(result.getMonth() + months);
  return result;
}

// Add years to date
export function addYears(date: Date | string | number, years: number): Date {
  const dateObj = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;

  const result = new Date(dateObj);
  result.setFullYear(result.getFullYear() + years);
  return result;
}

// Get start of day
export function startOfDay(date: Date | string | number): Date {
  const dateObj = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;

  const result = new Date(dateObj);
  result.setHours(0, 0, 0, 0);
  return result;
}

// Get end of day
export function endOfDay(date: Date | string | number): Date {
  const dateObj = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;

  const result = new Date(dateObj);
  result.setHours(23, 59, 59, 999);
  return result;
}

// Get start of month
export function startOfMonth(date: Date | string | number): Date {
  const dateObj = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;

  const result = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1);
  result.setHours(0, 0, 0, 0);
  return result;
}

// Get end of month
export function endOfMonth(date: Date | string | number): Date {
  const dateObj = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;

  const result = new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0);
  result.setHours(23, 59, 59, 999);
  return result;
}

// Check if date is today
export function isToday(date: Date | string | number): boolean {
  const dateObj = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;

  if (isNaN(dateObj.getTime())) {
    return false;
  }

  const today = new Date();
  return (
    dateObj.getDate() === today.getDate() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getFullYear() === today.getFullYear()
  );
}

// Check if date is in the past
export function isPast(date: Date | string | number): boolean {
  const dateObj = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;

  if (isNaN(dateObj.getTime())) {
    return false;
  }

  return dateObj < new Date();
}

// Check if date is in the future
export function isFuture(date: Date | string | number): boolean {
  const dateObj = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;

  if (isNaN(dateObj.getTime())) {
    return false;
  }

  return dateObj > new Date();
}

// Format date for database (ISO string)
export function toISODate(date: Date | string | number): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;

  if (isNaN(dateObj.getTime())) {
    return '';
  }

  return dateObj.toISOString().split('T')[0];
}

// Format date and time for database (ISO string)
export function toISODateTime(date: Date | string | number): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;

  if (isNaN(dateObj.getTime())) {
    return '';
  }

  return dateObj.toISOString();
}

// Parse date from string (supports multiple formats)
export function parseDate(dateString: string): Date | null {
  if (!dateString) return null;

  // Try parsing as ISO string
  let date = new Date(dateString);
  if (!isNaN(date.getTime())) return date;

  // Try parsing as MM/DD/YYYY
  date = new Date(dateString.replace(/(\d+)\/(\d+)\/(\d+)/, '$2/$1/$3'));
  if (!isNaN(date.getTime())) return date;

  // Try parsing as YYYY-MM-DD
  date = new Date(dateString);
  if (!isNaN(date.getTime())) return date;

  return null;
}

// Get day name
export function getDayName(date: Date | string | number, locale: string = 'en-US'): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;

  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }

  return dateObj.toLocaleDateString(locale, { weekday: 'long' });
}

// Get month name
export function getMonthName(date: Date | string | number, locale: string = 'en-US'): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;

  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }

  return dateObj.toLocaleDateString(locale, { month: 'long' });
}

// Calculate age from birth date
export function calculateAge(birthDate: Date | string | number): number {
  const birthDateObj = typeof birthDate === 'string' || typeof birthDate === 'number' 
    ? new Date(birthDate) 
    : birthDate;

  if (isNaN(birthDateObj.getTime())) {
    return 0;
  }

  const today = new Date();
  let age = today.getFullYear() - birthDateObj.getFullYear();
  const monthDiff = today.getMonth() - birthDateObj.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
    age--;
  }

  return age;
}

// Get business days between two dates (excluding weekends)
export function getBusinessDays(start: Date | string | number, end: Date | string | number): number {
  const startDate = typeof start === 'string' || typeof start === 'number' 
    ? new Date(start) 
    : start;
  
  const endDate = typeof end === 'string' || typeof end === 'number' 
    ? new Date(end) 
    : end;

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return 0;
  }

  let count = 0;
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) { // Not Sunday or Saturday
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
}

// Check if date is a weekend
export function isWeekend(date: Date | string | number): boolean {
  const dateObj = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;

  if (isNaN(dateObj.getTime())) {
    return false;
  }

  const day = dateObj.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
}

// Get quarter from date
export function getQuarter(date: Date | string | number): number {
  const dateObj = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;

  if (isNaN(dateObj.getTime())) {
    return 0;
  }

  const month = dateObj.getMonth();
  return Math.floor(month / 3) + 1;
}

// Get fiscal year from date (assuming July-June fiscal year)
export function getFiscalYear(date: Date | string | number): number {
  const dateObj = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;

  if (isNaN(dateObj.getTime())) {
    return new Date().getFullYear();
  }

  const year = dateObj.getFullYear();
  const month = dateObj.getMonth();
  
  // Fiscal year starts in July (month 6)
  return month >= 6 ? year + 1 : year;
}

// Format duration (e.g., "2 days, 3 hours")
export function formatDuration(
  milliseconds: number,
  options: {
    includeWeeks?: boolean;
    includeMonths?: boolean;
    includeYears?: boolean;
    compact?: boolean;
  } = {}
): string {
  const {
    includeWeeks = false,
    includeMonths = false,
    includeYears = false,
    compact = false
  } = options;

  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  const parts: string[] = [];

  if (includeYears && years > 0) {
    parts.push(`${years} ${compact ? 'yr' : years === 1 ? 'year' : 'years'}`);
  }

  if (includeMonths && months > 0) {
    const remainingMonths = months % 12;
    if (remainingMonths > 0) {
      parts.push(`${remainingMonths} ${compact ? 'mo' : remainingMonths === 1 ? 'month' : 'months'}`);
    }
  }

  if (includeWeeks && weeks > 0) {
    const remainingWeeks = weeks % 4;
    if (remainingWeeks > 0) {
      parts.push(`${remainingWeeks} ${compact ? 'wk' : remainingWeeks === 1 ? 'week' : 'weeks'}`);
    }
  }

  if (days > 0) {
    const remainingDays = days % 7;
    if (remainingDays > 0) {
      parts.push(`${remainingDays} ${compact ? 'd' : remainingDays === 1 ? 'day' : 'days'}`);
    }
  }

  if (hours > 0 && days === 0) {
    const remainingHours = hours % 24;
    if (remainingHours > 0) {
      parts.push(`${remainingHours} ${compact ? 'hr' : remainingHours === 1 ? 'hour' : 'hours'}`);
    }
  }

  if (minutes > 0 && hours === 0 && days === 0) {
    const remainingMinutes = minutes % 60;
    if (remainingMinutes > 0) {
      parts.push(`${remainingMinutes} ${compact ? 'min' : remainingMinutes === 1 ? 'minute' : 'minutes'}`);
    }
  }

  if (seconds > 0 && minutes === 0 && hours === 0 && days === 0) {
    parts.push(`${seconds} ${compact ? 'sec' : seconds === 1 ? 'second' : 'seconds'}`);
  }

  return parts.length > 0 ? parts.join(compact ? ' ' : ', ') : 'Just now';
}