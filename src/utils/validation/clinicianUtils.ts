
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
export function formatAsClinicianID(id: string | null | undefined): string {
  if (!id) return '';
  
  try {
    // Trim whitespace and handle non-string inputs
    const cleanId = String(id).trim();
    
    // If it's already a valid UUID, return it
    if (isValidUUID(cleanId)) {
      return cleanId;
    }
    
    // Try to format as UUID
    const formattedId = formatAsUUID(cleanId);
    
    // If formatting succeeded and produced a valid UUID, return it
    if (isValidUUID(formattedId)) {
      console.info(`[Clinician Validation] Successfully formatted clinician ID: ${id} → ${formattedId}`);
      return formattedId;
    }
    
    // If we couldn't format it as a UUID, log a warning and return the original
    console.warn(`[Clinician Validation] Could not format as valid clinician ID: ${id}`);
    return cleanId;
  } catch (error) {
    console.error('[Clinician Validation] Error formatting clinician ID:', error);
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
      console.warn('[Clinician Validation] Empty clinician ID provided');
      return false;
    }
    
    // Try to format the ID if it's not already a valid UUID
    const cleanId = isValidClinicianID(id) ? id : formatAsClinicianID(id);
    
    // If we still don't have a valid UUID, return false
    if (!isValidClinicianID(cleanId)) {
      console.warn('[Clinician Validation] Invalid clinician ID format:', id);
      return false;
    }
    
    // Check if the clinician ID exists in the profiles table
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', cleanId)
      .single();
      
    if (error || !data) {
      console.warn('[Clinician Validation] Clinician ID not found in database:', cleanId);
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
export async function validateClinicianID(id: string | null | undefined): Promise<string> {
  // Handle null/undefined/empty values
  if (!id) {
    throw new ClinicianIDValidationError('Clinician ID is required');
  }
  
  try {
    // Try to format the ID if it's not already a valid 
    const formattedId = formatAsClinicianID(id);
    
    // Check if it's a valid UUID
    if (!isValidClinicianID(formattedId)) {
      throw new ClinicianIDValidationError(`Invalid clinician ID format: ${id}`);
    }
    
    // Check if it exists in the database
    const exists = await clinicianIDExists(formattedId);
    if (!exists) {
      throw new ClinicianIDValidationError(`Clinician ID does not exist: ${formattedId}`);
    }
    
    return formattedId;
  } catch (error) {
    if (error instanceof ClinicianIDValidationError) {
      throw error;
    }
    
    console.error('[Clinician Validation] Error validating clinician ID:', error);
    throw new ClinicianIDValidationError(
      `Error validating clinician ID: ${(error as Error).message}`,
      {
        cause: error instanceof Error ? error : undefined,
        context: { originalError: error }
      }
    );
  }
}
