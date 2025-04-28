
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
    // First check if it's already a valid format
    if (isValidUUID(id)) {
      return id;
    }
    
    // Try to format as UUID
    const formatted = formatAsUUID(id);
    if (isValidUUID(formatted)) {
      console.log(`[Clinician Validation] Reformatted ID: ${id} → ${formatted}`);
      return formatted;
    }
    
    // If we can't format it, try to ensure it's a UUID
    try {
      return ensureUUID(id, 'Clinician');
    } catch (uuidError) {
      // If that also fails, throw an error with more context
      throw new ClinicianIDValidationError(`Invalid clinician ID format: ${id}`, {
        originalId: id,
        cause: uuidError instanceof Error ? uuidError : undefined
      });
    }
  } catch (error) {
    if (error instanceof ClinicianIDValidationError) {
      throw error;
    } else if (error instanceof UUIDValidationError) {
      // Convert UUID validation error to a clinician-specific error
      throw new ClinicianIDValidationError(error.message, {
        cause: error,
        context: { originalError: error }
      });
    }
    
    console.error('[Clinician Validation] Error processing clinician ID:', error);
    throw new ClinicianIDValidationError(
      `Error validating clinician ID: ${(error instanceof Error) ? error.message : String(error)}`,
      {
        cause: error instanceof Error ? error : undefined,
        context: { originalId: id }
      }
    );
  }
}

/**
 * Normalizes clinician ID for comparison
 * 
 * @param id - The clinician ID to normalize
 * @returns string - The normalized clinician ID
 */
export function normalizeClinicianID(id: string): string {
  if (!id) return '';
  return id.toLowerCase().replace(/-/g, '');
}

/**
 * Checks if two clinician IDs match, even if they have different formats
 * 
 * @param id1 - First clinician ID 
 * @param id2 - Second clinician ID
 * @returns boolean - True if the IDs match after normalization
 */
export function clinicianIDsMatch(id1: string, id2: string): boolean {
  if (!id1 || !id2) return false;
  return normalizeClinicianID(id1) === normalizeClinicianID(id2);
}

export async function verifyClinicianExists(clinicianId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('clinicians')
      .select('id')
      .eq('id', clinicianId)
      .single();
      
    return !error && !!data;
  } catch (error) {
    console.error('[Clinician Validation] Error verifying clinician exists:', error);
    return false;
  }
}
