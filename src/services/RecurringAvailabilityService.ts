import { supabase } from '@/integrations/supabase/client';
import { AvailabilitySlot } from '@/types/availability';
import { TimeZoneService } from '@/utils/timezone';
import { ensureClinicianID } from '@/utils/validation/clinicianUtils';
import { DateTime } from 'luxon';

export class RecurringAvailabilityService {
  static async createRecurringAvailability(
    clinicianId: string,
    startDt: DateTime,
    endDt: DateTime,
    timezone: string,
    rrule: string
  ): Promise<any> {
    try {
      // Fix toISO calls by ensuring we have DateTime objects
      const startIso = startDt.toISO();
      const endIso = endDt.toISO();

      if (!startIso || !endIso) {
        throw new Error('Invalid start or end DateTime');
      }

      // Validate clinician ID
      const validClinicianId = ensureClinicianID(clinicianId);
      const validTimeZone = TimeZoneService.ensureIANATimeZone(timezone);

      console.log('[RecurringAvailabilityService] Creating recurring availability:', {
        clinicianId: validClinicianId,
        start: startIso,
        end: endIso,
        timezone: validTimeZone,
        rrule
      });

      const { data, error } = await supabase
        .from('calendar_events')
        .insert([{
          clinician_id: validClinicianId,
          event_type: 'availability',
          availability_type: 'recurring',
          start_time: TimeZoneService.toUTC(startDt).toISO(),
          end_time: TimeZoneService.toUTC(endDt).toISO(),
          is_active: true,
          time_zone: validTimeZone,
          recurrence_rule: rrule
        }])
        .select('id');

      if (error) {
        if (error.message.includes('overlapping availability')) {
          throw new Error('This time slot overlaps with an existing availability. Please select a different time.');
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('[RecurringAvailabilityService] Error:', error);
      throw error;
    }
  }

  static async updateRecurringAvailability(
    id: string,
    startDt: DateTime,
    endDt: DateTime,
    timezone: string,
    rrule: string
  ): Promise<any> {
    try {
      // Fix toISO calls by ensuring we have DateTime objects
      const startIso = startDt.toISO();
      const endIso = endDt.toISO();

      if (!startIso || !endIso) {
        throw new Error('Invalid start or end DateTime');
      }

      const validTimeZone = TimeZoneService.ensureIANATimeZone(timezone);

      console.log('[RecurringAvailabilityService] Updating recurring availability:', {
        id,
        start: startIso,
        end: endIso,
        timezone: validTimeZone,
        rrule
      });

      const { data, error } = await supabase
        .from('calendar_events')
        .update({
          start_time: TimeZoneService.toUTC(startDt).toISO(),
          end_time: TimeZoneService.toUTC(endDt).toISO(),
          time_zone: validTimeZone,
          recurrence_rule: rrule
        })
        .eq('id', id)
        .select('id');

      if (error) {
        if (error.message.includes('overlapping availability')) {
          throw new Error('This time slot overlaps with an existing availability. Please select a different time.');
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('[RecurringAvailabilityService] Error:', error);
      throw error;
    }
  }

  static async deleteRecurringAvailability(id: string): Promise<any> {
    try {
      console.log('[RecurringAvailabilityService] Deleting recurring availability:', { id });

      const { data, error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('[RecurringAvailabilityService] Error:', error);
      throw error;
    }
  }
}
