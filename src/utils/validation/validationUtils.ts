
import { z } from 'zod';
import { DateTime } from 'luxon';
import { TimeZoneService } from '@/utils/timezone';

/**
 * Utility functions for common validation patterns
 */
export const ValidationUtils = {
  /**
   * Create a string schema with minimum length validation
   * @param minLength Minimum length
   * @param message Custom error message
   * @returns Zod string schema
   */
  minLength: (minLength: number, message?: string): z.ZodString => {
    return z.string().min(minLength, message || `Must be at least ${minLength} characters`);
  },
  
  /**
   * Create a string schema with maximum length validation
   * @param maxLength Maximum length
   * @param message Custom error message
   * @returns Zod string schema
   */
  maxLength: (maxLength: number, message?: string): z.ZodString => {
    return z.string().max(maxLength, message || `Cannot exceed ${maxLength} characters`);
  },
  
  /**
   * Create a string schema with email validation
   * @param message Custom error message
   * @returns Zod string schema
   */
  email: (message?: string): z.ZodString => {
    return z.string().email(message || 'Invalid email address');
  },
  
  /**
   * Create a string schema with URL validation
   * @param message Custom error message
   * @returns Zod string schema
   */
  url: (message?: string): z.ZodString => {
    return z.string().url(message || 'Invalid URL');
  },
  
  /**
   * Create a string schema with pattern validation
   * @param pattern Regular expression pattern
   * @param message Custom error message
   * @returns Zod string schema
   */
  pattern: (pattern: RegExp, message?: string): z.ZodString => {
    return z.string().regex(pattern, message || 'Invalid format');
  },
  
  /**
   * Create a phone number validation schema
   * @param message Custom error message
   * @returns Zod effect schema that validates and formats phone numbers
   */
  phoneNumber: (message?: string) => {
    return z.string().refine((val) => {
      // Allow empty strings (for optional phone numbers)
      if (val === '') return true;
      
      // Remove all non-digit characters
      const digitsOnly = val.replace(/\D/g, '');
      
      // US phone numbers should have 10 digits
      return digitsOnly.length === 10;
    }, {
      message: message || 'Invalid phone number',
    });
  },
  
  /**
   * Create a date validation schema
   * @param options Date validation options
   * @returns Zod date schema
   */
  date: (options?: {
    min?: Date;
    max?: Date;
    minMessage?: string;
    maxMessage?: string;
  }) => {
    let schema = z.date();
    
    if (options?.min) {
      schema = schema.min(options.min, options.minMessage || 'Date is too early');
    }
    
    if (options?.max) {
      schema = schema.max(options.max, options.maxMessage || 'Date is too late');
    }
    
    return schema;
  },
  
  /**
   * Create a schema for a string that must be one of a set of values
   * @param values Allowed values
   * @param message Custom error message
   * @returns Zod enum schema
   */
  oneOf: <T extends [string, ...string[]]>(values: T, message?: string) => {
    return z.enum(values, {
      errorMap: () => ({ message: message || `Must be one of: ${values.join(', ')}` })
    });
  },
  
  /**
   * Create a password validation schema
   * @param options Password validation options
   * @returns Zod effect schema that validates password strength
   */
  password: (options?: {
    minLength?: number;
    requireNumber?: boolean;
    requireSpecial?: boolean;
    requireUppercase?: boolean;
    requireLowercase?: boolean;
    message?: string;
  }) => {
    const minLength = options?.minLength ?? 8;
    
    return z.string().refine((val) => {
      let valid = val.length >= minLength;
      
      if (options?.requireNumber) {
        valid = valid && /[0-9]/.test(val);
      }
      
      if (options?.requireSpecial) {
        valid = valid && /[^A-Za-z0-9]/.test(val);
      }
      
      if (options?.requireUppercase) {
        valid = valid && /[A-Z]/.test(val);
      }
      
      if (options?.requireLowercase) {
        valid = valid && /[a-z]/.test(val);
      }
      
      return valid;
    }, {
      message: options?.message || 'Password does not meet requirements',
    });
  },
  
  /**
   * Create a ZIP code validation schema
   * @param message Custom error message
   * @returns Zod effect schema that validates US ZIP codes
   */
  zipCode: (message?: string) => {
    return z.string().refine((val) => {
      // Allow empty strings (for optional ZIP codes)
      if (val === '') return true;
      
      // Basic US ZIP code validation
      return /^\d{5}(-\d{4})?$/.test(val);
    }, {
      message: message || 'Invalid ZIP code',
    });
  },
  
  /**
   * Create a schema for a US state code
   * @param message Custom error message
   * @returns Zod string schema that validates US state codes
   */
  usState: (message?: string) => {
    const states = [
      'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
      'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
      'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
      'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
      'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
      'DC', 'AS', 'GU', 'MP', 'PR', 'VI'
    ] as const;
    
    return z.enum(states, {
      errorMap: () => ({ message: message || 'Invalid US state code' })
    });
  },
  
  /**
   * Create a credit card number validation schema
   * @param message Custom error message
   * @returns Zod effect schema that validates credit card numbers
   */
  creditCardNumber: (message?: string) => {
    return z.string().refine((val) => {
      // Allow empty strings (for optional credit card numbers)
      if (val === '') return true;
      
      // Remove all non-digit characters
      const digitsOnly = val.replace(/\D/g, '');
      
      // Check length (13-19 digits for major card networks)
      if (digitsOnly.length < 13 || digitsOnly.length > 19) {
        return false;
      }
      
      // Luhn algorithm validation
      let sum = 0;
      let shouldDouble = false;
      
      for (let i = digitsOnly.length - 1; i >= 0; i--) {
        let digit = parseInt(digitsOnly.charAt(i));
        
        if (shouldDouble) {
          digit *= 2;
          if (digit > 9) digit -= 9;
        }
        
        sum += digit;
        shouldDouble = !shouldDouble;
      }
      
      return sum % 10 === 0;
    }, {
      message: message || 'Invalid credit card number',
    });
  }
};

/**
 * Validates an availability time slot
 * @param date The date for the slot
 * @param startTime The start time (HH:MM format)
 * @param endTime The end time (HH:MM format)
 * @param timeZone The time zone for the slot
 * @returns Validated date, start time, end time, and time zone
 */
export function validateAvailabilitySlot(
  date: Date | string,
  startTime: string,
  endTime: string,
  timeZone: string
) {
  // Ensure valid time zone
  const validTimeZone = TimeZoneService.ensureIANATimeZone(timeZone);
  
  // Convert date to proper format if needed
  let formattedDate: Date;
  if (typeof date === 'string') {
    formattedDate = new Date(date);
  } else {
    formattedDate = date;
  }
  
  if (isNaN(formattedDate.getTime())) {
    throw new Error('Invalid date format');
  }
  
  // Validate time formats
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(startTime)) {
    throw new Error('Invalid start time format. Use HH:MM format.');
  }
  
  if (!timeRegex.test(endTime)) {
    throw new Error('Invalid end time format. Use HH:MM format.');
  }
  
  // Validate end time is after start time
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  if (endHour < startHour || (endHour === startHour && endMinute <= startMinute)) {
    throw new Error('End time must be after start time');
  }
  
  return {
    date: formattedDate,
    startTime,
    endTime,
    timeZone: validTimeZone
  };
}

/**
 * Validates a non-empty string
 * @param value The string to validate
 * @param fieldName The name of the field for error messages
 */
export function validateNonEmptyString(value: string, fieldName: string): string {
  if (!value || value.trim() === '') {
    throw new Error(`${fieldName} cannot be empty`);
  }
  return value.trim();
}

/**
 * Validates and formats a clinician ID
 * @param clinicianId The clinician ID to validate
 * @returns The validated and formatted clinician ID
 */
export function validateClinicianID(clinicianId: string): string {
  const value = validateNonEmptyString(clinicianId, 'Clinician ID');
  
  // Check if it's a valid UUID format
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  if (!uuidRegex.test(value)) {
    throw new Error('Invalid clinician ID format');
  }
  
  return value;
}

// Export default for backward compatibility
const ValidationUtilsExport = {
  ...ValidationUtils,
  validateAvailabilitySlot,
  validateNonEmptyString,
  validateClinicianID
};

export default ValidationUtilsExport;
