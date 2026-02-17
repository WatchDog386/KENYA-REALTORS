/**
 * Format currency values consistently across the application
 * Default currency: Kenyan Shillings (KSH)
 */

// Define currency configuration
const CURRENCY_CONFIG = {
  KSH: {
    symbol: 'KSh',
    code: 'KES',
    locale: 'en-KE',
    formatOptions: {
      style: 'currency' as const,
      currency: 'KES',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  },
  USD: {
    symbol: '$',
    code: 'USD',
    locale: 'en-US',
    formatOptions: {
      style: 'currency' as const,
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  }
} as const;

type CurrencyType = keyof typeof CURRENCY_CONFIG;

/**
 * Format a number as Kenyan Shillings (default) or other currency
 * @param amount - The amount to format
 * @param currency - Currency code (default: 'KSH')
 * @param locale - Locale for formatting (default: en-KE)
 * @returns Formatted currency string
 */
export const formatCurrency = (
  amount: number,
  currency: CurrencyType = 'KSH',
  locale?: string
): string => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return `${CURRENCY_CONFIG[currency].symbol}0.00`;
  }

  const config = CURRENCY_CONFIG[currency];
  const formatter = new Intl.NumberFormat(
    locale || config.locale,
    config.formatOptions
  );

  return formatter.format(amount);
};

/**
 * Format currency without symbol
 * @param amount - The amount to format
 * @param locale - Locale for formatting (default: en-KE)
 * @returns Formatted number string
 */
export const formatNumber = (
  amount: number,
  locale: string = 'en-KE'
): string => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0.00';
  }

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format currency with compact notation (e.g., 1.5K, 2.3M)
 * @param amount - The amount to format
 * @param currency - Currency code (default: 'KSH')
 * @param locale - Locale for formatting (default: en-KE)
 * @returns Compact formatted currency string
 */
export const formatCompactCurrency = (
  amount: number,
  currency: CurrencyType = 'KSH',
  locale?: string
): string => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return `${CURRENCY_CONFIG[currency].symbol}0`;
  }

  const config = CURRENCY_CONFIG[currency];
  const formatter = new Intl.NumberFormat(
    locale || config.locale,
    {
      ...config.formatOptions,
      notation: 'compact' as const,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }
  );

  return formatter.format(amount);
};

/**
 * Parse currency string to number
 * @param currencyString - Currency string to parse
 * @returns Parsed number or null if invalid
 */
export const parseCurrency = (currencyString: string): number | null => {
  if (!currencyString) return null;

  // Remove all non-numeric characters except decimal point and minus sign
  const cleaned = currencyString
    .replace(/[^\d.-]/g, '')
    .replace(/,/g, '');

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
};

/**
 * Convert amount from one currency to another (simplified version)
 * @param amount - Amount to convert
 * @param fromCurrency - Source currency
 * @param toCurrency - Target currency
 * @param exchangeRates - Optional exchange rates object
 * @returns Converted amount
 */
export const convertCurrency = (
  amount: number,
  fromCurrency: CurrencyType = 'KSH',
  toCurrency: CurrencyType = 'USD',
  exchangeRates?: Record<CurrencyType, number>
): number => {
  // Default exchange rates (simplified - in real app, fetch from API)
  const defaultRates: Record<CurrencyType, number> = {
    KSH: 1,
    USD: 0.0067 // 1 KSH = 0.0067 USD (example rate)
  };

  const rates = exchangeRates || defaultRates;
  
  // Convert to base currency (KSH) first
  const baseAmount = amount / rates[fromCurrency];
  // Convert to target currency
  return baseAmount * rates[toCurrency];
};

/**
 * Format currency for display in tables/cards
 * @param amount - The amount to format
 * @param currency - Currency code (default: 'KSH')
 * @param compact - Whether to use compact format for large numbers
 * @returns Formatted string
 */
export const formatForDisplay = (
  amount: number,
  currency: CurrencyType = 'KSH',
  compact: boolean = false
): string => {
  if (compact && Math.abs(amount) >= 1000000) {
    return formatCompactCurrency(amount, currency);
  }
  return formatCurrency(amount, currency);
};

/**
 * Calculate percentage change between two values
 * @param oldValue - Old value
 * @param newValue - New value
 * @returns Percentage change with sign
 */
export const calculatePercentageChange = (
  oldValue: number,
  newValue: number
): string => {
  if (oldValue === 0) return newValue > 0 ? '+100%' : '0%';

  const change = ((newValue - oldValue) / oldValue) * 100;
  const sign = change > 0 ? '+' : '';
  
  return `${sign}${change.toFixed(1)}%`;
};

/**
 * Format Kenyan phone numbers with currency (for M-Pesa, etc.)
 * @param phoneNumber - Phone number to format
 * @param amount - Amount to display
 * @returns Formatted string
 */
export const formatPhoneWithAmount = (
  phoneNumber: string,
  amount: number
): string => {
  // Format phone number (Kenyan format: +254 XXX XXX XXX)
  const formattedPhone = phoneNumber.replace(
    /^(\+?254|0)?(\d{2})(\d{3})(\d{4})$/,
    '+254 $2 $3 $4'
  );
  
  return `${formattedPhone} - ${formatCurrency(amount, 'KSH')}`;
};

// Export constants for easy access
export const CURRENCY_SYMBOLS = {
  KSH: 'KSh',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

export const DEFAULT_CURRENCY = 'KSH' as const;