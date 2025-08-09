import { parseISO } from 'date-fns';

/**
 * Convert a Date object to YYYY-MM-DD string format
 * Uses local timezone to avoid timezone conversion issues
 */
export const toYMD = (d: Date): string => {
  // Use local date components to avoid timezone conversion
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Parse a YYYY-MM-DD string to a Date object
 * Treats the string as a local date to avoid timezone issues
 */
export const fromYMD = (s: string): Date => {
  return parseISO(s);
};
