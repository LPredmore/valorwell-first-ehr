import { supabase } from '@/integrations/supabase/client';
import { AvailabilitySettings, AvailabilitySlot, WeeklyAvailability } from '@/types/appointment';
import { CalendarEvent, CalendarEventType } from '@/types/calendar';
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
      const { data, error } = await supabase
        .from('calendar_events')
        .insert({
          clinician_id: clinicianId,
          event_type: 'availability',
          title: slot.title || 'Available',
          start_time: slot.startTime,
          end_time: slot.endTime,
          all_day: false,
          is_active: true
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error creating availability slot:', error);
        return null;
      }

      if (slot.recurring && slot.recurrenceRule && data?.id) {
        const { error: recurrenceError } = await supabase
          .from('recurrence_rules')
          .insert({
            event_id: data.id,
            rrule: slot.recurrenceRule
          });

        if (recurrenceError) {
          console.error('Error creating recurrence rule:', recurrenceError);
        }
      }

      return data?.id || null;
    } catch (error) {
      console.error('Error in createAvailabilitySlot:', error);
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
      const updateData: any = {};
      if (updates.startTime) updateData.start_time = updates.startTime;
      if (updates.endTime) updateData.end_time = updates.endTime;
      if (updates.title) updateData.title = updates.title;

      // Set is_active to false when updateRecurrence is false and no updates are provided
      // This allows us to use this method for soft-deletes
      if (Object.keys(updates).length === 0 && updateRecurrence === false) {
        updateData.is_active = false;
      }

      const { error } = await supabase
        .from('calendar_events')
        .update(updateData)
        .eq('id', slotId)
        .eq('event_type', 'availability');

      if (error) {
        console.error('Error updating availability slot:', error);
        return false;
      }

      if (updateRecurrence) {
        const { data: eventData, error: eventError } = await supabase
          .from('calendar_events')
          .select('recurrence_id')
          .eq('id', slotId)
          .single();

        if (eventError || !eventData?.recurrence_id) {
          console.log('Not a recurring event or error fetching recurrence:', eventError);
          return !eventError;
        }

        const { error: recurrenceUpdateError } = await supabase
          .from('calendar_events')
          .update(updateData)
          .eq('recurrence_id', eventData.recurrence_id);

        if (recurrenceUpdateError) {
          console.error('Error updating recurring availability slots:', recurrenceUpdateError);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error in updateAvailabilitySlot:', error);
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
        console.error('Error fetching weekly availability:', error);
        return {};
      }

      const weeklyAvailability: WeeklyAvailability = {
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
        saturday: [],
        sunday: []
      };

      events.forEach(event => {
        const startDateTime = DateTime.fromISO(event.start_time);
        const dayOfWeek = startDateTime.toFormat('EEEE').toLowerCase();
        
        if (dayOfWeek in weeklyAvailability) {
          weeklyAvailability[dayOfWeek].push({
            id: event.id,  // Include the id field
            startTime: startDateTime.toFormat('HH:mm'),
            endTime: DateTime.fromISO(event.end_time).toFormat('HH:mm'),
            dayOfWeek,
            isRecurring: !!event.recurrence_id
          });
        }
      });

      return weeklyAvailability;
    } catch (error) {
      console.error('Error getting weekly availability:', error);
      return {};
    }
  }

  /**
   * Calculate all bookable slots for a given day, using clinician config and current appointments.
   * Enforces active availability, global toggle, and booking rules.
   * Prevents overlapping slots via DB trigger (see prevent_overlapping_availability).
   *
   * @param clinicianId The clinician's UUID
   * @param date The day for which to calculate (ISO string, e.g. '2025-05-16')
   * @returns Array of available time slots (with start/end as ISO strings, in clinician's time zone)
   */
  static async calculateAvailableSlots(clinicianId: string, date: string): Promise<Array<{
    start: string;
    end: string;
    slotId?: string;
    isRecurring?: boolean;
  }>> {
    // 1. Fetch settings for min advance/max notice, slot duration, and toggle
    const { data: settings, error: settingsError } = await supabase
      .from('availability_settings')
      .select('*')
      .eq('clinician_id', clinicianId)
      .single();

    if (settingsError || !settings) {
      console.error('Could not fetch availability settings:', settingsError);
      return [];
    }
    if (settings.is_active === false) {
      // Availability globally off
      return [];
    }
    const { timezone, default_slot_duration, min_notice_hours, max_advance_days } = settings;

    const startOfDay = DateTime.fromISO(date, { zone: timezone }).startOf('day');
    const endOfDay = DateTime.fromISO(date, { zone: timezone }).endOf('day');

    // 2. Fetch all active availability slots for that day
    const { data: slots, error: slotsError } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('clinician_id', clinicianId)
      .eq('event_type', 'availability')
      .eq('is_active', true)
      .lte('start_time', endOfDay.toISO())
      .gte('end_time', startOfDay.toISO());

    if (slotsError || !slots) {
      console.error('Error fetching availability slots:', slotsError);
      return [];
    }

    // 3. Fetch appointments blocking the time
    const { data: appointments, error: apptError } = await supabase
      .from('appointments')
      .select('appointment_datetime, appointment_end_datetime, status')
      .eq('clinician_id', clinicianId)
      .neq('status', 'cancelled')
      .gte('appointment_datetime', startOfDay.toISO())
      .lte('appointment_end_datetime', endOfDay.toISO());

    if (apptError || !appointments) {
      console.error('Error fetching appointments:', apptError);
      return [];
    }

    // 4. For each slot, break into bookable intervals by duration
    let availableSlots: Array<{ start: string; end: string; slotId?: string; isRecurring?: boolean }> = [];
    for (const slot of slots) {
      const slotStartDT = DateTime.fromISO(slot.start_time, { zone: timezone });
      const slotEndDT = DateTime.fromISO(slot.end_time, { zone: timezone });
      const durationMin = default_slot_duration || 60;
      for (let t = slotStartDT; t.plus({ minutes: durationMin }) <= slotEndDT; t = t.plus({ minutes: durationMin })) {
        const slotBegin = t;
        const slotFinish = t.plus({ minutes: durationMin });
        // Check against min_notice_hours
        const now = DateTime.now().setZone(timezone);
        if (slotBegin.diff(now, 'hours').hours < (min_notice_hours || 0)) continue;
        // Check against max_advance_days
        if (slotBegin.diff(now, 'days').days > (max_advance_days || 90)) continue;
        // Check against appointments (conflict)
        const overlaps = appointments.some(a => {
          return (
            (slotBegin < DateTime.fromISO(a.appointment_end_datetime, { zone: timezone })) &&
            (slotFinish > DateTime.fromISO(a.appointment_datetime, { zone: timezone }))
          );
        });
        if (!overlaps) {
          availableSlots.push({
            start: slotBegin.toISO(),
            end: slotFinish.toISO(),
            slotId: slot.id,
            isRecurring: !!slot.recurrence_id
          });
        }
      }
    }

    return availableSlots;
  }

  /**
   * Globally enable or disable clinician availability (for all slots)
   * @param clinicianId The clinician's UUID
   * @param isActive Boolean, true for available, false for off
   * @returns true if success; false otherwise
   */
  static async toggleAvailabilityActive(clinicianId: string, isActive: boolean): Promise<boolean> {
    const { error } = await supabase
      .from('availability_settings')
      .update({ is_active: isActive })
      .eq('clinician_id', clinicianId);
    if (error) {
      console.error("Error toggling global availability:", error);
      return false;
    }
    return true;
  }
}
