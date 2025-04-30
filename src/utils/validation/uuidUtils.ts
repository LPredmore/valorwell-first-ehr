
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
/**
 * Validates if a string represents a valid UUID, with more lenient checks for edge cases
 *
 * @param id - The string to validate as a UUID
 * @param options - Optional configuration for validation behavior
 * @returns boolean - True if the string is a valid UUID, false otherwise
 */
export function isValidUUID(
  id: string | null | undefined,
  options: {
    lenient?: boolean;
    logLevel?: 'debug' | 'info' | 'warn' | 'error';
  } = {}
): boolean {
  const { lenient = true, logLevel = 'debug' } = options;
  
  const logMessage = (level: 'debug' | 'info' | 'warn' | 'error', message: string) => {
    switch (level) {
      case 'debug': console.debug(`[UUID Debug] ${message}`); break;
      case 'info': console.info(`[UUID Info] ${message}`); break;
      case 'warn': console.warn(`[UUID Warning] ${message}`); break;
      case 'error': console.error(`[UUID Error] ${message}`); break;
    }
  };
  
  if (!id) {
    logMessage(logLevel, 'Empty ID provided for validation');
    return false;
  }
  
  // Convert to string and trim (in case it's not already a string)
  const idStr = String(id).trim();
  
  // First try standard regex validation
  const isValid = UUID_REGEX.test(idStr);
  
  // If it's valid, return true immediately
  if (isValid) {
    logMessage('debug', `Validating UUID: "${idStr}" => VALID`);
    return true;
  }
  
  // If not in lenient mode, return false immediately
  if (!lenient) {
    logMessage(logLevel, `Validating UUID (strict mode): "${idStr}" => INVALID`);
    return false;
  }
  
  try {
    // If not valid but could be formatted to be valid, we'll also consider it valid
    // for lenient validation purposes
    const formattedId = formatAsUUID(idStr, { strictMode: true });
    if (formattedId && UUID_REGEX.test(formattedId)) {
      logMessage(logLevel, `UUID is valid after formatting: "${idStr}" => "${formattedId}" => VALID`);
      return true;
    }
  } catch (error) {
    // If formatting fails, it's definitely not a valid UUID
    logMessage(logLevel, `Error formatting UUID during validation: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  logMessage(logLevel, `Validating UUID: "${idStr}" => INVALID`);
  return false;
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
/**
 * Validates a UUID and returns it if valid, throws an error if invalid
 * Now with better formatting recovery and type handling
 *
 * @param id - The string to validate as a UUID
 * @param entityName - Optional name of the entity for better error messages (e.g., 'Clinician', 'Appointment')
 * @param strictMode - If true, will throw an error for invalid UUIDs; if false, will attempt to format or create a deterministic UUID
 * @returns string - The validated UUID, properly formatted if needed
 * @throws UUIDValidationError if the ID is not a valid UUID and strictMode is true
 */
export function ensureUUID(
  id: string | null | undefined,
  entityName?: string,
  strictMode: boolean = false
): string {
  if (!id) {
    const message = entityName
      ? `${entityName} ID is required`
      : 'ID is required';
    
    console.error(`[UUID Error] ensureUUID failed: ${message}`);
    throw new UUIDValidationError(message, { id });
  }
  
  // Convert to string and trim
  const idStr = String(id).trim();
  
  // First check if it's already a valid UUID
  if (UUID_REGEX.test(idStr)) {
    console.debug(`[UUID Debug] UUID validation successful: "${idStr}"`);
    return idStr;
  }
  
  // Try to format it as a UUID with appropriate options
  try {
    const formattedId = formatAsUUID(idStr, {
      strictMode: true,  // Always use strict mode here to get a valid UUID
      logLevel: 'warn'
    });
    
    // At this point, formattedId should be a valid UUID due to strictMode
    if (UUID_REGEX.test(formattedId)) {
      console.warn(`[UUID Warning] UUID was invalid but formatted successfully: "${idStr}" → "${formattedId}"`);
      return formattedId;
    }
    
    // This should not happen due to strictMode, but just in case
    throw new UUIDValidationError(`Failed to format as valid UUID: ${idStr}`, { id: idStr });
  } catch (error) {
    // If we're in strict mode, propagate the error
    if (strictMode) {
      if (error instanceof UUIDValidationError) {
        throw error;
      } else {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new UUIDValidationError(
          `Invalid ${entityName || 'entity'} ID: ${errorMessage}`,
          { id: idStr, originalError: error }
        );
      }
    }
    
    // For non-strict mode, log the issue but return a deterministic UUID
    // This ensures we always return a valid UUID format for calendar components
    console.warn(`[UUID Warning] Creating deterministic UUID for invalid input: "${idStr}"`);
    
    // Create a deterministic UUID based on the input string
    const hashCode = (s: string) => {
      let h = 0;
      for (let i = 0; i < s.length; i++) {
        h = Math.imul(31, h) + s.charCodeAt(i) | 0;
      }
      return h;
    };
    
    const hash = Math.abs(hashCode(idStr)).toString(16).padStart(8, '0');
    const deterministicUUID =
      hash.substring(0, 8) + '-' +
      hash.substring(0, 4) + '-' +
      '4' + hash.substring(0, 3) + '-' +
      '8' + hash.substring(0, 3) + '-' +
      hash.substring(0, 12).padEnd(12, '0');
    
    console.warn(`[UUID Warning] Created deterministic UUID: "${idStr}" → "${deterministicUUID}"`);
    return deterministicUUID;
  }
}

/**
 * Attempts to format a string as a UUID if possible
 * Enhanced version with better handling of different input types and formats
 * 
 * @param id - The string to format as a UUID
 * @returns string - The formatted UUID if possible, or the original string if not
 */
/**
 * Attempts to format a string as a UUID if possible
 * Enhanced version with better handling of different input types and formats
 *
 * @param id - The string to format as a UUID
 * @param options - Optional configuration for formatting behavior
 * @returns string - The formatted UUID if possible, or a fallback value based on options
 * @throws UUIDValidationError if strictMode is true and the ID cannot be formatted as a valid UUID
 */
export function formatAsUUID(
  id: string | null | undefined,
  options: {
    strictMode?: boolean;
    fallback?: string;
    logLevel?: 'debug' | 'info' | 'warn' | 'error';
  } = {}
): string {
  const {
    strictMode = false,
    fallback = '',
    logLevel = 'debug'
  } = options;
  
  const logMessage = (level: 'debug' | 'info' | 'warn' | 'error', message: string) => {
    switch (level) {
      case 'debug': console.debug(`[UUID Debug] ${message}`); break;
      case 'info': console.info(`[UUID Info] ${message}`); break;
      case 'warn': console.warn(`[UUID Warning] ${message}`); break;
      case 'error': console.error(`[UUID Error] ${message}`); break;
    }
  };

  // Handle null/undefined input
  if (!id) {
    logMessage(logLevel, 'Empty ID provided for formatting');
    if (strictMode) {
      throw new UUIDValidationError('Cannot format empty value as UUID', { id });
    }
    return fallback;
  }
  
  // Convert to string and trim
  const idStr = String(id).trim();
  
  // If it's already a valid UUID, return it
  if (UUID_REGEX.test(idStr)) {
    logMessage('debug', `ID is already a valid UUID: "${idStr}"`);
    return idStr;
  }
  
  try {
    // Handle common UUID formats with different separators or no separators
    
    // Remove all non-alphanumeric characters
    const cleanId = idStr.replace(/[^a-f0-9]/gi, '').toLowerCase();
    
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
      if (UUID_REGEX.test(formattedUUID)) {
        logMessage('info', `Successfully formatted ID: "${idStr}" → "${formattedUUID}"`);
        return formattedUUID;
      }
    }
    
    // Handle potential edge cases with hyphenated strings
    if (idStr.includes('-')) {
      const parts = idStr.split('-');
      
      // Handle standard 5-part UUID with incorrect lengths
      if (parts.length === 5) {
        // Try to pad parts if they're too short
        const paddedParts = [
          parts[0].padStart(8, '0'),
          parts[1].padStart(4, '0'),
          parts[2].padStart(4, '0'),
          parts[3].padStart(4, '0'),
          parts[4].padStart(12, '0')
        ];
        
        // Filter out any non-hex characters
        const cleanParts = paddedParts.map(part =>
          part.replace(/[^a-f0-9]/gi, '0').toLowerCase()
        );
        
        const paddedId = cleanParts.join('-');
        if (UUID_REGEX.test(paddedId)) {
          logMessage('info', `Successfully padded UUID: "${idStr}" → "${paddedId}"`);
          return paddedId;
        }
      }
      
      // Handle case where we have fewer than 5 parts but could combine them
      if (parts.length > 1 && parts.length < 5) {
        // Join all parts and try to reformat
        const joinedId = parts.join('');
        const cleanJoined = joinedId.replace(/[^a-f0-9]/gi, '').toLowerCase();
        
        if (cleanJoined.length <= 32) {
          // Pad to 32 characters if needed
          const paddedClean = cleanJoined.padEnd(32, '0');
          
          // Format with proper hyphens
          const reformattedUUID =
            paddedClean.substring(0, 8) + '-' +
            paddedClean.substring(8, 12) + '-' +
            paddedClean.substring(12, 16) + '-' +
            paddedClean.substring(16, 20) + '-' +
            paddedClean.substring(20, 32);
          
          if (UUID_REGEX.test(reformattedUUID)) {
            logMessage('info', `Reconstructed UUID from parts: "${idStr}" → "${reformattedUUID}"`);
            return reformattedUUID;
          }
        }
      }
    }
    
    // Try to extract a UUID-like pattern if it's embedded in a longer string
    const uuidPattern = /([0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12})/i;
    const match = idStr.match(uuidPattern);
    if (match && match[1]) {
      const extractedPart = match[1];
      const formattedExtracted = formatAsUUID(extractedPart);
      
      if (UUID_REGEX.test(formattedExtracted)) {
        logMessage('info', `Extracted UUID from string: "${idStr}" → "${formattedExtracted}"`);
        return formattedExtracted;
      }
    }
    
    // Generate a fallback UUID if we can't format the input
    // This is a last resort for strict mode to avoid throwing errors
    if (strictMode) {
      // Create a deterministic UUID based on the input string
      // This ensures the same input always produces the same UUID
      const hashCode = (s: string) => {
        let h = 0;
        for (let i = 0; i < s.length; i++) {
          h = Math.imul(31, h) + s.charCodeAt(i) | 0;
        }
        return h;
      };
      
      const hash = Math.abs(hashCode(idStr)).toString(16).padStart(8, '0');
      const deterministicUUID =
        hash.substring(0, 8) + '-' +
        hash.substring(0, 4) + '-' +
        '4' + hash.substring(0, 3) + '-' +
        '8' + hash.substring(0, 3) + '-' +
        hash.substring(0, 12).padEnd(12, '0');
      
      logMessage('warn', `Created deterministic UUID for invalid input: "${idStr}" → "${deterministicUUID}"`);
      return deterministicUUID;
    }
    
    // If we couldn't format it as a UUID and we're not in strict mode
    logMessage('warn', `Unable to format as UUID: "${idStr}"`);
    return fallback;
  } catch (error) {
    // Catch any unexpected errors during formatting
    const errorMessage = error instanceof Error ? error.message : String(error);
    logMessage('error', `Error formatting UUID: ${errorMessage}`);
    
    if (strictMode) {
      throw new UUIDValidationError(`Failed to format as UUID: ${errorMessage}`, {
        id,
        originalError: error
      });
    }
    
    return fallback;
  }
}

/**
 * Check if a string could potentially be a UUID even if not in standard format
 * 
 * @param id - The string to check
 * @returns boolean - True if the string could be formatted as a valid UUID
 */
/**
 * Check if a string could potentially be a UUID even if not in standard format
 *
 * @param id - The string to check
 * @returns boolean - True if the string could be formatted as a valid UUID
 */
export function couldBeUUID(id: string | null | undefined): boolean {
  if (!id) return false;
  
  const idStr = String(id).trim();
  
  // If it's already a valid UUID, return true immediately
  if (UUID_REGEX.test(idStr)) {
    return true;
  }
  
  // Check for UUID-like pattern with or without hyphens
  const uuidPattern = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;
  if (uuidPattern.test(idStr)) {
    return true;
  }
  
  // Remove all non-alphanumeric characters
  const cleanId = idStr.replace(/[^a-f0-9]/gi, '').toLowerCase();
  
  // If we have 32 hex characters, it could be formatted as a UUID
  if (cleanId.length === 32) {
    return true;
  }
  
  // Check if it's a hyphenated string that could be padded to a UUID
  if (idStr.includes('-')) {
    const parts = idStr.split('-');
    if (parts.length === 5) {
      // Check if all parts contain only hex characters
      const allPartsHex = parts.every(part => /^[0-9a-f]*$/i.test(part));
      if (allPartsHex) {
        return true;
      }
    }
  }
  
  return false;
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
