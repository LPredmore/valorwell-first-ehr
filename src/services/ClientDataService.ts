
import { ClientData } from '@/types/availability';
import { TimeZoneService } from '@/utils/timeZoneService';

export class ClientDataService {
  static formatClientName(client: any, fallback: string = 'Unknown Client'): string {
    if (!client) return fallback;
    
    // Handle different client data structures
    const firstName = client.client_first_name || client.first_name || client.client_preferred_name || '';
    const lastName = client.client_last_name || client.last_name || '';
    
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || client.name || fallback;
  }

  static normalizeClientData(data: any): ClientData {
    return {
      id: data.id,
      name: this.formatClientName(data, 'Unnamed Client'),
      email: data.email || data.client_email,
      phone: data.phone || data.client_phone,
      timeZone: TimeZoneService.ensureIANATimeZone(data.time_zone || data.client_time_zone || 'America/Chicago'),
      displayName: this.formatClientName(data, 'Unnamed Client'),
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }
}
