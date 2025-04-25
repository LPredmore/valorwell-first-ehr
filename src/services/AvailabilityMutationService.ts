
import { supabase } from '@/integrations/supabase/client';
import { AvailabilitySlot } from '@/types/availability';
import { TimeZoneService } from '@/utils/timeZoneService';
import { DateTime } from 'luxon';

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
    startTime: string,
    endTime: string,
    timezone: string,
    recurrenceRule: string
  ): Promise<any> {
    try {
      const validTimeZone = TimeZoneService.ensureIANATimeZone(timezone);
      
      console.log('[AvailabilityMutationService] Creating recurring availability:', {
        clinicianId,
        startTime,
        endTime,
        timezone: validTimeZone,
        recurrenceRule
      });

      // Validate input format - we expect ISO format or close to it
      let startDt: DateTime;
      let endDt: DateTime;
      
      try {
        // Parse both start and end times with timezone
        startDt = TimeZoneService.parseWithZone(startTime, validTimeZone);
        endDt = TimeZoneService.parseWithZone(endTime, validTimeZone);
        
        if (!startDt.isValid || !endDt.isValid) {
          throw new Error(`Invalid datetime: ${!startDt.isValid ? startDt.invalidReason : endDt.invalidReason}`);
        }
      } catch (parseError) {
        console.error('[AvailabilityMutationService] Error parsing datetime:', parseError);
        throw new Error(`Invalid datetime format. Please check your input. ${parseError instanceof Error ? parseError.message : ''}`);
      }
      
      // Log detailed timezone information for debugging
      console.log('[AvailabilityMutationService] DateTime information:', {
        startTime,
        endTime, 
        startDtFormatted: startDt.toISO(),
        endDtFormatted: endDt.toISO(),
        startDtUTC: startDt.toUTC().toISO(),
        endDtUTC: endDt.toUTC().toISO(),
        timezone: validTimeZone
      });

      // Create the initial event
      const { data, error } = await supabase
        .from('calendar_events')
        .insert([
          {
            clinician_id: clinicianId,
            event_type: 'availability',
            title: 'Available',
            start_time: startDt.toUTC().toISO(),
            end_time: endDt.toUTC().toISO(),
            is_recurring: true,
            is_active: true,
          },
        ])
        .select('id');

      if (error) {
        console.error('[AvailabilityMutationService] Error creating recurring availability:', error);
        throw new Error(`Database error: ${error.message}`);
      }
      
      if (!data || data.length === 0) {
        throw new Error('No data returned from calendar event creation');
      }
      
      const eventId = data[0].id;
      
      // Create the recurrence rule linked to the event
      const { error: recurrenceError } = await supabase
        .from('recurrence_rules')
        .insert([{ 
          event_id: eventId,
          rrule: recurrenceRule 
        }]);
        
      if (recurrenceError) {
        console.error('[AvailabilityMutationService] Error creating recurrence rule:', recurrenceError);
        
        // Try to clean up the calendar event since recurrence rule failed
        await supabase
          .from('calendar_events')
          .delete()
          .eq('id', eventId);
        
        throw new Error(`Failed to create recurrence rule: ${recurrenceError.message}`);
      }
      
      // Update the calendar event with the recurrence ID
      const { error: updateError } = await supabase
        .from('calendar_events')
        .update({ recurrence_id: eventId })
        .eq('id', eventId);
        
      if (updateError) {
        console.error('[AvailabilityMutationService] Error updating event with recurrence ID:', updateError);
        throw new Error(`Failed to update event with recurrence ID: ${updateError.message}`);
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
      
      if (slotData.recurring && !slotData.recurrenceRule) {
        return {
          success: false,
          error: 'Recurrence rule is required for recurring availability'
        };
      }
      
      try {
        if (slotData.recurring && slotData.recurrenceRule) {
          console.log('[AvailabilityMutationService] Creating recurring availability slot with data:', {
            startTime: slotData.startTime,
            endTime: slotData.endTime,
            recurrenceRule: slotData.recurrenceRule,
            timezone
          });
          
          // For recurring events, we'll delegate to the createRecurringAvailability method
          const result = await this.createRecurringAvailability(
            clinicianId,
            slotData.startTime,
            slotData.endTime,
            timezone,
            slotData.recurrenceRule
          );
          
          if (!result || !result[0]?.id) {
            return { 
              success: false, 
              error: 'Failed to create recurring availability' 
            };
          }
          
          return { 
            success: true,
            id: result[0].id
          };
        } else {
          // For non-recurring events, ensure the startTime and endTime are valid
          let startDt: DateTime;
          let endDt: DateTime;
          
          try {
            startDt = TimeZoneService.parseWithZone(slotData.startTime, timezone);
            endDt = TimeZoneService.parseWithZone(slotData.endTime, timezone);
          } catch (parseError) {
            return {
              success: false,
              error: `Invalid datetime format: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`
            };
          }
          
          if (!startDt.isValid || !endDt.isValid) {
            return {
              success: false,
              error: `Invalid datetime: ${!startDt.isValid ? startDt.invalidReason : endDt.invalidReason}`
            };
          }

          const eventData = {
            clinician_id: clinicianId,
            event_type: 'availability',
            title: slotData.title || 'Available',
            is_active: true,
            start_time: TimeZoneService.toUTC(startDt).toISO(),
            end_time: TimeZoneService.toUTC(endDt).toISO(),
            is_recurring: false,
          };
          
          console.log('[AvailabilityMutationService] Creating availability event with data:', eventData);
          
          // Create the calendar event
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
          
          return { 
            success: true,
            id: eventResult.id
          };
        }
      } catch (processingError) {
        console.error('[AvailabilityMutationService] Error processing availability slot creation:', processingError);
        return { 
          success: false, 
          error: processingError instanceof Error ? processingError.message : 'Unknown error processing availability' 
        };
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
