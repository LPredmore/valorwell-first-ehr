
/**
 * Utility functions for UUID validation and formatting
 */

/**
 * Options for UUID formatting
 */
interface UUIDFormatOptions {
  logLevel?: 'error' | 'warn' | 'info' | 'none';
}

/**
 * Format a string as a UUID, adding dashes if needed
 * @param id The ID to format
 * @param options Optional formatting options
 * @returns A formatted UUID string
 */
export const formatAsUUID = (id: string, options: UUIDFormatOptions = { logLevel: 'error' }): string => {
  if (!id) {
    if (options.logLevel === 'error') {
      console.error(`Invalid UUID: ${id} is empty or null`);
    } else if (options.logLevel === 'warn') {
      console.warn(`Invalid UUID: ${id} is empty or null`);
    } else if (options.logLevel === 'info') {
      console.info(`Invalid UUID: ${id} is empty or null`);
    }
    return id;
  }

  // If already a valid UUID, return it
  if (isValidUUID(id)) {
    return id;
  }

  // Remove all non-alphanumeric characters
  const cleanId = id.toLowerCase().replace(/[^a-f0-9]/g, '');

  // Check if we have exactly 32 hex characters
  if (cleanId.length !== 32) {
    if (options.logLevel === 'error') {
      console.error(`Invalid UUID: ${id} does not have 32 hex characters`);
    } else if (options.logLevel === 'warn') {
      console.warn(`Invalid UUID: ${id} does not have 32 hex characters`);
    } else if (options.logLevel === 'info') {
      console.info(`Invalid UUID: ${id} does not have 32 hex characters`);
    }
    return id;
  }

  // Insert hyphens in the correct positions
  const formattedUUID =
    cleanId.substring(0, 8) +
    '-' +
    cleanId.substring(8, 12) +
    '-' +
    cleanId.substring(12, 16) +
    '-' +
    cleanId.substring(16, 20) +
    '-' +
    cleanId.substring(20);

  return formattedUUID;
};

/**
 * Check if a string is a valid UUID
 * @param id The ID to check
 * @returns True if the ID is a valid UUID
 */
export const isValidUUID = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

/**
 * Generate a random UUID
 * @returns A random UUID string
 */
export const generateUUID = (): string => {
  // This is a simple implementation for client-side UUID generation
  // In production, use a more robust UUID library or server-generated UUIDs
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * Ensure a string is a valid UUID, throw an error if not
 * @param id The ID to check
 * @returns The original ID if valid
 */
export const ensureUUID = (id: string): string => {
  if (!isValidUUID(id)) {
    throw new Error(`Invalid UUID: ${id}`);
  }
  return id;
};
