
/**
 * Safely formats a client name from client data that might be in different formats
 * @param clientData Can be a single client object or an array of client objects
 * @returns Formatted client name or default value if client data is invalid
 */
export const formatClientName = (
  clientData: any, 
  defaultName: string = 'Client'
): string => {
  try {
    // Handle case where client data is an array
    if (Array.isArray(clientData) && clientData.length > 0) {
      const client = clientData[0];
      const firstName = client?.client_first_name || client?.client_preferred_name || '';
      const lastName = client?.client_last_name || '';
      const formattedName = `${firstName} ${lastName}`.trim();
      return formattedName || defaultName;
    }
    
    // Handle case where client data is a single object
    if (clientData && typeof clientData === 'object') {
      const firstName = clientData.client_first_name || clientData.client_preferred_name || '';
      const lastName = clientData.client_last_name || '';
      const formattedName = `${firstName} ${lastName}`.trim();
      return formattedName || defaultName;
    }
    
    // If we can't format a name, return the default
    return defaultName;
  } catch (error) {
    console.error('Error formatting client name:', error);
    return defaultName;
  }
};

/**
 * Safely extracts client ID from client data that might be in different formats
 * @param clientData Can be a single client object or an array of client objects
 * @returns Client ID or null if not found
 */
export const getClientId = (clientData: any): string | null => {
  try {
    // Handle array case
    if (Array.isArray(clientData) && clientData.length > 0) {
      return clientData[0]?.id || null;
    }
    
    // Handle single object case
    if (clientData && typeof clientData === 'object') {
      return clientData.id || null;
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting client ID:', error);
    return null;
  }
};
