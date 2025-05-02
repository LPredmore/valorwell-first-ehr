
/**
 * Formats and validates a UUID string
 * @param input The UUID string to format
 * @param options Configuration options
 * @returns A properly formatted UUID string
 */
export const formatAsUUID = (input: string | null | undefined, options: {
  strictMode?: boolean;
  logLevel?: 'none' | 'warn' | 'error' | 'info';
} = {}): string => {
  const { strictMode = false, logLevel = 'none' } = options;
  
  // Return empty string if input is null/undefined
  if (input === null || input === undefined) {
    if (strictMode) {
      const error = new Error('UUID cannot be null or undefined');
      if (logLevel === 'error') console.error(error);
      else if (logLevel === 'warn') console.warn(error);
      else if (logLevel === 'info') console.info(error);
      throw error;
    }
    return '';
  }
  
  // Check if already properly formatted
  if (input.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    return input.toLowerCase();
  }
  
  // Clean and format a UUID-like string
  const cleanId = input.toLowerCase().replace(/[^0-9a-f]/g, '');
  
  // If we have exactly 32 characters, format as UUID
  if (cleanId.length === 32) {
    const formatted = 
      cleanId.substring(0, 8) + '-' +
      cleanId.substring(8, 12) + '-' +
      cleanId.substring(12, 16) + '-' +
      cleanId.substring(16, 20) + '-' +
      cleanId.substring(20, 32);
    
    return formatted;
  }
  
  // Handle error case for strict mode
  if (strictMode) {
    const error = new Error(`Invalid UUID format: ${input}`);
    if (logLevel === 'error') console.error(error);
    else if (logLevel === 'warn') console.warn(error);
    else if (logLevel === 'info') console.info(error);
    throw error;
  }
  
  // In non-strict mode, return the input as is
  return input;
};

/**
 * Checks if a string is a valid UUID
 */
export const isValidUUID = (uuid: string): boolean => {
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return regex.test(uuid);
};

/**
 * Ensures a string is a valid UUID or throws an error
 * Similar to formatAsUUID but with a different name for clearer intention
 */
export const ensureUUID = (input: string | null | undefined, options: {
  strictMode?: boolean;
  logLevel?: 'none' | 'warn' | 'error' | 'info';
} = {}): string => {
  return formatAsUUID(input, { strictMode: true, ...options });
};

export default { formatAsUUID, isValidUUID, ensureUUID };
