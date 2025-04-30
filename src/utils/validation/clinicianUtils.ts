
import { UUIDValidationError, isValidUUID, ensureUUID, formatAsUUID } from './uuidUtils';
import { ValidationError } from '@/utils/errors';
import { supabase } from '@/integrations/supabase/client';

/**
 * Clinician ID validation error class
 */
export class ClinicianIDValidationError extends ValidationError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, {
      field: 'clinician_id',
      userMessage: message,
      ...context
    });
    this.name = 'ClinicianIDValidationError';
  }
}

/**
 * Checks if a string is a valid clinician ID
 * 
 * @param id - The string to validate as a clinician ID
 * @returns boolean - True if the string is a valid clinician ID, false otherwise
 */
export function isValidClinicianID(id: string): boolean {
  if (!id) {
    console.debug('[Clinician Debug] Empty clinician ID provided for validation');
    return false;
  }
  
  try {
    const isValid = isValidUUID(id);
    console.debug(`[Clinician Debug] Clinician ID validation: "${id}" => ${isValid ? 'VALID' : 'INVALID'}`);
    return isValid;
  } catch (error) {
    console.error('[Clinician Debug] Error validating clinician ID:', id, error);
    return false;
  }
}

/**
 * Validates a clinician ID and returns it if valid, throws an error if invalid
 * 
 * @param id - The string to validate as a clinician ID
 * @returns string - The validated clinician ID
 * @throws ClinicianIDValidationError if the ID is not a valid clinician ID
 */
export function ensureClinicianID(id: string): string {
  if (!id) {
    console.error('[Clinician Debug] ensureClinicianID failed: ID is required');
    throw new ClinicianIDValidationError('Clinician ID is required');
  }
  
  try {
    console.debug(`[Clinician Debug] Ensuring clinician ID: "${id}"`);
    // First ensure it's a valid UUID
    try {
      const validUUID = ensureUUID(id, 'Clinician');
      console.debug(`[Clinician Debug] UUID validation passed: "${validUUID}"`);
      return validUUID;
    } catch (error) {
      // Try to format the ID before failing completely
      console.warn(`[Clinician Debug] Initial validation failed for "${id}", attempting formatting`);
      const formattedId = formatAsUUID(id);
      
      if (formattedId !== id && isValidUUID(formattedId)) {
        console.info(`[Clinician Debug] Recovered invalid clinician ID through formatting: "${id}" → "${formattedId}"`);
        return formattedId;
      }
      
      // If we reach here, the error was not recoverable
      if (error instanceof UUIDValidationError) {
        console.error(`[Clinician Debug] UUID validation error: ${error.message}`);
        // Convert UUID validation error to a clinician-specific error
        throw new ClinicianIDValidationError(error.message, {
          cause: error,
          context: { originalError: error, originalId: id }
        });
      }
      
      throw error;
    }
  } catch (error) {
    if (error instanceof ClinicianIDValidationError) {
      throw error;
    }
    
    console.error('[Clinician Debug] Error processing clinician ID:', id, error);
    throw new ClinicianIDValidationError(
      `Error validating clinician ID: ${(error as Error).message}`,
      {
        cause: error instanceof Error ? error : undefined,
        context: { originalId: id, originalError: error }
      }
    );
  }
}

/**
 * Attempts to format a string as a clinician ID if possible
 * 
 * @param id - The string to format as a clinician ID
 * @returns string - The formatted clinician ID if possible, or the original string if not
 */
export function formatAsClinicianID(id: string | null | undefined): string {
  if (!id) {
    console.debug('[Clinician Debug] Empty clinician ID provided for formatting');
    return '';
  }
  
  try {
    // Trim whitespace and handle non-string inputs
    const cleanId = String(id).trim();
    console.debug(`[Clinician Debug] Formatting clinician ID: "${id}" → "${cleanId}" (after trimming)`);
    
    // If it's already a valid UUID, return it
    if (isValidUUID(cleanId)) {
      console.debug(`[Clinician Debug] ID is already a valid UUID: "${cleanId}"`);
      return cleanId;
    }
    
    // Try to format as UUID
    const formattedId = formatAsUUID(cleanId);
    console.debug(`[Clinician Debug] After UUID formatting: "${cleanId}" → "${formattedId}"`);
    
    // If formatting succeeded and produced a valid UUID, return it
    if (isValidUUID(formattedId)) {
      console.info(`[Clinician Debug] Successfully formatted clinician ID: "${id}" → "${formattedId}"`);
      return formattedId;
    }
    
    // If we couldn't format it as a UUID, log a warning and return the original
    console.warn(`[Clinician Debug] Could not format as valid clinician ID: "${id}"`);
    return cleanId;
  } catch (error) {
    console.error('[Clinician Debug] Error formatting clinician ID:', id, error);
    return String(id).trim();
  }
}

/**
 * Validates that a clinician ID exists in the database
 * 
 * @param id - The clinician ID to validate
 * @returns Promise<boolean> - True if the clinician ID exists, false otherwise
 */
export async function clinicianIDExists(id: string | null | undefined): Promise<boolean> {
  try {
    // Handle null/undefined/empty values
    if (!id) {
      console.warn('[Clinician Debug] Empty clinician ID provided for existence check');
      return false;
    }
    
    console.debug(`[Clinician Debug] Checking if clinician ID exists: "${id}"`);
    
    // Try to format the ID if it's not already a valid UUID
    const cleanId = isValidClinicianID(id) ? id : formatAsClinicianID(id);
    console.debug(`[Clinician Debug] Using ID for database check: "${cleanId}"`);
    
    // If we still don't have a valid UUID, return false
    if (!isValidClinicianID(cleanId)) {
      console.warn(`[Clinician Debug] Invalid clinician ID format for DB check: "${id}"`);
      return false;
    }
    
    // Check if the clinician ID exists in the profiles table
    console.debug(`[Clinician Debug] Querying database for clinician ID: "${cleanId}"`);
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', cleanId)
      .single();
      
    if (error || !data) {
      console.warn(`[Clinician Debug] Clinician ID not found in database: "${cleanId}"`);
      return false;
    }
    
    console.debug(`[Clinician Debug] Clinician ID found in database: "${cleanId}"`);
    return true;
  } catch (error) {
    console.error('[Clinician Debug] Error checking if clinician ID exists:', id, error);
    return false;
  }
}

/**
 * Validates a clinician ID and checks that it exists in the database
 * 
 * @param id - The clinician ID to validate
 * @returns Promise<string> - The validated clinician ID
 * @throws ClinicianIDValidationError if the ID is not valid or doesn't exist
 */
export async function validateClinicianID(id: string | null | undefined): Promise<string> {
  console.debug(`[Clinician Debug] Starting full clinician ID validation: "${id}"`);
  
  // Handle null/undefined/empty values
  if (!id) {
    console.error('[Clinician Debug] validateClinicianID failed: ID is required');
    throw new ClinicianIDValidationError('Clinician ID is required');
  }
  
  try {
    // Try to format the ID if it's not already a valid UUID
    const formattedId = formatAsClinicianID(id);
    console.debug(`[Clinician Debug] Formatted clinician ID: "${id}" → "${formattedId}"`);
    
    // Check if it's a valid UUID
    if (!isValidClinicianID(formattedId)) {
      console.error(`[Clinician Debug] Invalid clinician ID format: "${id}" (formatted: "${formattedId}")`);
      throw new ClinicianIDValidationError(`Invalid clinician ID format: ${id}`);
    }
    
    // Check if it exists in the database
    console.debug(`[Clinician Debug] Checking database for clinician ID: "${formattedId}"`);
    const exists = await clinicianIDExists(formattedId);
    if (!exists) {
      console.error(`[Clinician Debug] Clinician ID not found in database: "${formattedId}"`);
      throw new ClinicianIDValidationError(`Clinician ID does not exist: ${formattedId}`);
    }
    
    console.debug(`[Clinician Debug] Clinician ID validation successful: "${formattedId}"`);
    return formattedId;
  } catch (error) {
    if (error instanceof ClinicianIDValidationError) {
      throw error;
    }
    
    console.error('[Clinician Debug] Error validating clinician ID:', id, error);
    throw new ClinicianIDValidationError(
      `Error validating clinician ID: ${(error as Error).message}`,
      {
        cause: error instanceof Error ? error : undefined,
        context: { originalError: error }
      }
    );
  }
}

/**
 * Utility module for clinician ID validation
 */
export const ClinicianIDUtils = {
  isValidClinicianID,
  ensureClinicianID,
  formatAsClinicianID,
  clinicianIDExists,
  validateClinicianID
};

// Default export for convenience
export default ClinicianIDUtils;
