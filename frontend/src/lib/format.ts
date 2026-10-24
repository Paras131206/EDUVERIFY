/**
 * Utility functions for Indian locale formatting and presentation in EduVerify.
 */

/**
 * Format a number according to the Indian numbering system (en-IN).
 * E.g., 485290 -> "4,85,290" (4.85 lakh)
 */
export function formatIndianNumber(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '0';
  const num = typeof value === 'number' ? value : Number(value);
  if (isNaN(num)) return String(value);
  return num.toLocaleString('en-IN');
}

/**
 * Format number with en-IN locale by default.
 */
export function formatNumber(value: number | string | null | undefined, locale = 'en-IN'): string {
  if (value === null || value === undefined || value === '') return '0';
  const num = typeof value === 'number' ? value : Number(value);
  if (isNaN(num)) return String(value);
  return num.toLocaleString(locale);
}
