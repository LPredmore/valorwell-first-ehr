import { z } from 'zod';
import { DateTime } from 'luxon';
import { ValidationError } from '@/utils/errors';
import { TimeZoneService } from '@/utils/timezone';
import { ClinicianIDUtils, isValidClinicianID, ensureClinicianID } from './clinicianUtils';

/**
 * Common validation utilities for the application
 * Provides reusable validation functions for various data types
 */

// ==================== String Validators ====================

/**
 * Validates that a string is not empty
 * @param value The string to validate
 * @param fieldName Optional field name for error message
 * @returns The trimmed string if valid
 * @throws ValidationError if the string is empty
 */
export function validateNonEmptyString(value: string | null | undefined, fieldName: string = 'Field'): string {
  if (!value || value.trim() === '') {
    throw new ValidationError(`${fieldName} cannot be empty`, {
      field: fieldName.toLowerCase().replace(/\s+/g, '_'),
      userMessage: `${fieldName} is required`
    });
  }
  return value.trim();
}

/**
 * Validates that a string has a minimum length
 * @param value The string to validate
 * @param minLength The minimum length required
 * @param fieldName Optional field name for error message
 * @returns The trimmed string if valid
 * @throws ValidationError if the string is shorter than minLength
 */
export function validateStringLength(
  value: string | null | undefined, 
  minLength: number, 
  maxLength?: number, 
  fieldName: string = 'Field'
): string {
  const trimmed = value?.trim() || '';
  
  if (trimmed.length < minLength) {
    throw new ValidationError(`${fieldName} must be at least ${minLength} characters`, {
      field: fieldName.toLowerCase().replace(/\s+/g, '_'),
      userMessage: `${fieldName} must be at least ${minLength} characters`
    });
  }
  
  if (maxLength && trimmed.length > maxLength) {
    throw new ValidationError(`${fieldName} must be no more than ${maxLength} characters`, {
      field: fieldName.toLowerCase().replace(/\s+/g, '_'),
      userMessage: `${fieldName} must be no more than ${maxLength} characters`
    });
  }
  
  return trimmed;
}

/**
 * Validates an email address
 * @param email The email to validate
 * @param fieldName Optional field name for error message
 * @returns The trimmed email if valid
 * @throws ValidationError if the email is invalid
 */
export function validateEmail(email: string | null | undefined, fieldName: string = 'Email'): string {
  const trimmed = email?.trim() || '';
  
  // Basic email regex pattern
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailPattern.test(trimmed)) {
    throw new ValidationError(`Invalid email format: ${email}`, {
      field: fieldName.toLowerCase().replace(/\s+/g, '_'),
      userMessage: 'Please enter a valid email address'
    });
  }
  
  return trimmed;
}

/**
 * Validates a phone number
 * @param phone The phone number to validate
 * @param fieldName Optional field name for error message
 * @returns The formatted phone number if valid
 * @throws ValidationError if the phone number is invalid
 */
export function validatePhone(phone: string | null | undefined, fieldName: string = 'Phone'): string {
  const cleaned = phone?.replace(/\D/g, '') || '';
  
  if (cleaned.length < 10) {
    throw new ValidationError(`Invalid phone number: ${phone}`, {
      field: fieldName.toLowerCase().replace(/\s+/g, '_'),
      userMessage: 'Please enter a valid phone number with at least 10 digits'
    });
  }
  
  return cleaned;
}

// ==================== Number Validators ====================

/**
 * Validates that a number is within a specified range
 * @param value The number to validate
 * @param min The minimum allowed value
 * @param max The maximum allowed value
 * @param fieldName Optional field name for error message
 * @returns The number if valid
 * @throws ValidationError if the number is outside the range
 */
export function validateNumberRange(
  value: number | null | undefined, 
  min: number, 
  max: number, 
  fieldName: string = 'Value'
): number {
  if (value === null || value === undefined) {
    throw new ValidationError(`${fieldName} is required`, {
      field: fieldName.toLowerCase().replace(/\s+/g, '_'),
      userMessage: `${fieldName} is required`
    });
  }
  
  if (value < min) {
    throw new ValidationError(`${fieldName} must be at least ${min}`, {
      field: fieldName.toLowerCase().replace(/\s+/g, '_'),
      userMessage: `${fieldName} must be at least ${min}`
    });
  }
  
  if (value > max) {
    throw new ValidationError(`${fieldName} must be no more than ${max}`, {
      field: fieldName.toLowerCase().replace(/\s+/g, '_'),
      userMessage: `${fieldName} must be no more than ${max}`
    });
  }
  
  return value;
}

/**
 * Validates that a value is a positive number
 * @param value The number to validate
 * @param fieldName Optional field name for error message
 * @returns The number if valid
 * @throws ValidationError if the number is not positive
 */
export function validatePositiveNumber(
  value: number | null | undefined, 
  fieldName: string = 'Value'
): number {
  if (value === null || value === undefined) {
    throw new ValidationError(`${fieldName} is required`, {
      field: fieldName.toLowerCase().replace(/\s+/g, '_'),
      userMessage: `${fieldName} is required`
    });
  }
  
  if (value <= 0) {
    throw new ValidationError(`${fieldName} must be a positive number`, {
      field: fieldName.toLowerCase().replace(/\s+/g, '_'),
      userMessage: `${fieldName} must be a positive number`
    });
  }
  
  return value;
}

// ==================== Date Validators ====================

/**
 * Validates a date string
 * @param dateStr The date string to validate
 * @param format The expected format (default: 'yyyy-MM-dd')
 * @param fieldName Optional field name for error message
 * @returns The validated date string
 * @throws ValidationError if the date is invalid
 */
export function validateDateString(
  dateStr: string | null | undefined, 
  format: string = 'yyyy-MM-dd',
  fieldName: string = 'Date'
): string {
  if (!dateStr) {
    throw new ValidationError(`${fieldName} is required`, {
      field: fieldName.toLowerCase().replace(/\s+/g, '_'),
      userMessage: `${fieldName} is required`
    });
  }
  
  const date = DateTime.fromFormat(dateStr, format);
  
  if (!date.isValid) {
    throw new ValidationError(`Invalid date format: ${dateStr}. Expected format: ${format}`, {
      field: fieldName.toLowerCase().replace(/\s+/g, '_'),
      userMessage: `Please enter a valid date in the format ${format}`
    });
  }
  
  return dateStr;
}

/**
 * Validates that a date is in the future
 * @param date The date to validate
 * @param fieldName Optional field name for error message
 * @returns The date if valid
 * @throws ValidationError if the date is not in the future
 */
export function validateFutureDate(
  date: Date | string | null | undefined,
  fieldName: string = 'Date'
): Date {
  let dateObj: Date;
  
  if (!date) {
    throw new ValidationError(`${fieldName} is required`, {
      field: fieldName.toLowerCase().replace(/\s+/g, '_'),
      userMessage: `${fieldName} is required`
    });
  }
  
  if (typeof date === 'string') {
    dateObj = new Date(date);
  } else {
    dateObj = date;
  }
  
  const now = new Date();
  
  if (dateObj <= now) {
    throw new ValidationError(`${fieldName} must be in the future`, {
      field: fieldName.toLowerCase().replace(/\s+/g, '_'),
      userMessage: `${fieldName} must be in the future`
    });
  }
  
  return dateObj;
}

/**
 * Validates that a date is in the past
 * @param date The date to validate
 * @param fieldName Optional field name for error message
 * @returns The date if valid
 * @throws ValidationError if the date is not in the past
 */
export function validatePastDate(
  date: Date | string | null | undefined,
  fieldName: string = 'Date'
): Date {
  let dateObj: Date;
  
  if (!date) {
    throw new ValidationError(`${fieldName} is required`, {
      field: fieldName.toLowerCase().replace(/\s+/g, '_'),
      userMessage: `${fieldName} is required`
    });
  }
  
  if (typeof date === 'string') {
    dateObj = new Date(date);
  } else {
    dateObj = date;
  }
  
  const now = new Date();
  
  if (dateObj >= now) {
    throw new ValidationError(`${fieldName} must be in the past`, {
      field: fieldName.toLowerCase().replace(/\s+/g, '_'),
      userMessage: `${fieldName} must be in the past`
    });
  }
  
  return dateObj;
}

// ==================== Healthcare-Specific Validators ====================

/**
 * Validates an appointment time
 * @param startTime The start time of the appointment
 * @param endTime The end time of the appointment
 * @param timeZone The timezone for the appointment
 * @returns An object with the validated start and end times
 * @throws ValidationError if the appointment time is invalid
 */
export function validateAppointmentTime(
  startTime: string | null | undefined,
  endTime: string | null | undefined,
  timeZone: string | null | undefined
): { startTime: string; endTime: string; timeZone: string } {
  // Validate inputs
  if (!startTime) {
    throw new ValidationError('Start time is required', {
      field: 'start_time',
      userMessage: 'Start time is required'
    });
  }
  
  if (!endTime) {
    throw new ValidationError('End time is required', {
      field: 'end_time',
      userMessage: 'End time is required'
    });
  }
  
  // Validate timezone
  const validTimeZone = TimeZoneService.ensureIANATimeZone(timeZone || '');
  if (!validTimeZone) {
    throw new ValidationError('Invalid timezone', {
      field: 'time_zone',
      userMessage: 'Please select a valid timezone'
    });
  }
  
  // Parse times with timezone
  const start = TimeZoneService.parseWithZone(startTime, validTimeZone);
  const end = TimeZoneService.parseWithZone(endTime, validTimeZone);
  
  // Validate parsed times
  if (!start.isValid) {
    throw new ValidationError(`Invalid start time: ${start.invalidReason}`, {
      field: 'start_time',
      userMessage: 'Please enter a valid start time'
    });
  }
  
  if (!end.isValid) {
    throw new ValidationError(`Invalid end time: ${end.invalidReason}`, {
      field: 'end_time',
      userMessage: 'Please enter a valid end time'
    });
  }
  
  // Validate that end time is after start time
  if (end <= start) {
    throw new ValidationError('End time must be after start time', {
      field: 'time_range',
      userMessage: 'End time must be after start time'
    });
  }
  
  return {
    startTime: start.toISO() || '',
    endTime: end.toISO() || '',
    timeZone: validTimeZone
  };
}

/**
 * Validates an availability slot
 * @param date The date of the availability
 * @param startTime The start time of the availability
 * @param endTime The end time of the availability
 * @param timeZone The timezone for the availability
 * @returns An object with the validated availability data
 * @throws ValidationError if the availability is invalid
 */
export function validateAvailabilitySlot(
  date: Date | string | null | undefined,
  startTime: string | null | undefined,
  endTime: string | null | undefined,
  timeZone: string | null | undefined
): { date: Date; startTime: string; endTime: string; timeZone: string } {
  // Validate date
  if (!date) {
    throw new ValidationError('Date is required', {
      field: 'date',
      userMessage: 'Please select a date for the availability slot'
    });
  }
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Validate times
  const validatedTimes = validateAppointmentTime(startTime, endTime, timeZone);
  
  return {
    date: dateObj,
    ...validatedTimes
  };
}

// ==================== Array Validators ====================

/**
 * Validates that an array has a minimum length
 * @param array The array to validate
 * @param minLength The minimum length required
 * @param fieldName Optional field name for error message
 * @returns The array if valid
 * @throws ValidationError if the array is shorter than minLength
 */
export function validateArrayLength<T>(
  array: T[] | null | undefined,
  minLength: number,
  fieldName: string = 'Items'
): T[] {
  if (!array || array.length < minLength) {
    throw new ValidationError(`${fieldName} must have at least ${minLength} item(s)`, {
      field: fieldName.toLowerCase().replace(/\s+/g, '_'),
      userMessage: `${fieldName} must have at least ${minLength} item(s)`
    });
  }
  
  return array;
}

// ==================== Object Validators ====================

/**
 * Validates that an object has all required properties
 * @param obj The object to validate
 * @param requiredProps The required property names
 * @param objectName Optional object name for error message
 * @returns The object if valid
 * @throws ValidationError if any required property is missing
 */
export function validateRequiredProperties<T extends Record<string, any>>(
  obj: T | null | undefined,
  requiredProps: string[],
  objectName: string = 'Object'
): T {
  if (!obj) {
    throw new ValidationError(`${objectName} is required`, {
      field: objectName.toLowerCase().replace(/\s+/g, '_'),
      userMessage: `${objectName} is required`
    });
  }
  
  for (const prop of requiredProps) {
    if (obj[prop] === undefined || obj[prop] === null || obj[prop] === '') {
      throw new ValidationError(`${objectName} is missing required property: ${prop}`, {
        field: prop,
        userMessage: `${prop} is required`
      });
    }
  }
  
  return obj;
}

// ==================== Zod Schema Helpers ====================

/**
 * Creates a Zod schema for a non-empty string
 * @param fieldName The field name for error messages
 * @returns A Zod schema for a non-empty string
 */
export function nonEmptyStringSchema(fieldName: string = 'Field'): z.ZodString {
  return z.string()
    .min(1, `${fieldName} is required`)
    .transform(val => val.trim());
}

/**
 * Creates a Zod schema for an email
 * @returns A Zod schema for an email
 */
export function emailSchema(): z.ZodString {
  return z.string()
    .email('Please enter a valid email address')
    .transform(val => val.trim());
}

/**
 * Creates a Zod schema for a phone number
 * @returns A Zod schema for a phone number
 */
export function phoneSchema(): z.ZodString {
  return z.string()
    .min(10, 'Phone number must have at least 10 digits')
    .regex(/^\+?[0-9\s\-\(\)]+$/, 'Please enter a valid phone number')
    .transform(val => val.replace(/\D/g, ''));
}

/**
 * Creates a Zod schema for a date string
 * @param format The expected format (default: 'yyyy-MM-dd')
 * @returns A Zod schema for a date string
 */
export function dateStringSchema(format: string = 'yyyy-MM-dd'): z.ZodString {
  return z.string()
    .refine(val => {
      const date = DateTime.fromFormat(val, format);
      return date.isValid;
    }, `Please enter a valid date in the format ${format}`);
}

/**
 * Validates a clinician ID
 * @param id The clinician ID to validate
 * @param fieldName Optional field name for error message
 * @returns The validated clinician ID
 * @throws ValidationError if the clinician ID is invalid
 */
export function validateClinicianID(id: string | null | undefined, fieldName: string = 'Clinician ID'): string {
  if (!id) {
    throw new ValidationError(`${fieldName} is required`, {
      field: fieldName.toLowerCase().replace(/\s+/g, '_'),
      userMessage: `${fieldName} is required`
    });
  }
  
  try {
    return ensureClinicianID(id);
  } catch (error) {
    throw new ValidationError(`Invalid ${fieldName}: ${id}`, {
      field: fieldName.toLowerCase().replace(/\s+/g, '_'),
      userMessage: `Please enter a valid ${fieldName}`,
      cause: error instanceof Error ? error : undefined,
      context: { error }
    });
  }
}

/**
 * Creates a Zod schema for a clinician ID
 * @returns A Zod schema for a clinician ID
 */
export function clinicianIDSchema(): z.ZodString {
  return z.string()
    .min(1, 'Clinician ID is required')
    .refine(val => isValidClinicianID(val), {
      message: 'Please enter a valid Clinician ID'
    });
}

// Export a default object for convenience
export default {
  validateNonEmptyString,
  validateClinicianID,
  clinicianIDSchema,
  validateStringLength,
  validateEmail,
  validatePhone,
  validateNumberRange,
  validatePositiveNumber,
  validateDateString,
  validateFutureDate,
  validatePastDate,
  validateAppointmentTime,
  validateAvailabilitySlot,
  validateArrayLength,
  validateRequiredProperties,
  nonEmptyStringSchema,
  emailSchema,
  phoneSchema,
  dateStringSchema
};