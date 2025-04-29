
/**
 * Validation utilities index
 * Exports all validation-related utilities for easy importing
 */

// Define the ValidationUtils interface to fix export issues
export interface ValidationUtils {
  validateNonEmptyString: (value: string, fieldName: string) => string;
  validateClinicianID: (clinicianID: string) => string;
  validateAvailabilitySlot: (date: string | Date, startTime: string, endTime: string, timeZone: string) => {
    date: Date;
    startTime: string;
    endTime: string;
    timeZone: string;
  };
}

// Re-export all validation utilities
export * from './validationUtils';
export * from './schemaValidator';
export * from './uuidUtils';

// Import named exports for combining into default export
import { validateAvailabilitySlot, validateNonEmptyString, validateClinicianID } from './validationUtils';
import { SchemaValidator } from './schemaValidator';

// Create a ValidationUtils object to export with corrected types
const ValidationUtils = {
  validateAvailabilitySlot,
  validateNonEmptyString,
  validateClinicianID
};

// Export combined default object for convenience
export default {
  ValidationUtils,
  SchemaValidator,
  validateAvailabilitySlot,
  validateNonEmptyString,
  validateClinicianID
};
