
import { supabase } from '@/integrations/supabase/client';
import { AvailabilitySettings, AvailabilitySlot, WeeklyAvailability } from '@/types/appointment';
import { DateTime } from 'luxon';

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
      timezone: data.timezone,
      defaultSlotDuration: data.default_slot_duration,
      minNoticeHours: data.min_notice_hours,
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
        timezone: settings.timezone,
        default_slot_duration: settings.defaultSlotDuration,
        min_notice_hours: settings.minNoticeHours,
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
      timezone: data.timezone,
      defaultSlotDuration: data.default_slot_duration,
      minNoticeHours: data.min_notice_hours,
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
      .lte('end_time', endDate);

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
}
