
import { ClientData } from '@/types/availability';
import { TimeZoneService } from '@/utils/timeZoneService';

export class ClientDataService {
  static formatClientName(client: Partial<any>, fallback: string = 'Unknown Client'): string {
    if (!client) return fallback;
    
    // Handle client data with client_first_name and client_last_name fields
    if ('client_first_name' in client || 'client_last_name' in client) {
      const firstName = client.client_preferred_name || client.client_first_name || '';
      const lastName = client.client_last_name || '';
      const formattedName = `${firstName} ${lastName}`.trim();
      return formattedName || fallback;
    }
    
    // Fallback to name field if it exists
    return client.name || fallback;
  }

  static normalizeClientData(data: any): ClientData {
    return {
      id: data.id,
      name: this.formatClientName(data, 'Unnamed Client'),
      email: data.email,
      phone: data.phone,
      timeZone: TimeZoneService.ensureIANATimeZone(data.time_zone || 'America/Chicago'),
      displayName: this.formatClientName(data, 'Unnamed Client'),
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }
}
