import { supabase } from '@/integrations/supabase/client';
import { DatabaseCalendarEvent } from '@/types/calendar';

export class CalendarQueryService {
  static async getClientAppointments(clientId: string, options?: any): Promise<{ data: DatabaseCalendarEvent[]; error: any; }> {
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('client_id', clientId)
        .eq('event_type', 'appointment');
      
      if (error) {
        console.error('Error getting client appointments:', error);
        return { data: [], error };
      }
      
      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error in getClientAppointments:', error);
      return { data: [], error };
    }
  }
  
  static async getClinicianAppointments(clinicianId: string, options?: any): Promise<{ data: DatabaseCalendarEvent[]; error: any; }> {
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('clinician_id', clinicianId)
        .eq('event_type', 'appointment');
      
      if (error) {
        console.error('Error getting clinician appointments:', error);
        return { data: [], error };
      }
      
      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error in getClinicianAppointments:', error);
      return { data: [], error };
    }
  }
  
  static async getCalendarEvents(clinicianId: string, options?: any): Promise<{ data: DatabaseCalendarEvent[]; error: any; }> {
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('clinician_id', clinicianId);
      
      if (error) {
        console.error('Error getting calendar events:', error);
        return { data: [], error };
      }
      
      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error in getCalendarEvents:', error);
      return { data: [], error };
    }
  }
  
  static async getAvailabilityEvents(clinicianId: string, options?: any): Promise<{ data: DatabaseCalendarEvent[]; error: any; }> {
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('clinician_id', clinicianId)
        .eq('event_type', 'availability');
      
      if (error) {
        console.error('Error getting availability events:', error);
        return { data: [], error };
      }
      
      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error in getAvailabilityEvents:', error);
      return { data: [], error };
    }
  }
}
