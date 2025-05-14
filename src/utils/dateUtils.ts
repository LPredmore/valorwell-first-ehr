
import { format, parse, parseISO, isValid } from 'date-fns';

/**
 * Parses a date string into a Date object in a standardized way
 * Handles ISO format strings, date-only strings, and other common formats
 * @param dateString The date string to parse
 * @returns Parsed Date object or null if invalid/empty
 */
export const parseDateString = (dateString: string | null | undefined): Date | null => {
  if (!dateString) return null;
  
  try {
    // First try parsing as ISO format
    const parsedIso = parseISO(dateString);
    if (isValid(parsedIso)) {
      console.log(`Successfully parsed ${dateString} as ISO format:`, parsedIso);
      return parsedIso;
    }
    console.log(`Failed to parse ${dateString} as ISO format`);
    
    // Try standard formats
    const formats = ['yyyy-MM-dd', 'MM/dd/yyyy', 'M/d/yyyy'];
    for (const formatStr of formats) {
      try {
        const parsedDate = parse(dateString, formatStr, new Date());
        if (isValid(parsedDate)) {
          console.log(`Successfully parsed ${dateString} as ${formatStr} format:`, parsedDate);
          return parsedDate;
        }
      } catch (e) {
        console.log(`Failed to parse ${dateString} as ${formatStr} format`);
      }
    }
    
    // Last resort: try the Date constructor
    const constructedDate = new Date(dateString);
    if (isValid(constructedDate) && !isNaN(constructedDate.getTime())) {
      console.log(`Successfully parsed ${dateString} with Date constructor:`, constructedDate);
      return constructedDate;
    }
    
    console.error(`All parsing methods failed for date string: ${dateString}`);
    return null;
  } catch (error) {
    console.error(`Error parsing date string: ${dateString}`, error);
    return null;
  }
};

/**
 * Formats a Date object or string into a database-compliant date string (YYYY-MM-DD)
 * @param date Date object or string to format
 * @returns Formatted date string or null if invalid/empty
 */
export const formatDateForDB = (date: Date | string | null | undefined): string | null => {
  if (!date) return null;
  
  try {
    // If already a string, parse it first to ensure valid date
    const dateObj = typeof date === 'string' ? parseDateString(date) : date;
    
    // Return null if parsing failed
    if (!dateObj) return null;
    
    // Format as YYYY-MM-DD for database
    return format(dateObj, 'yyyy-MM-dd');
  } catch (error) {
    console.error(`Error formatting date for DB: ${date}`, error);
    return null;
  }
};

/**
 * Calculates age from a date of birth
 * @param dateOfBirth Date object or string representing date of birth
 * @returns Age in years or null if invalid/empty
 */
export const calculateAge = (dateOfBirth: Date | string | null | undefined): number | null => {
  if (!dateOfBirth) return null;
  
  try {
    // If string, parse it first
    const dob = typeof dateOfBirth === 'string' ? parseDateString(dateOfBirth) : dateOfBirth;
    
    // Return null if parsing failed
    if (!dob) return null;
    
    // Calculate age
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    
    // Adjust age if birthday hasn't occurred yet this year
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    
    return age;
  } catch (error) {
    console.error(`Error calculating age from date of birth: ${dateOfBirth}`, error);
    return null;
  }
};
