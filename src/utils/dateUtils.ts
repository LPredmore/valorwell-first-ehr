
import { DateTime } from 'luxon';

/**
 * Calculates age in years from a date of birth using Luxon.
 * Handles string (ISO or other parsable formats) or Date object inputs.
 * @param dateOfBirth - The date of birth, can be a Date object, an ISO string, 
 * another date string parsable by Luxon, or null/undefined.
 * @returns number representing age in years, or null if input is invalid or not provided.
 */
export const calculateAge = (dateOfBirth: Date | string | null | undefined): number | null => { 
  // If no dateOfBirth is provided (this will catch null, undefined, empty string etc.), 
  // return null immediately.
  if (!dateOfBirth) {
    console.warn("[calculateAge] dateOfBirth is null, undefined, or empty.");
    return null;
  }

  let dobDateTime;

  // Check if dateOfBirth is a string and attempt to parse it with Luxon
  if (typeof dateOfBirth === 'string') {
    try {
      // Try ISO format first
      dobDateTime = DateTime.fromISO(dateOfBirth);
      
      // If not valid, try other formats
      if (!dobDateTime.isValid) {
        console.warn(`[calculateAge] ISO parsing failed for: "${dateOfBirth}". Trying SQL date format.`);
        dobDateTime = DateTime.fromSQL(dateOfBirth);
      }
      
      // If still not valid, try general parsing
      if (!dobDateTime.isValid) {
        console.warn(`[calculateAge] SQL date parsing failed for: "${dateOfBirth}". Trying general format.`);
        dobDateTime = DateTime.fromFormat(dateOfBirth, 'yyyy-MM-dd');
      }
    } catch (e) {
      console.warn(`[calculateAge] Error parsing date string: "${dateOfBirth}"`, e);
      try {
        // Last resort - try JavaScript Date object and convert to Luxon
        const jsDate = new Date(dateOfBirth);
        dobDateTime = DateTime.fromJSDate(jsDate);
      } catch (e2) {
        console.error(`[calculateAge] All parsing attempts failed for: "${dateOfBirth}"`, e2);
        return null;
      }
    }
  } else if (dateOfBirth instanceof Date) {
    // If it's a Date object, convert to Luxon
    dobDateTime = DateTime.fromJSDate(dateOfBirth);
  } else {
    // Unknown type
    console.warn("[calculateAge] dateOfBirth is of an unexpected type:", typeof dateOfBirth);
    return null;
  }

  // Final validation: Check if the resulting dobDateTime is valid
  if (!dobDateTime || !dobDateTime.isValid) {
    console.warn("[calculateAge] Invalid date result after parsing:", dateOfBirth);
    return null;
  }

  // Calculate the difference in years from today using Luxon
  const now = DateTime.now();
  const age = now.diff(dobDateTime, 'years').years;
  
  // Round down to whole years
  const wholeYears = Math.floor(age);
  
  console.log(`[calculateAge] Calculated age: ${wholeYears} for DOB: ${dobDateTime.toISODate()}`);
  return wholeYears;
};

/**
 * Helper function to parse date strings into Date objects
 * @param dateString - The date string to parse
 * @returns Date object if successful, null otherwise
 */
export const parseDateString = (dateString: string | null | undefined): Date | null => {
  if (!dateString) return null;
  
  try {
    // Try parsing as Luxon DateTime first
    const luxonDate = DateTime.fromISO(dateString);
    if (luxonDate.isValid) {
      console.log(`Successfully parsed date ${dateString} as ISO format:`, luxonDate.toJSDate());
      return luxonDate.toJSDate();
    }
  } catch (e) {
    console.error(`Error parsing ${dateString} as ISO:`, e);
  }
  
  try {
    // Try SQL format (YYYY-MM-DD)
    const luxonDate = DateTime.fromSQL(dateString);
    if (luxonDate.isValid) {
      console.log(`Successfully parsed date ${dateString} as SQL format:`, luxonDate.toJSDate());
      return luxonDate.toJSDate();
    }
  } catch (e) {
    console.error(`Error parsing ${dateString} as SQL:`, e);
  }
  
  try {
    // Last resort: use regular JS Date constructor
    const dateObj = new Date(dateString);
    if (!isNaN(dateObj.getTime())) {
      console.log(`Successfully parsed date ${dateString} with Date constructor:`, dateObj);
      return dateObj;
    }
  } catch (e) {
    console.error(`Error parsing ${dateString} with Date constructor:`, e);
  }
  
  console.warn(`Could not parse date string: ${dateString}`);
  return null;
};

/**
 * Format a date for database storage (YYYY-MM-DD)
 * @param date - Date object or string to format
 * @returns Formatted date string for database or null if invalid
 */
export const formatDateForDB = (date: Date | string | null | undefined): string | null => {
  if (!date) return null;
  
  let dateTime: DateTime | null = null;
  
  // Convert to Luxon DateTime based on input type
  if (typeof date === 'string') {
    try {
      dateTime = DateTime.fromISO(date);
      
      if (!dateTime.isValid) {
        dateTime = DateTime.fromSQL(date);
      }
      
      if (!dateTime.isValid) {
        const jsDate = new Date(date);
        if (!isNaN(jsDate.getTime())) {
          dateTime = DateTime.fromJSDate(jsDate);
        }
      }
    } catch (e) {
      console.error(`[formatDateForDB] Error parsing date string: "${date}"`, e);
      return null;
    }
  } else if (date instanceof Date) {
    dateTime = DateTime.fromJSDate(date);
  }
  
  // If we couldn't parse the date, return null
  if (!dateTime || !dateTime.isValid) {
    console.warn(`[formatDateForDB] Invalid date: ${date}`);
    return null;
  }
  
  // Format as YYYY-MM-DD for database storage
  const formattedDate = dateTime.toFormat('yyyy-MM-dd');
  console.log(`[formatDateForDB] Formatted date: ${formattedDate}`);
  return formattedDate;
};
