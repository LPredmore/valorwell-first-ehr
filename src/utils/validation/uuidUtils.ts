
/**
 * Format a string as a UUID
 * @param id The ID to format
 * @param options Options for formatting
 * @returns The formatted UUID
 */
export function formatAsUUID(
  id: string | null | undefined,
  options: {
    strictMode?: boolean;
    logLevel?: 'error' | 'warn' | 'info' | 'none';
  } = {}
): string {
  const { strictMode = false, logLevel = 'error' } = options;

  // Return empty string for null or undefined
  if (id == null) {
    if (strictMode) {
      const error = new Error('Cannot format null or undefined as UUID');
      if (logLevel === 'error') console.error(error);
      if (logLevel === 'warn') console.warn(error);
      if (strictMode) throw error;
    }
    return '';
  }

  try {
    // If already a valid UUID, return it
    if (isValidUUID(id)) {
      return id;
    }

    // Remove all non-alphanumeric characters
    let cleanId = id.toLowerCase().replace(/[^a-f0-9]/g, '');

    // Check if we have exactly 32 hex characters
    if (cleanId.length !== 32) {
      const error = new Error(`Invalid UUID format: ${id} (cleaned: ${cleanId})`);
      if (logLevel === 'error') console.error(error);
      if (logLevel === 'warn') console.warn(error);
      if (strictMode) throw error;
      return id; // Return original if strict mode is off
    }

    // Insert hyphens in the correct positions
    const formattedUUID = 
      `${cleanId.slice(0, 8)}-${cleanId.slice(8, 12)}-${cleanId.slice(12, 16)}-${cleanId.slice(16, 20)}-${cleanId.slice(20)}`;

    // Verify the formatted string is a valid UUID
    if (!isValidUUID(formattedUUID)) {
      const error = new Error(`Failed to format as valid UUID: ${id} → ${formattedUUID}`);
      if (logLevel === 'error') console.error(error);
      if (logLevel === 'warn') console.warn(error);
      if (strictMode) throw error;
      return id; // Return original if strict mode is off
    }

    return formattedUUID;
  } catch (error) {
    if (strictMode) throw error;
    if (logLevel === 'error') console.error('Error formatting UUID:', error);
    if (logLevel === 'warn') console.warn('Error formatting UUID:', error);
    return id; // Return original if strict mode is off
  }
}

/**
 * Check if a string is a valid UUID
 * @param id The string to check
 * @returns True if the string is a valid UUID
 */
export function isValidUUID(id: string | null | undefined): boolean {
  if (!id) return false;
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return regex.test(id);
}
