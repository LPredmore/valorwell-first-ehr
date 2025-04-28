/**
 * Validation utilities index
 * Exports all validation-related utilities for easy importing
 */

// Re-export all validation utilities
export * from './validationUtils';
export * from './schemaValidator';
export * from './uuidUtils';

// Export default objects for convenience
import ValidationUtils from './validationUtils';
import SchemaValidator from './schemaValidator';
import UUIDUtils from './uuidUtils';

export default {
  ...ValidationUtils,
  ...SchemaValidator,
  ...UUIDUtils
};