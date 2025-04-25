
import { supabase } from '@/integrations/supabase/client';
import { WeeklyAvailability, AvailabilitySettings, createEmptyWeeklyAvailability } from '@/types/availability';
import { TimeZoneService } from '@/utils/timeZoneService';
import { ClientDataService } from './ClientDataService';
import { DateTime } from 'luxon';

/**
 * AvailabilityQueryService: Handles all read operations for availability data
 * This separates the complex availability query logic from mutation operations
 */
export class AvailabilityQueryService {
  /**
   * Get availability settings for a clinician
   */
  static async getSettings(clinicianId: string): Promise<AvailabilitySettings | null> {
    try {
      const { data, error } = await supabase
        .from('availability_settings')
        .select('id, clinician_id, default_slot_duration, min_notice_days, max_advance_days, created_at, updated_at')
        .eq('clinician_id', clinicianId)
        .single();

      if (error) {
        console.error('[AvailabilityQueryService] Error fetching availability settings:', error);
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
    } catch (error) {
      console.error('[AvailabilityQueryService] Error fetching settings:', error);
      return null;
    }
  }
  
  /**
   * Get clinician's weekly availability with proper timezone handling
   */
  static async getWeeklyAvailability(clinicianId: string): Promise<WeeklyAvailability> {
    try {
      console.log('[AvailabilityQueryService] Getting weekly availability for clinician:', clinicianId);
      
      // Get clinician's timezone for proper time conversion
      const { data: profileData } = await supabase
        .from('profiles')
        .select('time_zone')
        .eq('id', clinicianId)
        .maybeSingle();
      
      const clinicianTimeZone = profileData?.time_zone || 'UTC';
      console.log('[AvailabilityQueryService] Using clinician timezone:', clinicianTimeZone);
      
      // Initialize the weekly availability with empty arrays
      const weeklyAvailability: WeeklyAvailability = createEmptyWeeklyAvailability();
      
      // STEP 1: Fetch availability slots with recurrence rules
      const { data: events, error } = await supabase
        .from('calendar_events_with_rules')
        .select(`
          id,
          start_time,
          end_time,
          recurrence_id,
          is_active,
          rrule
        `)
        .eq('clinician_id', clinicianId)
        .eq('event_type', 'availability')
        .eq('is_active', true);

      if (error) {
        console.error('[AvailabilityQueryService] Error fetching weekly availability:', error);
        return createEmptyWeeklyAvailability();
      }
      
      console.log(`[AvailabilityQueryService] Processing ${events?.length || 0} availability events`);

      // Process each event
      for (const event of events || []) {
        try {
          // Use TimeZoneService to properly parse the UTC times and convert to clinician's timezone
          const startDateTime = TimeZoneService.fromUTC(event.start_time, clinicianTimeZone);
          const endDateTime = TimeZoneService.fromUTC(event.end_time, clinicianTimeZone);
          
          if (!startDateTime.isValid || !endDateTime.isValid) {
            console.error(`[AvailabilityQueryService] Invalid date/time for event ${event.id}:`, {
              start: event.start_time,
              end: event.end_time
            });
            continue;
          }
          
          // Get day of week in lowercase to match our WeeklyAvailability keys
          const dayOfWeek = startDateTime.weekdayLong.toLowerCase();
          
          // Log detailed information for debugging
          console.log(`[AvailabilityQueryService] Event ${event.id}:`, {
            originalStart: event.start_time,
            originalEnd: event.end_time,
            timezone: clinicianTimeZone,
            convertedStart: startDateTime.toString(),
            convertedEnd: endDateTime.toString(),
            dayOfWeek: dayOfWeek,
            startHour: startDateTime.hour,
            startMinute: startDateTime.minute,
            endHour: endDateTime.hour,
            endMinute: endDateTime.minute,
            hasRecurrence: !!event.rrule
          });
          
          if (dayOfWeek in weeklyAvailability) {
            weeklyAvailability[dayOfWeek].push({
              id: event.id,
              startTime: startDateTime.toFormat('HH:mm'),
              endTime: endDateTime.toFormat('HH:mm'),
              dayOfWeek,
              isRecurring: !!event.rrule,
              recurrenceRule: event.rrule || undefined,
              isAppointment: false
            });
          } else {
            console.warn(`[AvailabilityQueryService] Unknown day of week: ${dayOfWeek} for event ${event.id}`);
          }
        } catch (err) {
          console.error(`[AvailabilityQueryService] Error processing event ${event.id}:`, err);
        }
      }

      // STEP 2: Fetch scheduled appointments for this clinician
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          id, 
          date, 
          start_time, 
          end_time, 
          status,
          source_time_zone,
          client_id
        `)
        .eq('clinician_id', clinicianId)
        .eq('status', 'scheduled');  // Only include scheduled appointments

      if (appointmentsError) {
        console.error('[AvailabilityQueryService] Error fetching appointments:', appointmentsError);
      } else {
        console.log(`[AvailabilityQueryService] Processing ${appointments?.length || 0} appointments`);
        
        // Process each appointment and add it to the weekly schedule
        for (const appointment of appointments || []) {
          try {
            // Get client name for the appointment
            const { data: clientData } = await supabase
              .from('clients')
              .select('client_preferred_name, client_last_name')
              .eq('id', appointment.client_id)
              .single();
              
            const clientName = ClientDataService.formatClientName(clientData, 'Client');
            
            // Convert appointment date and time to a DateTime object in clinician timezone
            const apptDate = appointment.date; // Format: YYYY-MM-DD
            const startTimeStr = appointment.start_time; // Format: HH:MM:SS
            const endTimeStr = appointment.end_time; // Format: HH:MM:SS
            
            // Create a datetime string by combining the date and time
            const startDateTimeStr = `${apptDate}T${startTimeStr}`;
            const endDateTimeStr = `${apptDate}T${endTimeStr}`;
            
            // Parse using the source timezone (from appointment)
            const sourceTimeZone = appointment.source_time_zone || clinicianTimeZone;
            
            // Use our TimeZoneService for consistent conversion
            const startDateTime = DateTime.fromSQL(startDateTimeStr, { zone: sourceTimeZone });
            const endDateTime = DateTime.fromSQL(endDateTimeStr, { zone: sourceTimeZone });
            
            const startInClinicianTZ = TimeZoneService.convertDateTime(
              startDateTime.toISO(), 
              sourceTimeZone, 
              clinicianTimeZone
            );
            
            const endInClinicianTZ = TimeZoneService.convertDateTime(
              endDateTime.toISO(), 
              sourceTimeZone, 
              clinicianTimeZone
            );
            
            if (!startInClinicianTZ.isValid || !endInClinicianTZ.isValid) {
              console.error('[AvailabilityQueryService] Invalid appointment date/time:', {
                appointment: appointment.id,
                date: apptDate,
                startTime: startTimeStr,
                endTime: endTimeStr
              });
              continue; // Skip this appointment
            }
            
            // Get day of week in lowercase
            const dayOfWeek = startInClinicianTZ.weekdayLong.toLowerCase();
            
            if (dayOfWeek in weeklyAvailability) {
              weeklyAvailability[dayOfWeek].push({
                id: appointment.id,
                startTime: startInClinicianTZ.toFormat('HH:mm'),
                endTime: endInClinicianTZ.toFormat('HH:mm'),
                dayOfWeek,
                isAppointment: true,
                clientName,
                appointmentStatus: appointment.status
              });
              
              console.log(`[AvailabilityQueryService] Added appointment for ${dayOfWeek}:`, {
                id: appointment.id,
                startTime: startInClinicianTZ.toFormat('HH:mm'),
                endTime: endInClinicianTZ.toFormat('HH:mm'),
                clientName
              });
            }
          } catch (err) {
            console.error(`[AvailabilityQueryService] Error processing appointment ${appointment.id}:`, err);
          }
        }
      }

      return weeklyAvailability;
    } catch (error) {
      console.error('[AvailabilityQueryService] Error getting weekly availability:', error);
      return createEmptyWeeklyAvailability();
    }
  }
}
