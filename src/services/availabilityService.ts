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
      // Create the main event
      const { data: eventData, error: eventError } = await supabase
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

      if (eventError || !eventData?.id) {
        console.error('Error creating availability slot:', eventError);
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
          console.error('Error creating recurrence rule:', recurrenceError);
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
          console.error('Error updating event with recurrence ID:', updateError);
        }
      }

      return eventData.id;
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
        return createEmptyWeeklyAvailability();
      }

      const weeklyAvailability: WeeklyAvailability = createEmptyWeeklyAvailability();

      events?.forEach(event => {
        const startDateTime = DateTime.fromISO(event.start_time);
        const dayOfWeek = startDateTime.toFormat('EEEE').toLowerCase();
        
        if (dayOfWeek in weeklyAvailability) {
          weeklyAvailability[dayOfWeek].push({
            id: event.id,
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
      return createEmptyWeeklyAvailability();
    }
  }

  static async calculateAvailableSlots(clinicianId: string, date: string): Promise<Array<{
    start: string;
    end: string;
    slotId?: string;
    isRecurring?: boolean;
  }>> {
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
      return [];
    }
    
    const { data: profileData } = await supabase
      .from('profiles')
      .select('time_zone')
      .eq('id', clinicianId)
      .single();
      
    const timezone = profileData?.time_zone || 'UTC';
    const { default_slot_duration, min_notice_days, max_advance_days } = settings;

    const startOfDay = DateTime.fromISO(date, { zone: timezone }).startOf('day');
    const endOfDay = DateTime.fromISO(date, { zone: timezone }).endOf('day');

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

    let availableSlots: Array<{ start: string; end: string; slotId?: string; isRecurring?: boolean }> = [];
    for (const slot of slots) {
      const slotStartDT = DateTime.fromISO(slot.start_time, { zone: timezone });
      const slotEndDT = DateTime.fromISO(slot.end_time, { zone: timezone });
      const durationMin = default_slot_duration || 60;
      for (let t = slotStartDT; t.plus({ minutes: durationMin }) <= slotEndDT; t = t.plus({ minutes: durationMin })) {
        const slotBegin = t;
        const slotFinish = t.plus({ minutes: durationMin });
        const now = DateTime.now().setZone(timezone);
        
        if (slotBegin.diff(now, 'days').days < (min_notice_days || 0)) continue;
        if (slotBegin.diff(now, 'days').days > (max_advance_days || 90)) continue;
        
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

function createEmptyWeeklyAvailability(): WeeklyAvailability {
  return {
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: []
  };
}
