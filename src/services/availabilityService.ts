import { supabase } from '@/integrations/supabase/client';
import { AvailabilitySettings, WeeklyAvailability, DayOfWeek, createEmptyWeeklyAvailability } from '@/types/availability';

export const getSettingsForClinician = async (clinicianId: string): Promise<AvailabilitySettings | null> => {
  try {
    const { data, error } = await supabase
      .from('availability_settings')
      .select('*')
      .eq('clinician_id', clinicianId)
      .single();

    if (error) {
      console.error('Error fetching availability settings:', error);
      return null;
    }

    if (!data) return null;

    return {
      id: data.id,
      clinicianId: data.clinician_id,
      timeZone: data.time_zone || 'America/Chicago',
      slotDuration: data.slot_duration,
      defaultSlotDuration: data.default_slot_duration,
      minDaysAhead: data.min_days_ahead,
      maxDaysAhead: data.max_days_ahead,
      minNoticeDays: data.min_notice_days,
      maxAdvanceDays: data.max_advance_days,
      bufferBetweenSlots: data.buffer_between_slots,
      earlyMorningHours: data.early_morning_hours,
      lateEveningHours: data.late_evening_hours,
      weekendAvailability: data.weekend_availability,
      allowRecurringScheduling: data.allow_recurring_scheduling,
      autoConfirm: data.auto_confirm,
      bookingInstructions: data.booking_instructions,
      timeGranularity: data.time_granularity,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error('Error in getSettingsForClinician:', error);
    return null;
  }
};

export const createAvailabilitySlot = async (
  clinicianId: string,
  slotData: {
    startTime: string;
    endTime: string;
    title: string;
    recurring: boolean;
  }
): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('availability_slots')
      .insert([
        {
          clinician_id: clinicianId,
          start_time: slotData.startTime,
          end_time: slotData.endTime,
          title: slotData.title,
          is_recurring: slotData.recurring,
          day_of_week: null // Set day_of_week to null for non-recurring slots
        }
      ])
      .select('id')
      .single();

    if (error) {
      console.error('Error creating availability slot:', error);
      return null;
    }

    return data?.id || null;
  } catch (error) {
    console.error('Error in createAvailabilitySlot:', error);
    return null;
  }
};

export const updateAvailabilitySlot = async (
  slotId: string,
  updates: {
    startTime?: string;
    endTime?: string;
    title?: string;
  }
): Promise<boolean> => {
  try {
    const updateData: {
      start_time?: string;
      end_time?: string;
      title?: string;
    } = {};

    if (updates.startTime) {
      updateData.start_time = updates.startTime;
    }
    if (updates.endTime) {
      updateData.end_time = updates.endTime;
    }
    if (updates.title) {
      updateData.title = updates.title;
    }

    const { error } = await supabase
      .from('availability_slots')
      .update(updateData)
      .eq('id', slotId);

    if (error) {
      console.error('Error updating availability slot:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateAvailabilitySlot:', error);
    return false;
  }
};

export const deleteAvailabilitySlot = async (slotId: string, isRecurring: boolean = false): Promise<boolean> => {
  try {
    if (isRecurring) {
      const { error } = await supabase
        .from('recurring_availability')
        .delete()
        .eq('id', slotId);

      if (error) {
        console.error('Error deleting recurring availability:', error);
        return false;
      }
    } else {
      const { error } = await supabase
        .from('availability_slots')
        .delete()
        .eq('id', slotId);

      if (error) {
        console.error('Error deleting availability slot:', error);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error in deleteAvailabilitySlot:', error);
    return false;
  }
};

export const updateSettings = async (
  clinicianId: string,
  settingsUpdate: Partial<AvailabilitySettings>
): Promise<AvailabilitySettings | null> => {
  try {
    const { data, error } = await supabase
      .from('availability_settings')
      .update(settingsUpdate)
      .eq('clinician_id', clinicianId)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating availability settings:', error);
      return null;
    }

    return data as AvailabilitySettings;
  } catch (error) {
    console.error('Error in updateSettings:', error);
    return null;
  }
};

export const getWeeklyAvailability = async (clinicianId: string): Promise<WeeklyAvailability> => {
  try {
    const { data, error } = await supabase
      .from('availability_slots')
      .select('*')
      .eq('clinician_id', clinicianId);

    if (error) {
      console.error('Error fetching weekly availability:', error);
      return createEmptyWeeklyAvailability();
    }

    const slots = (data || []).map(slot => ({
      id: slot.id,
      startTime: slot.start_time,
      endTime: slot.end_time,
      dayOfWeek: slot.day_of_week as DayOfWeek,
      isRecurring: slot.is_recurring || false
    }));

    // Group slots by day
    const weeklySlots = createEmptyWeeklyAvailability();
    slots.forEach(slot => {
      if (slot.dayOfWeek in weeklySlots) {
        weeklySlots[slot.dayOfWeek].push(slot);
      }
    });

    return weeklySlots;
  } catch (error) {
    console.error('Error in getWeeklyAvailability:', error);
    return createEmptyWeeklyAvailability();
  }
};
