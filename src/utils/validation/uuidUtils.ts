
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
 * Validates if a string represents a valid UUID, with more lenient checks for edge cases
 * 
 * @param id - The string to validate as a UUID
 * @returns boolean - True if the string is a valid UUID, false otherwise
 */
export function isValidUUID(id: string | null | undefined): boolean {
  if (!id) {
    console.debug('[UUID Debug] Empty ID provided for validation');
    return false;
  }
  
  // Convert to string and trim (in case it's not already a string)
  const idStr = String(id).trim();
  
  try {
    // First try standard regex validation
    const isValid = UUID_REGEX.test(idStr);
    
    // If it's valid, return true immediately
    if (isValid) {
      console.debug(`[UUID Debug] Validating UUID: "${idStr}" => VALID`);
      return true;
    }
    
    // If not valid but could be formatted to be valid, we'll also consider it valid
    // for lenient validation purposes
    const formattedId = formatAsUUID(idStr);
    if (formattedId !== idStr && UUID_REGEX.test(formattedId)) {
      console.debug(`[UUID Debug] UUID is valid after formatting: "${idStr}" => "${formattedId}" => VALID`);
      return true;
    }
    
    console.debug(`[UUID Debug] Validating UUID: "${idStr}" => INVALID`);
    return false;
  } catch (error) {
    console.error('[UUID Debug] Error validating UUID:', idStr, error);
    return false;
  }
}

/**
 * Validates a UUID and returns it if valid, throws an error if invalid
 * Now with better formatting recovery and type handling
 * 
 * @param id - The string to validate as a UUID
 * @param entityName - Optional name of the entity for better error messages (e.g., 'Clinician', 'Appointment')
 * @returns string - The validated UUID, properly formatted if needed
 * @throws UUIDValidationError if the ID is not a valid UUID
 */
export function ensureUUID(id: string | null | undefined, entityName?: string): string {
  if (!id) {
    const message = entityName 
      ? `${entityName} ID is required` 
      : 'ID is required';
    
    console.error(`[UUID Debug] ensureUUID failed: ${message}`);
    throw new UUIDValidationError(message, { id });
  }
  
  // Convert to string and trim
  const idStr = String(id).trim();
  
  try {
    console.debug(`[UUID Debug] Ensuring UUID (${entityName || 'unknown entity'}): "${idStr}"`);
    
    // First check if it's already a valid UUID
    if (UUID_REGEX.test(idStr)) {
      console.debug(`[UUID Debug] UUID validation successful: "${idStr}"`);
      return idStr;
    }
    
    // Try to format it as a UUID
    const formattedId = formatAsUUID(idStr);
    if (formattedId !== idStr && UUID_REGEX.test(formattedId)) {
      console.warn(`[UUID Debug] UUID was invalid but formatted successfully: "${idStr}" → "${formattedId}"`);
      return formattedId;
    }
    
    // If we get here, it's not a valid UUID even after formatting
    const message = entityName 
      ? `Invalid ${entityName} ID format: ${idStr}` 
      : `Invalid UUID format: ${idStr}`;
    
    console.error(`[UUID Debug] ensureUUID failed: ${message}`);
    throw new UUIDValidationError(message, { id: idStr, formattedAttempt: formattedId });
  } catch (error) {
    if (error instanceof UUIDValidationError) {
      throw error;
    }
    
    console.error('[UUID Debug] Unexpected error in ensureUUID:', error);
    throw new UUIDValidationError(
      `Error validating UUID: ${(error as Error).message}`,
      { id: idStr, originalError: error }
    );
  }
}

/**
 * Attempts to format a string as a UUID if possible
 * Enhanced version with better handling of different input types and formats
 * 
 * @param id - The string to format as a UUID
 * @returns string - The formatted UUID if possible, or the original string if not
 */
export function formatAsUUID(id: string | null | undefined): string {
  if (!id) {
    console.debug('[UUID Debug] Empty ID provided for formatting');
    return '';
  }
  
  // Convert to string and trim
  const idStr = String(id).trim();
  
  try {
    console.debug(`[UUID Debug] Attempting to format as UUID: "${idStr}"`);
    
    // If it's already a valid UUID, return it
    if (UUID_REGEX.test(idStr)) {
      console.debug(`[UUID Debug] ID is already a valid UUID: "${idStr}"`);
      return idStr;
    }
    
    // Handle common UUID formats with different separators or no separators
    
    // 1. Remove all non-alphanumeric characters
    const cleanId = idStr.replace(/[^a-f0-9]/gi, '').toLowerCase();
    console.debug(`[UUID Debug] Cleaned ID: "${cleanId}" (length: ${cleanId.length})`);
    
    // 2. Check if we have exactly 32 hex characters
    if (cleanId.length === 32) {
      // Insert hyphens in the correct positions
      const formattedUUID = 
        cleanId.substring(0, 8) + '-' + 
        cleanId.substring(8, 12) + '-' + 
        cleanId.substring(12, 16) + '-' + 
        cleanId.substring(16, 20) + '-' + 
        cleanId.substring(20);
      
      // Verify the formatted string is a valid UUID
      if (UUID_REGEX.test(formattedUUID)) {
        console.info(`[UUID Debug] Successfully formatted ID: "${idStr}" → "${formattedUUID}"`);
        return formattedUUID;
      } else {
        console.warn(`[UUID Debug] Formatting attempt failed validation: "${formattedUUID}"`);
      }
    } else {
      console.warn(`[UUID Debug] ID has incorrect length after cleaning: ${cleanId.length} (expected 32)`);
    }
    
    // Handle potential edge cases
    if (idStr.includes('-')) {
      const parts = idStr.split('-');
      if (parts.length === 5 && 
          parts[0].length <= 8 && 
          parts[1].length <= 4 && 
          parts[2].length <= 4 && 
          parts[3].length <= 4 && 
          parts[4].length <= 12) {
        console.warn(`[UUID Debug] ID appears to be UUID-like but invalid: "${idStr}"`);
        
        // Try to pad parts if they're too short
        const paddedParts = [
          parts[0].padStart(8, '0'),
          parts[1].padStart(4, '0'),
          parts[2].padStart(4, '0'),
          parts[3].padStart(4, '0'),
          parts[4].padStart(12, '0')
        ];
        
        const paddedId = paddedParts.join('-');
        if (UUID_REGEX.test(paddedId)) {
          console.info(`[UUID Debug] Successfully padded UUID: "${idStr}" → "${paddedId}"`);
          return paddedId;
        }
      }
    }
    
    // If we couldn't format it as a UUID, return the original
    console.debug(`[UUID Debug] Unable to format as UUID, returning original: "${idStr}"`);
    return idStr;
  } catch (error) {
    console.error('[UUID Debug] Error formatting UUID:', error);
    return idStr;
  }
}

/**
 * Check if a string could potentially be a UUID even if not in standard format
 * 
 * @param id - The string to check
 * @returns boolean - True if the string could be formatted as a valid UUID
 */
export function couldBeUUID(id: string | null | undefined): boolean {
  if (!id) return false;
  
  const idStr = String(id).trim();
  const cleanId = idStr.replace(/[^a-f0-9]/gi, '').toLowerCase();
  
  // If we have 32 hex characters, it could be formatted as a UUID
  return cleanId.length === 32;
}

/**
 * Utility module for UUID validation
 */
export const UUIDUtils = {
  isValidUUID,
  ensureUUID,
  formatAsUUID,
  couldBeUUID
};

// Default export for convenience
export default UUIDUtils;
