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
  if (!id) return false;
  
  try {
    return isValidUUID(id);
  } catch (error) {
    console.error('[Clinician Validation] Error validating clinician ID:', error);
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
    throw new ClinicianIDValidationError('Clinician ID is required');
  }
  
  try {
    // First ensure it's a valid UUID
    const validUUID = ensureUUID(id, 'Clinician');
    return validUUID;
  } catch (error) {
    if (error instanceof UUIDValidationError) {
      // Convert UUID validation error to a clinician-specific error
      throw new ClinicianIDValidationError(error.message, {
        cause: error,
        context: { originalError: error }
      });
    }
    
    console.error('[Clinician Validation] Error processing clinician ID:', error);
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
 * Attempts to format a string as a clinician ID if possible
 * 
 * @param id - The string to format as a clinician ID
 * @returns string - The formatted clinician ID if possible, or the original string if not
 */
export function formatAsClinicianID(id: string): string {
  if (!id) return id;
  
  try {
    return formatAsUUID(id);
  } catch (error) {
    console.error('[Clinician Validation] Error formatting clinician ID:', error);
    return id;
  }
}

/**
 * Validates that a clinician ID exists in the database
 * 
 * @param id - The clinician ID to validate
 * @returns Promise<boolean> - True if the clinician ID exists, false otherwise
 */
export async function clinicianIDExists(id: string): Promise<boolean> {
  try {
    // First ensure it's a valid UUID format
    if (!isValidClinicianID(id)) {
      return false;
    }
    
    // Check if the clinician ID exists in the profiles table
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', id)
      .single();
      
    if (error || !data) {
      console.warn('[Clinician Validation] Clinician ID not found in database:', id);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('[Clinician Validation] Error checking if clinician ID exists:', error);
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
export async function validateClinicianID(id: string): Promise<string> {
  // First ensure it's a valid UUID
  const validID = ensureClinicianID(id);
  
  // Then check if it exists in the database
  const exists = await clinicianIDExists(validID);
  if (!exists) {
    throw new ClinicianIDValidationError(`Clinician ID ${validID} does not exist in the database`);
  }
  
  return validID;
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