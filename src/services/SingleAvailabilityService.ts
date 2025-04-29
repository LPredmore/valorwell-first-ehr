import { supabase } from '@/integrations/supabase/client';
import { AvailabilitySlot } from '@/types/availability';
import { TimeZoneService } from '@/utils/timezone';
import { ensureClinicianID } from '@/utils/validation/clinicianUtils';

export class SingleAvailabilityService {
  static async createSingleAvailability(
    clinicianId: string,
    date: string,
    startTime: string,
    endTime: string,
    timezone: string
  ): Promise<any> {
    try {
      // Validate clinician ID
      const validClinicianId = ensureClinicianID(clinicianId);
      
      const validTimeZone = TimeZoneService.ensureIANATimeZone(timezone);
      const startDt = TimeZoneService.createDateTime(date, startTime, validTimeZone);
      const endDt = TimeZoneService.createDateTime(date, endTime, validTimeZone);

      console.log('[SingleAvailabilityService] Creating single availability:', {
        clinicianId: validClinicianId,
        start: startDt.toISO(),
        end: endDt.toISO(),
        timezone: validTimeZone
      });

      const { data, error } = await supabase
        .from('calendar_events')
        .insert([{
          clinician_id: validClinicianId,
          event_type: 'availability',
          availability_type: 'single',
          start_time: TimeZoneService.toUTC(startDt).toISO(),
          end_time: TimeZoneService.toUTC(endDt).toISO(),
          is_active: true,
          time_zone: validTimeZone
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
