
/**
 * Validation utilities index
 * Exports all validation-related utilities for easy importing
 */

// Re-export all validation utilities
export * from './validationUtils';
export * from './schemaValidator';
export * from './uuidUtils';

// Import named exports for combining into default export
import { ValidationUtils } from './validationUtils';
import { SchemaValidator } from './schemaValidator';
import { validateAvailabilitySlot, validateNonEmptyString, validateClinicianID } from './validationUtils';

// Export combined default object for convenience
export default {
  ValidationUtils,
  SchemaValidator,
  validateAvailabilitySlot,
  validateNonEmptyString,
  validateClinicianID
};
