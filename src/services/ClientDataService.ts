import { ClientData } from '@/types/availability';
import { TimeZoneService } from '@/utils/timeZoneService';

export class ClientDataService {
  static formatClientName(client: Partial<ClientData>, fallback: string = 'Unknown Client'): string {
    if (!client) return fallback;
    return client.name || fallback;
  }

  static normalizeClientData(data: any): ClientData {
    return {
      id: data.id,
      name: data.name || 'Unnamed Client',
      email: data.email,
      phone: data.phone,
      timeZone: TimeZoneService.ensureIANATimeZone(data.time_zone || 'America/Chicago'),
      displayName: data.name || 'Unnamed Client',
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }
}
