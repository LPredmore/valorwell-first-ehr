
import { supabase } from '@/integrations/supabase/client';
import { AvailabilitySettings, AvailabilitySlot, WeeklyAvailability } from '@/types/appointment';
import { CalendarEvent, CalendarEventType } from '@/types/calendar';
import { DateTime } from 'luxon';
import { createEmptyWeeklyAvailability } from '@/utils/availabilityUtils';
import { ensureIANATimeZone } from '@/utils/timeZoneUtils';

export class AvailabilityService {
  static async getSettings(clinicianId: string): Promise<AvailabilitySettings | null> {
    const { data, error } = await supabase
      .from('availability_settings')
      .select('*')
      .eq('clinician_id', clinicianId)
      .single();

    if (error) {
      console.error('Error fetching availability settings:', error);
      return null;
    }

    return data ? {
      id: data.id,
      clinicianId: data.clinician_id,
      defaultSlotDuration: data.default_slot_duration,
      minNoticeDays: data.min_notice_days,
      maxAdvanceDays: data.max_advance_days,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    } : null;
  }

  static async updateSettings(
    clinicianId: string, 
    settings: Partial<AvailabilitySettings>
  ): Promise<AvailabilitySettings | null> {
    const { data, error } = await supabase
      .from('availability_settings')
      .upsert({
        clinician_id: clinicianId,
        default_slot_duration: settings.defaultSlotDuration,
        min_notice_days: settings.minNoticeDays,
        max_advance_days: settings.maxAdvanceDays
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating availability settings:', error);
      return null;
    }

    return data ? {
      id: data.id,
      clinicianId: data.clinician_id,
      defaultSlotDuration: data.default_slot_duration,
      minNoticeDays: data.min_notice_days,
      maxAdvanceDays: data.max_advance_days,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    } : null;
  }

  static async getAvailabilitySlots(
    clinicianId: string,
    startDate: string,
    endDate: string
  ): Promise<AvailabilitySlot[]> {
    const { data: events, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('clinician_id', clinicianId)
      .eq('event_type', 'availability')
      .gte('start_time', startDate)
      .lte('end_time', endDate)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching availability slots:', error);
      return [];
    }

    return events.map(event => ({
      startTime: event.start_time,
      endTime: event.end_time,
      dayOfWeek: DateTime.fromISO(event.start_time).toFormat('EEEE').toLowerCase(),
      isRecurring: !!event.recurrence_id
    }));
  }

  static async createAvailabilitySlot(
    clinicianId: string,
    slot: {
      startTime: string;
      endTime: string;
      title?: string;
      recurring?: boolean;
      recurrenceRule?: string;
    }
  ): Promise<string | null> {
    try {
      console.log('[AvailabilityService] Creating availability slot with:', {
        clinicianId,
        startTime: slot.startTime,
        endTime: slot.endTime,
        recurring: slot.recurring,
        recurrenceRule: slot.recurrenceRule
      });

      // Get clinician's timezone for proper storage
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('time_zone')
        .eq('id', clinicianId)
        .maybeSingle();
      
      if (profileError) {
        console.error('[AvailabilityService] Error fetching clinician timezone:', profileError);
      }
      
      const clinicianTimeZone = profileData?.time_zone || 'UTC';
      console.log('[AvailabilityService] Using clinician timezone:', clinicianTimeZone);
      
      // Parse the incoming times and ensure they're treated as being in the clinician's timezone
      const startDateTime = DateTime.fromISO(slot.startTime, { zone: clinicianTimeZone });
      const endDateTime = DateTime.fromISO(slot.endTime, { zone: clinicianTimeZone });
      
      if (!startDateTime.isValid || !endDateTime.isValid) {
        console.error('[AvailabilityService] Invalid date/time formats:', { 
          startTime: slot.startTime, 
          endTime: slot.endTime,
          startValid: startDateTime.isValid,
          startInvalidReason: startDateTime.invalidReason,
          endValid: endDateTime.isValid,
          endInvalidReason: endDateTime.invalidReason
        });
        return null;
      }
      
      if (endDateTime <= startDateTime) {
        console.error('[AvailabilityService] End time must be after start time:', {
          start: startDateTime.toISO(),
          end: endDateTime.toISO()
        });
        return null;
      }
      
      console.log('[AvailabilityService] Parsed start time:', startDateTime.toISO());
      console.log('[AvailabilityService] Parsed end time:', endDateTime.toISO());

      // Create the main event
      const { data: eventData, error: eventError } = await supabase
        .from('calendar_events')
        .insert({
          clinician_id: clinicianId,
          event_type: 'availability',
          title: slot.title || 'Available',
          start_time: startDateTime.toUTC().toISO(),
          end_time: endDateTime.toUTC().toISO(),
          all_day: false,
          is_active: true
        })
        .select('id')
        .single();

      if (eventError || !eventData?.id) {
        console.error('[AvailabilityService] Error creating availability slot:', eventError);
        return null;
      }

      // If this is a recurring slot, create the recurrence rule
      if (slot.recurring && slot.recurrenceRule && eventData?.id) {
        const { error: recurrenceError } = await supabase
          .from('recurrence_rules')
          .insert({
            event_id: eventData.id,
            rrule: slot.recurrenceRule
          });

        if (recurrenceError) {
          console.error('[AvailabilityService] Error creating recurrence rule:', recurrenceError);
          // Delete the event if recurrence rule creation fails
          await supabase
            .from('calendar_events')
            .delete()
            .eq('id', eventData.id);
          return null;
        }
        
        // Update the event with the recurrence ID
        const { error: updateError } = await supabase
          .from('calendar_events')
          .update({ recurrence_id: eventData.id })
          .eq('id', eventData.id);
          
        if (updateError) {
          console.error('[AvailabilityService] Error updating event with recurrence ID:', updateError);
        }
      }

      return eventData.id;
    } catch (error) {
      console.error('[AvailabilityService] Error in createAvailabilitySlot:', error);
      return null;
    }
  }

  static async updateAvailabilitySlot(
    slotId: string,
    updates: {
      startTime?: string;
      endTime?: string;
      title?: string;
    },
    updateRecurrence: boolean = false
  ): Promise<boolean> {
    try {
      // First get the clinician ID for this slot to determine timezone
      const { data: slotData, error: slotError } = await supabase
        .from('calendar_events')
        .select('clinician_id')
        .eq('id', slotId)
        .single();
        
      if (slotError || !slotData?.clinician_id) {
        console.error('[AvailabilityService] Error fetching slot data:', slotError);
        return false;
      }
      
      // Get clinician timezone
      const { data: profileData } = await supabase
        .from('profiles')
        .select('time_zone')
        .eq('id', slotData.clinician_id)
        .maybeSingle();
        
      const clinicianTimeZone = profileData?.time_zone || 'UTC';
      console.log('[AvailabilityService] Using clinician timezone for update:', clinicianTimeZone);

      const updateData: any = {};
      
      // Properly format times with Luxon if provided
      if (updates.startTime) {
        const startDateTime = DateTime.fromISO(updates.startTime, { zone: clinicianTimeZone });
        if (!startDateTime.isValid) {
          console.error('[AvailabilityService] Invalid start time format:', updates.startTime);
          return false;
        }
        updateData.start_time = startDateTime.toUTC().toISO();
      }
      
      if (updates.endTime) {
        const endDateTime = DateTime.fromISO(updates.endTime, { zone: clinicianTimeZone });
        if (!endDateTime.isValid) {
          console.error('[AvailabilityService] Invalid end time format:', updates.endTime);
          return false;
        }
        updateData.end_time = endDateTime.toUTC().toISO();
      }
      
      if (updates.title) {
        updateData.title = updates.title;
      }

      if (Object.keys(updates).length === 0 && updateRecurrence === false) {
        updateData.is_active = false;
      }

      console.log(`[AvailabilityService] Updating slot ${slotId} with data:`, updateData);

      const { error } = await supabase
        .from('calendar_events')
        .update(updateData)
        .eq('id', slotId)
        .eq('event_type', 'availability');

      if (error) {
        console.error('[AvailabilityService] Error updating availability slot:', error);
        return false;
      }

      if (updateRecurrence) {
        const { data: eventData, error: eventError } = await supabase
          .from('calendar_events')
          .select('recurrence_id')
          .eq('id', slotId)
          .single();

        if (eventError || !eventData?.recurrence_id) {
          console.log('[AvailabilityService] Not a recurring event or error fetching recurrence:', eventError);
          return !eventError;
        }

        console.log(`[AvailabilityService] Updating all occurrences with recurrence ID ${eventData.recurrence_id}`);

        const { error: recurrenceUpdateError } = await supabase
          .from('calendar_events')
          .update(updateData)
          .eq('recurrence_id', eventData.recurrence_id);

        if (recurrenceUpdateError) {
          console.error('[AvailabilityService] Error updating recurring availability slots:', recurrenceUpdateError);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('[AvailabilityService] Error in updateAvailabilitySlot:', error);
      return false;
    }
  }

  static async deleteAvailabilitySlot(
    slotId: string,
    deleteRecurrence: boolean = false
  ): Promise<boolean> {
    try {
      if (deleteRecurrence) {
        const { data: eventData, error: eventError } = await supabase
          .from('calendar_events')
          .select('recurrence_id')
          .eq('id', slotId)
          .single();

        if (eventError) {
          console.error('Error checking recurrence:', eventError);
          return false;
        }

        if (eventData?.recurrence_id) {
          const { error: recurrenceDeleteError } = await supabase
            .from('calendar_events')
            .delete()
            .eq('recurrence_id', eventData.recurrence_id);

          if (recurrenceDeleteError) {
            console.error('Error deleting recurring availability slots:', recurrenceDeleteError);
            return false;
          }

          const { error: ruleDeleteError } = await supabase
            .from('recurrence_rules')
            .delete()
            .eq('id', eventData.recurrence_id);

          if (ruleDeleteError) {
            console.error('Error deleting recurrence rule:', ruleDeleteError);
            return false;
          }

          return true;
        }
      }

      // Use hard delete instead of soft delete
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', slotId)
        .eq('event_type', 'availability');

      if (error) {
        console.error('Error deleting availability slot:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteAvailabilitySlot:', error);
      return false;
    }
  }

  static async getWeeklyAvailability(clinicianId: string): Promise<WeeklyAvailability> {
    try {
      console.log('[AvailabilityService] Getting weekly availability for clinician:', clinicianId);
      
      // Get clinician's timezone for proper time conversion
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('time_zone')
        .eq('id', clinicianId)
        .maybeSingle();
      
      if (profileError) {
        console.error('[AvailabilityService] Error fetching clinician timezone:', profileError);
      }
      
      const clinicianTimeZone = ensureIANATimeZone(profileData?.time_zone || 'UTC');
      console.log('[AvailabilityService] Using clinician timezone:', clinicianTimeZone);
      
      // Initialize the weekly availability with empty arrays
      const weeklyAvailability: WeeklyAvailability = createEmptyWeeklyAvailability();
      
      // STEP 1: Fetch availability slots from calendar_events
      const { data: events, error } = await supabase
        .from('calendar_events')
        .select(`
          id, 
          start_time, 
          end_time, 
          recurrence_id,
          recurrence_rules:recurrence_id(rrule),
          is_active
        `)
        .eq('clinician_id', clinicianId)
        .eq('event_type', 'availability')
        .eq('is_active', true);

      if (error) {
        console.error('[AvailabilityService] Error fetching weekly availability:', error);
        return createEmptyWeeklyAvailability();
      }
      
      console.log(`[AvailabilityService] Processing ${events?.length || 0} availability events`);

      // Process availability events
      events?.forEach(event => {
        try {
          // Use Luxon to properly parse the UTC times and convert to clinician's timezone
          const startDateTime = DateTime.fromISO(event.start_time).setZone(clinicianTimeZone);
          const endDateTime = DateTime.fromISO(event.end_time).setZone(clinicianTimeZone);
          
          // Get day of week in lowercase to match our WeeklyAvailability keys
          const dayOfWeek = startDateTime.weekdayLong.toLowerCase();
          
          // Log detailed information for debugging
          console.log(`[AvailabilityService] Event ${event.id}:`, {
            originalStart: event.start_time,
            originalEnd: event.end_time,
            timezone: clinicianTimeZone,
            convertedStart: startDateTime.toString(),
            convertedEnd: endDateTime.toString(),
            dayOfWeek: dayOfWeek,
            startHour: startDateTime.hour,
            startMinute: startDateTime.minute,
            endHour: endDateTime.hour,
            endMinute: endDateTime.minute
          });
          
          if (dayOfWeek in weeklyAvailability) {
            weeklyAvailability[dayOfWeek].push({
              id: event.id,
              startTime: startDateTime.toFormat('HH:mm'), // 24-hour format for consistent handling
              endTime: endDateTime.toFormat('HH:mm'),
              dayOfWeek,
              isRecurring: !!event.recurrence_id,
              isAppointment: false
            });
            
            console.log(`[AvailabilityService] Added availability for ${dayOfWeek}:`, {
              id: event.id,
              startTime: startDateTime.toFormat('HH:mm'),
              endTime: endDateTime.toFormat('HH:mm')
            });
          } else {
            console.warn(`[AvailabilityService] Unknown day of week: ${dayOfWeek} for event ${event.id}`);
          }
        } catch (err) {
          console.error(`[AvailabilityService] Error processing event ${event.id}:`, err);
        }
      });

      // STEP 2: Fetch appointments for this clinician
      // We need to get all appointments to appropriately display them in the weekly view
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          id, 
          date, 
          start_time, 
          end_time, 
          status,
          source_time_zone,
          clients:client_id (
            client_first_name, 
            client_last_name
          )
        `)
        .eq('clinician_id', clinicianId)
        .eq('status', 'scheduled');  // Only include scheduled appointments

      if (appointmentsError) {
        console.error('[AvailabilityService] Error fetching appointments:', appointmentsError);
      } else {
        console.log(`[AvailabilityService] Processing ${appointments?.length || 0} appointments`);
        
        // Process each appointment and add it to the weekly schedule
        appointments?.forEach(appointment => {
          try {
            // Convert appointment date and time to a DateTime object in clinician timezone
            const apptDate = appointment.date; // Format: YYYY-MM-DD
            const startTimeStr = appointment.start_time; // Format: HH:MM:SS
            const endTimeStr = appointment.end_time; // Format: HH:MM:SS
            
            // Create a datetime string by combining the date and time
            const startDateTimeStr = `${apptDate}T${startTimeStr}`;
            const endDateTimeStr = `${apptDate}T${endTimeStr}`;
            
            // Parse using the source timezone (from appointment)
            const sourceTimeZone = appointment.source_time_zone || clinicianTimeZone;
            const startDateTime = DateTime.fromSQL(startDateTimeStr, { zone: sourceTimeZone }).setZone(clinicianTimeZone);
            const endDateTime = DateTime.fromSQL(endDateTimeStr, { zone: sourceTimeZone }).setZone(clinicianTimeZone);
            
            if (!startDateTime.isValid || !endDateTime.isValid) {
              console.error('[AvailabilityService] Invalid appointment date/time:', {
                appointment: appointment.id,
                date: apptDate,
                startTime: startTimeStr,
                endTime: endTimeStr,
                startValid: startDateTime.isValid,
                startInvalidReason: startDateTime?.invalidReason,
                endValid: endDateTime.isValid,
                endInvalidReason: endDateTime?.invalidReason
              });
              return; // Skip this appointment
            }
            
            // Get day of week in lowercase
            const dayOfWeek = startDateTime.weekdayLong.toLowerCase();
            
            // Build the client name if available
            let clientName = 'Client';
            if (appointment.clients) {
              clientName = `${appointment.clients.client_first_name || ''} ${appointment.clients.client_last_name || ''}`.trim();
              clientName = clientName || 'Client';
            }
            
            console.log(`[AvailabilityService] Appointment ${appointment.id}:`, {
              date: apptDate,
              startTime: startTimeStr,
              endTime: endTimeStr,
              dayOfWeek,
              clientName,
              convertedStart: startDateTime.toFormat('HH:mm'),
              convertedEnd: endDateTime.toFormat('HH:mm')
            });
            
            if (dayOfWeek in weeklyAvailability) {
              weeklyAvailability[dayOfWeek].push({
                id: appointment.id,
                startTime: startDateTime.toFormat('HH:mm'),
                endTime: endDateTime.toFormat('HH:mm'),
                dayOfWeek,
                isAppointment: true,
                clientName,
                appointmentStatus: appointment.status
              });
              
              console.log(`[AvailabilityService] Added appointment for ${dayOfWeek}:`, {
                id: appointment.id,
                startTime: startDateTime.toFormat('HH:mm'),
                endTime: endDateTime.toFormat('HH:mm'),
                clientName
              });
            }
          } catch (err) {
            console.error(`[AvailabilityService] Error processing appointment ${appointment.id}:`, err);
          }
        });
      }

      return weeklyAvailability;
    } catch (error) {
      console.error('[AvailabilityService] Error getting weekly availability:', error);
      return createEmptyWeeklyAvailability();
    }
  }

  static async calculateAvailableSlots(clinicianId: string, date: string): Promise<Array<{
    start: string;
    end: string;
    slotId?: string;
    isRecurring?: boolean;
  }>> {
    // Implementation omitted for brevity
    return [];
  }
}
