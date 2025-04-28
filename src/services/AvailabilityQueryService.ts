import { supabase } from '@/integrations/supabase/client';
import { AvailabilityEvent } from '@/types/availability';

export class AvailabilityQueryService {
  static async getSettingsForClinician(clinicianId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('availability_settings')
        .select('*')
        .eq('clinician_id', clinicianId)
        .single();

      if (error) {
        console.error('Error getting availability settings:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching availability settings:', error);
      return null;
    }
  }

  static async getAvailabilitySlots(clinicianId: string): Promise<{ data: AvailabilityEvent[]; error: any; }> {
    console.log(`[AvailabilityQueryService] Getting availability slots for ${clinicianId}`);
    
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('clinician_id', clinicianId)
        .eq('event_type', 'availability');
      
      if (error) {
        throw error;
      }
      
      if (!data) {
        console.warn('[AvailabilityQueryService] No availability slots found for clinician:', clinicianId);
        return { data: [], error: null };
      }
      
      const availabilityEvents: AvailabilityEvent[] = data.map(event => ({
        id: event.id,
        startTime: event.start_time,
        endTime: event.end_time,
        dayOfWeek: event.day_of_week,
        isRecurring: event.is_recurring,
        recurrenceRule: event.recurrence_rule,
        clinicianId: event.clinician_id,
        timeZone: event.time_zone,
        eventType: event.event_type,
        date: event.date,
        recurringGroupId: event.recurring_group_id
      }));
      
      return { data: availabilityEvents, error: null };
    } catch (error) {
      console.error('[AvailabilityQueryService] Error getting availability slots:', error);
      return { data: [], error };
    }
  }
  
  static async getAvailabilitySlotById(slotId: string): Promise<{ data: AvailabilityEvent | null; error: any; }> {
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('id', slotId)
        .single();
      
      if (error) {
        console.error(`Error getting availability slot with ID ${slotId}:`, error);
        return { data: null, error };
      }
      
      if (!data) {
        console.warn(`[AvailabilityQueryService] No availability slot found with ID: ${slotId}`);
        return { data: null, error: null };
      }
      
      const availabilityEvent: AvailabilityEvent = {
        id: data.id,
        startTime: data.start_time,
        endTime: data.end_time,
        dayOfWeek: data.day_of_week,
        isRecurring: data.is_recurring,
        recurrenceRule: data.recurrence_rule,
        clinicianId: data.clinician_id,
        timeZone: data.time_zone,
        eventType: data.event_type,
        date: data.date,
        recurringGroupId: data.recurring_group_id
      };
      
      return { data: availabilityEvent, error: null };
    } catch (error) {
      console.error('Error in getAvailabilitySlotById:', error);
      return { data: null, error };
    }
  }
}
