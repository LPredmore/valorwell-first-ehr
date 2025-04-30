
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
  if (!id) {
    console.debug('[UUID Debug] Empty ID provided for validation');
    return false;
  }
  
  try {
    const isValid = UUID_REGEX.test(id);
    console.debug(`[UUID Debug] Validating UUID: "${id}" => ${isValid ? 'VALID' : 'INVALID'}`);
    return isValid;
  } catch (error) {
    console.error('[UUID Debug] Error validating UUID:', id, error);
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
    
    console.error(`[UUID Debug] ensureUUID failed: ${message}`);
    throw new UUIDValidationError(message, { id });
  }
  
  try {
    console.debug(`[UUID Debug] Ensuring UUID (${entityName || 'unknown entity'}): "${id}"`);
    if (isValidUUID(id)) {
      console.debug(`[UUID Debug] UUID validation successful: "${id}"`);
      return id;
    } else {
      // Try additional format recovery for common UUID format issues
      const formattedId = formatAsUUID(id);
      if (formattedId !== id && isValidUUID(formattedId)) {
        console.warn(`[UUID Debug] UUID was invalid but formatted successfully: "${id}" → "${formattedId}"`);
        return formattedId;
      }
      
      const message = entityName 
        ? `Invalid ${entityName} ID format: ${id}` 
        : `Invalid UUID format: ${id}`;
      
      console.error(`[UUID Debug] ensureUUID failed: ${message}`);
      throw new UUIDValidationError(message, { id, formattedAttempt: formattedId });
    }
  } catch (error) {
    if (error instanceof UUIDValidationError) {
      throw error;
    }
    
    console.error('[UUID Debug] Unexpected error in ensureUUID:', error);
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
  if (!id) {
    console.debug('[UUID Debug] Empty ID provided for formatting');
    return id;
  }
  
  try {
    console.debug(`[UUID Debug] Attempting to format as UUID: "${id}"`);
    
    // If it's already a valid UUID, return it
    if (isValidUUID(id)) {
      console.debug(`[UUID Debug] ID is already a valid UUID: "${id}"`);
      return id;
    }
    
    // Remove all non-alphanumeric characters
    const cleanId = id.replace(/[^a-f0-9]/gi, '');
    console.debug(`[UUID Debug] Cleaned ID: "${cleanId}" (length: ${cleanId.length})`);
    
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
        console.info(`[UUID Debug] Successfully formatted ID: "${id}" → "${formattedUUID}"`);
        return formattedUUID;
      } else {
        console.warn(`[UUID Debug] Formatting attempt failed validation: "${formattedUUID}"`);
      }
    } else {
      console.warn(`[UUID Debug] ID has incorrect length after cleaning: ${cleanId.length} (expected 32)`);
    }
    
    // Handle potential edge cases
    if (id.includes('-')) {
      const parts = id.split('-');
      if (parts.length === 5 && 
          parts[0].length <= 8 && 
          parts[1].length <= 4 && 
          parts[2].length <= 4 && 
          parts[3].length <= 4 && 
          parts[4].length <= 12) {
        console.warn(`[UUID Debug] ID appears to be UUID-like but invalid: "${id}"`);
      }
    }
    
    // If we couldn't format it as a UUID, return the original
    console.debug(`[UUID Debug] Unable to format as UUID, returning original: "${id}"`);
    return id;
  } catch (error) {
    console.error('[UUID Debug] Error formatting UUID:', error);
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
