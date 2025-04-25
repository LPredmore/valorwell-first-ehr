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
      const validTimeZone = TimeZoneService.ensureIANATimeZone(timezone);
      const startDt = TimeZoneService.parseWithZone(`${date}T${startTime}`, validTimeZone);
      const endDt = TimeZoneService.parseWithZone(`${date}T${endTime}`, validTimeZone);

      console.log('[AvailabilityMutationService] Creating single availability:', {
        clinicianId,
        start: startDt.toISO(),
        end: endDt.toISO(),
        timezone: validTimeZone
      });

      const { data, error } = await supabase
        .from('calendar_events')
        .insert([
          {
            clinician_id: clinicianId,
            event_type: 'availability',
            start_time: startDt.toUTC().toISO(),
            end_time: endDt.toUTC().toISO(),
            is_active: true,
          },
        ])
        .select('id');

      if (error) {
        console.error('[AvailabilityMutationService] Error creating single availability:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('[AvailabilityMutationService] Error creating single availability:', error);
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
      const validTimeZone = TimeZoneService.ensureIANATimeZone(timezone);
      
      console.log('[AvailabilityMutationService] Creating recurring availability:', {
        clinicianId,
        dayOfWeek,
        startTime,
        endTime,
        timezone: validTimeZone
      });

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
            timezone: validTimeZone,
            is_active: true,
          },
        ])
        .select('id');

      if (error) {
        console.error('[AvailabilityMutationService] Error creating recurring availability:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('[AvailabilityMutationService] Error creating recurring availability:', error);
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
    }
  ): Promise<{ success: boolean; error?: string; id?: string }> {
    try {
      // Get clinician timezone from profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('time_zone')
        .eq('id', clinicianId)
        .maybeSingle();
    
    if (profileError) {
      console.error('[AvailabilityMutationService] Error fetching clinician timezone:', profileError);
      return { 
        success: false, 
        error: `Failed to fetch clinician timezone: ${profileError.message}`
      };
    }
    
    const timezone = TimeZoneService.ensureIANATimeZone(profileData?.time_zone || 'UTC');
    console.log('[AvailabilityMutationService] Using timezone:', timezone);
    
    // Validate time slots
    if (!slotData.startTime || !slotData.endTime) {
      return {
        success: false,
        error: 'Start time and end time are required'
      };
    }
    
    // For recurring events, validate the recurrence rule if provided
    if (slotData.recurring && slotData.recurrenceRule) {
      if (!slotData.recurrenceRule.includes('FREQ=') || !slotData.recurrenceRule.includes('BYDAY=')) {
        console.error('[AvailabilityMutationService] Invalid recurrence rule format:', slotData.recurrenceRule);
        return {
          success: false,
          error: 'Invalid recurrence rule format'
        };
      }
    }
    
    const eventData: any = {
      clinician_id: clinicianId,
      event_type: 'availability',
      title: slotData.title || 'Available',
      is_active: true,
      timezone: timezone
    };
    
    // Start a transaction by using a single connection for multiple operations
    if (slotData.recurring) {
      eventData.is_recurring = true;
      eventData.start_time = slotData.startTime;
      eventData.end_time = slotData.endTime;
      
      console.log('[AvailabilityMutationService] Creating recurring availability event with data:', eventData);
      
      // First step: Create the calendar event
      const { data: eventResult, error: eventError } = await supabase
        .from('calendar_events')
        .insert([eventData])
        .select('id')
        .single();
        
      if (eventError) {
        console.error('[AvailabilityMutationService] Error creating calendar event:', eventError);
        return { 
          success: false, 
          error: `Failed to create calendar event: ${eventError.message}` 
        };
      }
      
      const eventId = eventResult.id;
      console.log('[AvailabilityMutationService] Created calendar event with ID:', eventId);
      
      // If recurrence rule is provided, create it and link to the event
      if (slotData.recurrenceRule) {
        console.log('[AvailabilityMutationService] Creating recurrence rule:', slotData.recurrenceRule);
        
        const { data: recurrenceData, error: recurrenceError } = await supabase
          .from('recurrence_rules')
          .insert([{ 
            event_id: eventId,
            rrule: slotData.recurrenceRule 
          }])
          .select('id')
          .single();
          
        if (recurrenceError) {
          console.error('[AvailabilityMutationService] Error creating recurrence rule:', recurrenceError);
          
          // Try to clean up the calendar event since recurrence rule failed
          await supabase
            .from('calendar_events')
            .delete()
            .eq('id', eventId);
          
          return { 
            success: false, 
            error: `Failed to create recurrence rule: ${recurrenceError.message}` 
          };
        }
        
        console.log('[AvailabilityMutationService] Created recurrence rule with ID:', recurrenceData.id);
        
        // Update the calendar event with the recurrence ID
        const { error: updateError } = await supabase
          .from('calendar_events')
          .update({ recurrence_id: eventId })
          .eq('id', eventId);
          
        if (updateError) {
          console.error('[AvailabilityMutationService] Error updating event with recurrence ID:', updateError);
          return { 
            success: false, 
            error: `Failed to update event with recurrence ID: ${updateError.message}` 
          };
        }
      }
      
      return { 
        success: true,
        id: eventId
      };
    } else {
      // For non-recurring slots, convert to UTC for storage
      try {
        const startDt = TimeZoneService.parseWithZone(slotData.startTime, timezone);
        const endDt = TimeZoneService.parseWithZone(slotData.endTime, timezone);
        
        if (!startDt.isValid) {
          return {
            success: false,
            error: `Invalid start time: ${startDt.invalidReason}`
          };
        }
        
        if (!endDt.isValid) {
          return {
            success: false,
            error: `Invalid end time: ${endDt.invalidReason}`
          };
        }
        
        eventData.start_time = TimeZoneService.toUTC(startDt).toISO();
        eventData.end_time = TimeZoneService.toUTC(endDt).toISO();
        
        console.log('[AvailabilityMutationService] Creating non-recurring availability event with data:', eventData);
        
        const { data, error } = await supabase
          .from('calendar_events')
          .insert([eventData])
          .select('id')
          .single();
          
        if (error) {
          console.error('[AvailabilityMutationService] Error creating non-recurring event:', error);
          return { 
            success: false, 
            error: `Failed to create availability slot: ${error.message}` 
          };
        }
        
        return { 
          success: true,
          id: data?.id
        };
      } catch (error) {
        console.error('[AvailabilityMutationService] Error parsing dates:', error);
        return {
          success: false,
          error: error instanceof Error ? `Date parsing error: ${error.message}` : 'Unknown date parsing error'
        };
      }
    }
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
      const { data: slotData, error: fetchError } = await supabase
        .from('calendar_events')
        .select('clinician_id')
        .eq('id', slotId)
        .single();

      if (fetchError || !slotData?.clinician_id) {
        throw new Error('Failed to fetch slot data');
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('time_zone')
        .eq('id', slotData.clinician_id)
        .maybeSingle();
      
      const timezone = TimeZoneService.ensureIANATimeZone(profileData?.time_zone || 'UTC');
      
      const updateData: any = {};
      
      if (updates.startTime) {
        const startDt = TimeZoneService.parseWithZone(updates.startTime, timezone);
        if (!startDt.isValid) {
          return {
            success: false,
            error: `Invalid start time: ${startDt.invalidReason}`
          };
        }
        updateData.start_time = TimeZoneService.toUTC(startDt).toISO();
      }
      
      if (updates.endTime) {
        const endDt = TimeZoneService.parseWithZone(updates.endTime, timezone);
        if (!endDt.isValid) {
          return {
            success: false,
            error: `Invalid end time: ${endDt.invalidReason}`
          };
        }
        updateData.end_time = TimeZoneService.toUTC(endDt).toISO();
      }

      const { error } = await supabase
        .from('calendar_events')
        .update(updateData)
        .eq('id', slotId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('[AvailabilityMutationService] Error updating availability slot:', error);
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
      // Check if this is a recurring event
      const { data: slotData, error: fetchError } = await supabase
        .from('calendar_events')
        .select('recurrence_id')
        .eq('id', slotId)
        .single();
        
      if (fetchError) {
        console.error('[AvailabilityMutationService] Error fetching slot data:', fetchError);
        return { 
          success: false, 
          error: `Failed to fetch slot data: ${fetchError.message}` 
        };
      }
      
      // If it's a recurring event, we need to clean up the recurrence rules too
      if (slotData?.recurrence_id) {
        console.log('[AvailabilityMutationService] Deleting recurrence rule for slot:', slotId);
        
        // Delete recurrence rules
        const { error: recurrenceError } = await supabase
          .from('recurrence_rules')
          .delete()
          .eq('event_id', slotId);
          
        if (recurrenceError) {
          console.error('[AvailabilityMutationService] Error deleting recurrence rule:', recurrenceError);
          // We'll continue trying to delete the event even if recurrence rule deletion fails
        }
      }

      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', slotId);

      if (error) {
        console.error('[AvailabilityMutationService] Error deleting availability slot:', error);
        return { 
          success: false, 
          error: `Error deleting availability slot: ${error.message}` 
        };
      }

      return { success: true };
    } catch (error) {
      console.error('[AvailabilityMutationService] Error deleting availability slot:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error deleting availability slot' 
      };
    }
  }
}
