import { createClient } from '@supabase/supabase-js';
import { format, parse } from 'date-fns';

// Initialize the Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Parses a date string from the database into a Date object
 * @param dateString The date string from the database
 * @returns A Date object or null if the date string is invalid
 */
export function parseDateString(dateString: string | null): Date | null {
  if (!dateString) return null;
  
  try {
    // Try ISO format first (YYYY-MM-DD)
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return new Date(dateString);
    }
    
    // Try other common formats
    const formats = [
      'yyyy-MM-dd',
      'MM/dd/yyyy',
      'dd/MM/yyyy',
      'yyyy/MM/dd',
      'MMM d, yyyy',
      'MMMM d, yyyy'
    ];
    
    for (const formatString of formats) {
      try {
        return parse(dateString, formatString, new Date());
      } catch (e) {
        // Continue to next format if parsing fails
      }
    }
    
    // If all else fails, try creating a date directly
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date;
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing date:', error);
    return null;
  }
}

/**
 * Formats a Date object for storage in the database
 * @param date The Date object to format
 * @returns A string in YYYY-MM-DD format
 */
export function formatDateForDB(date: Date | null): string | null {
  if (!date) return null;
  
  try {
    return format(date, 'yyyy-MM-dd');
  } catch (error) {
    console.error('Error formatting date:', error);
    return null;
  }
}

/**
 * Formats a date string for display
 * @param dateString The date string from the database
 * @returns A formatted date string for display
 */
export function formatDateForDisplay(dateString: string | null): string {
  if (!dateString) return '';
  
  const date = parseDateString(dateString);
  if (!date) return '';
  
  try {
    return format(date, 'MMMM d, yyyy');
  } catch (error) {
    console.error('Error formatting date for display:', error);
    return '';
  }
}

// Helper function to convert array of strings to proper format for Supabase
export function formatArrayForDB(array: string[]): string[] {
  return array.filter(item => item.trim() !== '');
}
