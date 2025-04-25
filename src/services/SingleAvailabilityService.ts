
import { supabase } from '@/integrations/supabase/client';
import { AvailabilitySlot } from '@/types/availability';
import { TimeZoneService } from '@/utils/timeZoneService';

export class SingleAvailabilityService {
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

      console.log('[SingleAvailabilityService] Creating single availability:', {
        clinicianId,
        start: startDt.toISO(),
        end: endDt.toISO(),
        timezone: validTimeZone
      });

      const { data, error } = await supabase
        .from('calendar_events')
        .insert([{
          clinician_id: clinicianId,
          event_type: 'availability',
          availability_type: 'single',
          start_time: startDt.toUTC().toISO(),
          end_time: endDt.toUTC().toISO(),
          is_active: true,
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
      console.error('[SingleAvailabilityService] Error:', error);
      throw error;
    }
  }
}
