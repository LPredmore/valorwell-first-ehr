import { supabase } from '@/integrations/supabase/client';
import { AvailabilitySlot } from '@/types/availability';
import { TimeZoneService } from '@/utils/timeZoneService';

export class AvailabilityMutationService {
  static async createAvailabilityException(
    recurrenceEventId: string,
    exceptionDate: string,
    isCancelled: boolean,
    newStartTime?: string,
    newEndTime?: string
  ): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('calendar_exceptions')
        .insert([
          {
            recurrence_event_id: recurrenceEventId,
            exception_date: exceptionDate,
            is_cancelled: isCancelled,
            replacement_start_time: newStartTime,
            replacement_end_time: newEndTime,
          },
        ])
        .select();

      if (error) {
        console.error('Error creating availability exception:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error creating availability exception:', error);
      throw error;
    }
  }

  static async updateAvailabilityException(
    exceptionId: string,
    isCancelled: boolean,
    newStartTime?: string,
    newEndTime?: string
  ): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('calendar_exceptions')
        .update({
          is_cancelled: isCancelled,
          replacement_start_time: newStartTime,
          replacement_end_time: newEndTime,
        })
        .eq('id', exceptionId)
        .select();

      if (error) {
        console.error('Error updating availability exception:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error updating availability exception:', error);
      throw error;
    }
  }

  static async deleteAvailabilityException(exceptionId: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('calendar_exceptions').delete().eq('id', exceptionId);

      if (error) {
        console.error('Error deleting availability exception:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error deleting availability exception:', error);
      throw error;
    }
  }

  static async createSingleAvailability(
    clinicianId: string,
    date: string,
    startTime: string,
    endTime: string,
    timezone: string
  ): Promise<any> {
    try {
      const startDt = TimeZoneService.parseWithZone(`${date}T${startTime}`, timezone);
      const endDt = TimeZoneService.parseWithZone(`${date}T${endTime}`, timezone);

      const { data, error } = await supabase
        .from('calendar_events')
        .insert([
          {
            clinician_id: clinicianId,
            event_type: 'availability',
            start_time: startDt.toISO(),
            end_time: endDt.toISO(),
            is_active: true,
          },
        ])
        .select();

      if (error) {
        console.error('Error creating single availability:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error creating single availability:', error);
      throw error;
    }
  }

  static async createRecurringAvailability(
    clinicianId: string,
    dayOfWeek: string,
    startTime: string,
    endTime: string,
    timezone: string
  ): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .insert([
          {
            clinician_id: clinicianId,
            event_type: 'availability',
            day_of_week: dayOfWeek,
            start_time: startTime,
            end_time: endTime,
            is_recurring: true,
            timezone: timezone,
            is_active: true,
          },
        ])
        .select();

      if (error) {
        console.error('Error creating recurring availability:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error creating recurring availability:', error);
      throw error;
    }
  }

  static async updateAvailabilitySlot(slotId: string, updates: Partial<AvailabilitySlot>): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('availability_slots')
        .update(updates)
        .eq('id', slotId)
        .select();

      if (error) {
        console.error('Error updating availability slot:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error updating availability slot:', error);
      throw error;
    }
  }

  static async deleteAvailabilitySlot(slotId: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('availability_slots').delete().eq('id', slotId);

      if (error) {
        console.error('Error deleting availability slot:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error deleting availability slot:', error);
      throw error;
    }
  }
}
