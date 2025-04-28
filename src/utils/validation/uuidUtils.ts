import { AppError } from '@/utils/errors';

/**
 * UUID validation error class
 */
export class UUIDValidationError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'UUID_VALIDATION_ERROR', context);
    this.name = 'UUIDValidationError';
  }
}

/**
 * Regular expression for validating UUID format
 * Matches standard UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 * where x is a hexadecimal digit (0-9, a-f, A-F)
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Checks if a string is a valid UUID
 * 
 * @param id - The string to validate as a UUID
 * @returns boolean - True if the string is a valid UUID, false otherwise
 */
export function isValidUUID(id: string): boolean {
  if (!id) return false;
  
  try {
    return UUID_REGEX.test(id);
  } catch (error) {
    console.error('[UUID Validation] Error validating UUID:', error);
    return false;
  }
}

/**
 * Validates a UUID and returns it if valid, throws an error if invalid
 * 
 * @param id - The string to validate as a UUID
 * @param entityName - Optional name of the entity for better error messages (e.g., 'Clinician', 'Appointment')
 * @returns string - The validated UUID
 * @throws UUIDValidationError if the ID is not a valid UUID
 */
export function ensureUUID(id: string, entityName?: string): string {
  if (!id) {
    const message = entityName 
      ? `${entityName} ID is required` 
      : 'ID is required';
    
    throw new UUIDValidationError(message, { id });
  }
  
  try {
    if (isValidUUID(id)) {
      return id;
    } else {
      const message = entityName 
        ? `Invalid ${entityName} ID format: ${id}` 
        : `Invalid UUID format: ${id}`;
      
      throw new UUIDValidationError(message, { id });
    }
  } catch (error) {
    if (error instanceof UUIDValidationError) {
      throw error;
    }
    
    console.error('[UUID Validation] Error processing ID:', error);
    throw new UUIDValidationError(
      `Error validating UUID: ${(error as Error).message}`,
      { id, originalError: error }
    );
  }
}

/**
 * Attempts to format a string as a UUID if possible
 * This is useful for handling IDs that might be missing hyphens or have other minor format issues
 * 
 * @param id - The string to format as a UUID
 * @returns string - The formatted UUID if possible, or the original string if not
 */
export function formatAsUUID(id: string): string {
  if (!id) return id;
  
  try {
    // If it's already a valid UUID, return it
    if (isValidUUID(id)) {
      return id;
    }
    
    // Remove all non-alphanumeric characters
    const cleanId = id.replace(/[^a-f0-9]/gi, '');
    
    // Check if we have exactly 32 hex characters
    if (cleanId.length === 32) {
      // Insert hyphens in the correct positions
      const formattedUUID = 
        cleanId.substring(0, 8) + '-' + 
        cleanId.substring(8, 12) + '-' + 
        cleanId.substring(12, 16) + '-' + 
        cleanId.substring(16, 20) + '-' + 
        cleanId.substring(20);
      
      // Verify the formatted string is a valid UUID
      if (isValidUUID(formattedUUID)) {
        console.info(`[UUID Validation] Successfully formatted ID: ${id} → ${formattedUUID}`);
        return formattedUUID;
      }
    }
    
    // If we couldn't format it as a UUID, return the original
    return id;
  } catch (error) {
    console.error('[UUID Validation] Error formatting UUID:', error);
    return id;
  }
}

/**
 * Utility module for UUID validation
 */
export const UUIDUtils = {
  isValidUUID,
  ensureUUID,
  formatAsUUID
};

// Default export for convenience
export default UUIDUtils;