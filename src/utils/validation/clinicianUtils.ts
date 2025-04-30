
import { UUIDValidationError, isValidUUID, ensureUUID, formatAsUUID, couldBeUUID } from './uuidUtils';
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
 * Enhanced with extra checks for common issues
 * 
 * @param id - The string to validate as a clinician ID
 * @returns boolean - True if the string is a valid clinician ID, false otherwise
 */
export function isValidClinicianID(id: string | null | undefined): boolean {
  if (!id) {
    console.debug('[Clinician Debug] Empty clinician ID provided for validation');
    return false;
  }
  
  // Convert to string and trim
  const idStr = String(id).trim();
  
  try {
    // First try standard UUID validation
    const isValidStandard = isValidUUID(idStr);
    if (isValidStandard) {
      console.debug(`[Clinician Debug] Clinician ID validation (standard): "${idStr}" => VALID`);
      return true;
    }
    
    // If not valid as standard UUID, check if it could be a UUID with formatting
    if (couldBeUUID(idStr)) {
      const formattedId = formatAsUUID(idStr, { logLevel: 'debug' });
      if (isValidUUID(formattedId)) {
        console.debug(`[Clinician Debug] Clinician ID validation (after formatting): "${idStr}" => "${formattedId}" => VALID`);
        return true;
      }
    }
    
    console.debug(`[Clinician Debug] Clinician ID validation: "${idStr}" => INVALID`);
    return false;
  } catch (error) {
    console.error('[Clinician Debug] Error validating clinician ID:', idStr, error);
    return false;
  }
}

/**
 * Validates a clinician ID and returns it if valid, throws an error if invalid
 * Enhanced with better formatting and recovery
 * 
 * @param id - The string to validate as a clinician ID
 * @returns string - The validated clinician ID
 * @throws ClinicianIDValidationError if the ID is not a valid clinician ID
 */
export function ensureClinicianID(id: string | null | undefined): string {
  if (!id) {
    console.error('[Clinician Debug] ensureClinicianID failed: ID is required');
    throw new ClinicianIDValidationError('Clinician ID is required');
  }
  
  // Convert to string and trim
  const idStr = String(id).trim();
  
  try {
    console.debug(`[Clinician Debug] Ensuring clinician ID: "${idStr}"`);
    
    // First try standard UUID validation
    if (isValidUUID(idStr)) {
      console.debug(`[Clinician Debug] UUID validation passed: "${idStr}"`);
      return idStr;
    }
    
    // If not valid, try to format it
    const formattedId = formatAsUUID(idStr, {
      strictMode: true,
      logLevel: 'info'
    });
    if (formattedId && formattedId !== idStr && isValidUUID(formattedId)) {
      console.info(`[Clinician Debug] Recovered invalid clinician ID through formatting: "${idStr}" → "${formattedId}"`);
      return formattedId;
    }
    
    // If we reach here, the ID is not valid even after formatting
    console.error(`[Clinician Debug] Unable to ensure valid clinician ID from: "${idStr}"`);
    throw new ClinicianIDValidationError(`Invalid clinician ID format: ${idStr}`);
  } catch (error) {
    if (error instanceof ClinicianIDValidationError) {
      throw error;
    }
    
    console.error('[Clinician Debug] Error processing clinician ID:', idStr, error);
    throw new ClinicianIDValidationError(
      `Error validating clinician ID: ${(error as Error).message}`,
      {
        cause: error instanceof Error ? error : undefined,
        context: { originalId: idStr, originalError: error }
      }
    );
  }
}

/**
 * Attempts to format a string as a clinician ID if possible
 * Enhanced with better type handling and formatting
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
    const formattedId = formatAsUUID(cleanId, {
      strictMode: true,
      logLevel: 'debug'
    });
    console.debug(`[Clinician Debug] After UUID formatting: "${cleanId}" → "${formattedId}"`);
    
    // If formatting succeeded and produced a valid UUID, return it
    if (formattedId && formattedId !== cleanId && isValidUUID(formattedId)) {
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
 * Enhanced with better error handling and logging
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
    
    const idStr = String(id).trim();
    console.debug(`[Clinician Debug] Checking if clinician ID exists: "${idStr}"`);
    
    // Try to format the ID if it's not already a valid UUID
    let cleanId = idStr;
    if (!isValidClinicianID(idStr)) {
      cleanId = formatAsClinicianID(idStr);
      console.debug(`[Clinician Debug] Using formatted ID for database check: "${idStr}" → "${cleanId}"`);
    }
    
    // If we still don't have a valid UUID, check both tables with the original ID as fallback
    if (!isValidClinicianID(cleanId)) {
      console.warn(`[Clinician Debug] Invalid clinician ID format for DB check, will try with original: "${idStr}"`);
      
      // First check profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, role')
        .or(`id.eq.${idStr},id.eq.${cleanId}`)
        .eq('role', 'clinician')
        .maybeSingle();
      
      if (profileData) {
        console.debug(`[Clinician Debug] Clinician ID found in profiles table: "${profileData.id}"`);
        return true;
      }
      
      // Then check clinicians table as fallback
      const { data: clinicianData, error: clinicianError } = await supabase
        .from('clinicians')
        .select('id')
        .or(`id.eq.${idStr},id.eq.${cleanId}`)
        .maybeSingle();
      
      if (clinicianData) {
        console.debug(`[Clinician Debug] Clinician ID found in clinicians table: "${clinicianData.id}"`);
        return true;
      }
      
      console.warn(`[Clinician Debug] Clinician ID not found in any table: "${idStr}"`);
      return false;
    }
    
    // Check if the clinician ID exists in the profiles table (preferred)
    console.debug(`[Clinician Debug] Querying profiles table for clinician ID: "${cleanId}"`);
    let { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', cleanId)
      .eq('role', 'clinician')
      .maybeSingle();
      
    if (profileData) {
      console.debug(`[Clinician Debug] Clinician ID found in profiles table: "${cleanId}"`);
      return true;
    }
    
    // If not found in profiles, check the clinicians table as fallback
    console.debug(`[Clinician Debug] Clinician not found in profiles, checking clinicians table: "${cleanId}"`);
    let { data: clinicianData, error: clinicianError } = await supabase
      .from('clinicians')
      .select('id')
      .eq('id', cleanId)
      .maybeSingle();
    
    if (clinicianData) {
      console.debug(`[Clinician Debug] Clinician ID found in clinicians table: "${cleanId}"`);
      return true;
    }
    
    console.warn(`[Clinician Debug] Clinician ID not found in any table: "${cleanId}"`);
    return false;
  } catch (error) {
    console.error('[Clinician Debug] Error checking if clinician ID exists:', id, error);
    return false;
  }
}

/**
 * Validates a clinician ID and checks that it exists in the database
 * Enhanced with better error handling, formatting, and database checks
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
  
  const idStr = String(id).trim();
  
  try {
    // Try to format the ID if it's not already a valid UUID
    let validatedId = idStr;
    if (!isValidClinicianID(idStr)) {
      validatedId = formatAsClinicianID(idStr);
      console.debug(`[Clinician Debug] Formatted clinician ID: "${idStr}" → "${validatedId}"`);
    }
    
    // Check if it's a valid UUID after formatting
    if (!isValidClinicianID(validatedId)) {
      console.error(`[Clinician Debug] Invalid clinician ID format: "${idStr}" (formatted: "${validatedId}")`);
      throw new ClinicianIDValidationError(`Invalid clinician ID format: ${idStr}`);
    }
    
    // Check if it exists in the database (any table)
    console.debug(`[Clinician Debug] Checking database for clinician ID: "${validatedId}"`);
    const exists = await clinicianIDExists(validatedId);
    
    if (!exists) {
      // Before failing, try one more time with the original ID as fallback
      if (validatedId !== idStr) {
        const originalExists = await clinicianIDExists(idStr);
        if (originalExists) {
          console.info(`[Clinician Debug] Original ID exists in database: "${idStr}"`);
          return idStr;
        }
      }
      
      console.error(`[Clinician Debug] Clinician ID not found in database: "${validatedId}"`);
      throw new ClinicianIDValidationError(`Clinician ID does not exist: ${validatedId}`);
    }
    
    console.debug(`[Clinician Debug] Clinician ID validation successful: "${validatedId}"`);
    return validatedId;
  } catch (error) {
    if (error instanceof ClinicianIDValidationError) {
      throw error;
    }
    
    console.error('[Clinician Debug] Error validating clinician ID:', idStr, error);
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
