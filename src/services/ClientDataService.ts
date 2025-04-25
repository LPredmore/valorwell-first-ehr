
import { ClientData } from '@/types/availability';

/**
 * ClientDataService: Centralizes all client data handling logic
 * Eliminates inconsistent client data extraction across the application
 */
export class ClientDataService {
  /**
   * Safely formats a client name from client data
   * Handles different formats of client data consistently
   */
  static formatClientName(clientData: any, defaultName: string = 'Client'): string {
    try {
      if (!clientData) {
        return defaultName;
      }
      
      // Handle array of clients - common format from Supabase joins
      if (Array.isArray(clientData)) {
        if (clientData.length === 0) {
          return defaultName;
        }
        
        const client = clientData[0];
        return this.formatSingleClientName(client, defaultName);
      }
      
      // Handle single client object
      return this.formatSingleClientName(clientData, defaultName);
      
    } catch (error) {
      console.error('[ClientDataService] Error formatting client name:', error, { clientData });
      return defaultName;
    }
  }
  
  /**
   * Extract formatted name from a single client object
   */
  private static formatSingleClientName(client: any, defaultName: string): string {
    if (!client) return defaultName;
    
    // Try different field combinations - handles inconsistencies in the data model
    const firstName = client.client_first_name || client.client_preferred_name || '';
    const lastName = client.client_last_name || '';
    
    const formattedName = `${firstName} ${lastName}`.trim();
    return formattedName || defaultName;
  }
  
  /**
   * Safely gets client ID from various client data formats
   */
  static getClientId(clientData: any): string | null {
    try {
      if (!clientData) return null;
      
      // Handle array format
      if (Array.isArray(clientData)) {
        return clientData[0]?.id || null;
      }
      
      // Handle single object format
      return clientData.id || null;
      
    } catch (error) {
      console.error('[ClientDataService] Error extracting client ID:', error, { clientData });
      return null;
    }
  }
  
  /**
   * Safely transforms client data from a variety of formats into a consistent ClientData object
   */
  static normalizeClientData(clientData: any): ClientData | null {
    try {
      if (!clientData) return null;
      
      const clientId = this.getClientId(clientData);
      if (!clientId) return null;
      
      const displayName = this.formatClientName(clientData);
      
      return {
        id: clientId,
        displayName
      };
      
    } catch (error) {
      console.error('[ClientDataService] Error normalizing client data:', error, { clientData });
      return null;
    }
  }
  
  /**
   * Transforms an array of client data into normalized ClientData objects
   */
  static normalizeClientList(clientDataList: any[]): ClientData[] {
    if (!Array.isArray(clientDataList)) {
      console.error('[ClientDataService] Expected array for client list normalization', clientDataList);
      return [];
    }
    
    return clientDataList
      .map(client => this.normalizeClientData(client))
      .filter(client => client !== null) as ClientData[];
  }
}
