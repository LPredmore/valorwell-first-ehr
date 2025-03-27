import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to parse date strings from the database
export const parseDateString = (dateString: string | null): Date | null => {
  if (!dateString) return null;
  
  // Try to parse the date string
  const date = new Date(dateString);
  
  // Check if the date is valid
  if (isNaN(date.getTime())) {
    console.error(`Invalid date string: ${dateString}`);
    return null;
  }
  
  return date;
};

// Helper function to format dates for database storage
export const formatDateForDB = (date: Date | null): string | null => {
  if (!date) return null;
  
  // Format as ISO string and take just the date part (YYYY-MM-DD)
  return date.toISOString().split('T')[0];
};
