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

  static async createAvailabilitySlot(
    clinicianId: string,
    slotData: {
      startTime: string;
      endTime: string;
      recurring?: boolean;
      recurrenceRule?: string;
      title?: string;
      dayOfWeek?: string;
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const eventData: any = {
        clinician_id: clinicianId,
        event_type: 'availability',
        title: slotData.title || 'Available',
        is_active: true
      };
      
      if (slotData.recurring) {
        eventData.is_recurring = true;
        eventData.day_of_week = slotData.dayOfWeek;
        eventData.start_time = slotData.startTime;
        eventData.end_time = slotData.endTime;
        
        if (slotData.recurrenceRule) {
          const { data: recurrenceData, error: recurrenceError } = await supabase
            .from('recurrence_rules')
            .insert([{ rrule: slotData.recurrenceRule }])
            .select();
            
          if (recurrenceError) throw recurrenceError;
          
          if (recurrenceData && recurrenceData.length > 0) {
            eventData.recurrence_id = recurrenceData[0].id;
          }
        }
      } else {
        eventData.start_time = slotData.startTime;
        eventData.end_time = slotData.endTime;
      }
      
      const { error } = await supabase
        .from('calendar_events')
        .insert([eventData]);
        
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('[AvailabilityMutationService] Error creating availability slot:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error creating availability slot' 
      };
    }
  }

  static async updateSettings(
    clinicianId: string, 
    settings: Partial<{
      minNoticeDays: number;
      maxAdvanceDays: number;
      defaultSlotDuration: number;
    }>
  ): Promise<any> {
    try {
      // First check if settings already exist for this clinician
      const { data: existingSettings, error: fetchError } = await supabase
        .from('availability_settings')
        .select('*')
        .eq('clinician_id', clinicianId)
        .maybeSingle();
      
      if (fetchError) throw fetchError;
      
      let result;
      
      if (existingSettings) {
        // Update existing settings
        const { data, error } = await supabase
          .from('availability_settings')
          .update(settings)
          .eq('clinician_id', clinicianId)
          .select();
          
        if (error) throw error;
        result = data?.[0];
      } else {
        // Create new settings
        const { data, error } = await supabase
          .from('availability_settings')
          .insert([{
            clinician_id: clinicianId,
            ...settings
          }])
          .select();
          
        if (error) throw error;
        result = data?.[0];
      }
      
      return result;
    } catch (error) {
      console.error('[AvailabilityMutationService] Error updating availability settings:', error);
      throw error;
    }
  }

  static async updateAvailabilitySlot(
    slotId: string,
    updates: Partial<AvailabilitySlot>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('calendar_events')
        .update({
          start_time: updates.startTime,
          end_time: updates.endTime,
        })
        .eq('id', slotId);

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating availability slot:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error updating availability slot' 
      };
    }
  }

  static async deleteAvailabilitySlot(
    slotId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', slotId);

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting availability slot:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error deleting availability slot' 
      };
    }
  }
}
