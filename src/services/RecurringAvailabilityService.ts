
import { supabase } from '@/integrations/supabase/client';
import { TimeZoneService } from '@/utils/timeZoneService';

export class RecurringAvailabilityService {
  static async createRecurringAvailability(
    clinicianId: string,
    startTime: string,
    endTime: string,
    timezone: string,
    recurrenceRule: string
  ): Promise<any> {
    try {
      const validTimeZone = TimeZoneService.ensureIANATimeZone(timezone);
      
      let startDt = TimeZoneService.parseWithZone(startTime, validTimeZone);
      let endDt = TimeZoneService.parseWithZone(endTime, validTimeZone);
      
      if (!startDt.isValid || !endDt.isValid) {
        throw new Error(`Invalid datetime: ${!startDt.isValid ? startDt.invalidReason : endDt.invalidReason}`);
      }

      console.log('[RecurringAvailabilityService] Creating recurring availability:', {
        clinicianId,
        startDt: startDt.toISO(),
        endDt: endDt.toISO(),
        timezone: validTimeZone,
        recurrenceRule
      });

      const { data, error } = await supabase
        .from('calendar_events')
        .insert([{
          clinician_id: clinicianId,
          event_type: 'availability',
          availability_type: 'recurring',
          title: 'Available',
          start_time: TimeZoneService.toUTC(startDt).toISO(),
          end_time: TimeZoneService.toUTC(endDt).toISO(),
          is_active: true,
        }])
        .select('id');

      if (error) {
        if (error.message.includes('overlapping availability')) {
          throw new Error('This recurring schedule overlaps with existing availability slots.');
        }
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error('No data returned from calendar event creation');
      }

      const eventId = data[0].id;
      
      const { error: recurrenceError } = await supabase
        .from('recurrence_rules')
        .insert([{ 
          event_id: eventId,
          rrule: recurrenceRule 
        }]);
        
      if (recurrenceError) {
        // Rollback the calendar event since recurrence rule failed
        await supabase
          .from('calendar_events')
          .delete()
          .eq('id', eventId);
        
        throw new Error(`Failed to create recurrence rule: ${recurrenceError.message}`);
      }

      return data;
    } catch (error) {
      console.error('[RecurringAvailabilityService] Error:', error);
      throw error;
    }
  }
}
