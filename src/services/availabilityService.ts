
import { supabase } from '@/integrations/supabase/client';
import { AvailabilitySettings, AvailabilitySlot, WeeklyAvailability } from '@/types/appointment';
import { CalendarEvent, CalendarEventType } from '@/types/calendar';
import { DateTime } from 'luxon';

export class AvailabilityService {
  static async getSettings(clinicianId: string): Promise<AvailabilitySettings | null> {
    // First try to get settings from the clinicians table
    const { data: clinician, error: clinicianError } = await supabase
      .from('clinicians')
      .select(`
        clinician_min_notice_days,
        clinician_max_advance_days,
        clinician_time_zone
      `)
      .eq('id', clinicianId)
      .single();

    if (clinicianError) {
      console.error('Error fetching clinician settings:', clinicianError);
      return null;
    }

    return {
      id: clinicianId,
      clinician_id: clinicianId,
      timezone: clinician.clinician_time_zone || 'America/Chicago',
      min_notice_hours: (clinician.clinician_min_notice_days || 1) * 24,
      max_advance_days: clinician.clinician_max_advance_days || 30,
      is_active: true // Default to active
    };
  }

  static async getAvailabilitySlots(
    clinicianId: string,
    startDate: string,
    endDate: string
  ): Promise<AvailabilitySlot[]> {
    const { data: blocks, error } = await supabase
      .from('availability_blocks')
      .select('*')
      .eq('clinician_id', clinicianId)
      .gte('start_at', startDate)
      .lte('end_at', endDate)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching availability slots:', error);
      return [];
    }

    return blocks.map(block => ({
      id: block.id,
      start_at: block.start_at,
      end_at: block.end_at,
      is_recurring: !!block.recurring_pattern
    }));
  }

  static async createAvailabilitySlot(
    clinicianId: string,
    slot: {
      start_at: string;
      end_at: string;
      recurring?: boolean;
      recurrenceRule?: string;
    }
  ): Promise<string | null> {
    try {
      const recurringPattern = slot.recurring && slot.recurrenceRule ? 
        { rrule: slot.recurrenceRule } : null;
      
      const { data, error } = await supabase
        .from('availability_blocks')
        .insert({
          clinician_id: clinicianId,
          start_at: slot.start_at,
          end_at: slot.end_at,
          is_active: true,
          recurring_pattern: recurringPattern
        })
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
  }

  static async updateAvailabilitySlot(
    slotId: string,
    updates: {
      start_at?: string;
      end_at?: string;
    },
    updateRecurrence: boolean = false
  ): Promise<boolean> {
    try {
      const updateData: any = {};
      if (updates.start_at) updateData.start_at = updates.start_at;
      if (updates.end_at) updateData.end_at = updates.end_at;

      // Set is_active to false when updateRecurrence is false and no updates are provided
      // This allows us to use this method for soft-deletes
      if (Object.keys(updates).length === 0 && updateRecurrence === false) {
        updateData.is_active = false;
      }

      const { error } = await supabase
        .from('availability_blocks')
        .update(updateData)
        .eq('id', slotId);

      if (error) {
        console.error('Error updating availability slot:', error);
        return false;
      }

      if (updateRecurrence) {
        // If recurring_pattern exists, apply updates to all recurring instances
        const { data: blockData, error: blockError } = await supabase
          .from('availability_blocks')
          .select('recurring_pattern')
          .eq('id', slotId)
          .single();

        if (blockError || !blockData?.recurring_pattern) {
          console.log('Not a recurring event or error fetching recurrence:', blockError);
          return !blockError;
        }

        // Here you would implement logic to update all recurring instances
        // This would depend on how your recurring events are structured
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
        const { data: blockData, error: blockError } = await supabase
          .from('availability_blocks')
          .select('recurring_pattern')
          .eq('id', slotId)
          .single();

        if (blockError) {
          console.error('Error checking recurrence:', blockError);
          return false;
        }

        if (blockData?.recurring_pattern) {
          // If this is a recurring block, you need to implement logic to 
          // delete all recurring instances based on your specific implementation
          // For now, we'll just delete the specific block
        }
      }

      const { error } = await supabase
        .from('availability_blocks')
        .delete()
        .eq('id', slotId);

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
      // Get availability blocks for this clinician
      const { data: blocks, error } = await supabase
        .from('availability_blocks')
        .select('*')
        .eq('clinician_id', clinicianId)
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

      blocks.forEach(block => {
        const startDateTime = DateTime.fromISO(block.start_at);
        const endDateTime = DateTime.fromISO(block.end_at);
        const dayOfWeek = startDateTime.toFormat('EEEE').toLowerCase();
        
        if (dayOfWeek in weeklyAvailability) {
          weeklyAvailability[dayOfWeek].push({
            id: block.id,  // Include the id field
            start_at: block.start_at,
            end_at: block.end_at,
            is_recurring: !!block.recurring_pattern
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
   */
  static async calculateAvailableSlots(clinicianId: string, date: string): Promise<Array<{
    start: string;
    end: string;
    slotId?: string; // Ref to the availability slot (availability_blocks.id)
    isRecurring?: boolean;
  }>> {
    try {
      // Get clinician settings
      const settings = await this.getSettings(clinicianId);
      if (!settings) {
        console.error('Could not fetch clinician settings');
        return [];
      }

      const timezone = settings.timezone || 'America/Chicago';
      const defaultSlotDuration = 60; // 60 minutes by default
      const minNoticeHours = settings.min_notice_hours || 24;
      const maxAdvanceDays = settings.max_advance_days || 30;

      const startOfDay = DateTime.fromISO(date, { zone: timezone }).startOf('day');
      const endOfDay = DateTime.fromISO(date, { zone: timezone }).endOf('day');

      // Fetch all active availability slots for that day
      const { data: slots, error: slotsError } = await supabase
        .from('availability_blocks')
        .select('*')
        .eq('clinician_id', clinicianId)
        .eq('is_active', true)
        .lte('start_at', endOfDay.toISO())
        .gte('end_at', startOfDay.toISO());

      if (slotsError || !slots) {
        console.error('Error fetching availability slots:', slotsError);
        return [];
      }

      // Fetch appointments blocking the time
      const { data: appointments, error: apptError } = await supabase
        .from('appointments')
        .select('start_at, end_at, status')
        .eq('clinician_id', clinicianId)
        .neq('status', 'cancelled')
        .gte('start_at', startOfDay.toISO())
        .lte('end_at', endOfDay.toISO());

      if (apptError || !appointments) {
        console.error('Error fetching appointments:', apptError);
        return [];
      }

      // For each slot, break into bookable intervals (by default slot duration)
      let availableSlots: Array<{ start: string; end: string; slotId?: string; isRecurring?: boolean }> = [];
      
      for (const slot of slots) {
        const slotStartDT = DateTime.fromISO(slot.start_at, { zone: timezone });
        const slotEndDT = DateTime.fromISO(slot.end_at, { zone: timezone });
        const durationMin = defaultSlotDuration;

        for (let t = slotStartDT; t.plus({ minutes: durationMin }) <= slotEndDT; t = t.plus({ minutes: durationMin })) {
          const slotBegin = t;
          const slotFinish = t.plus({ minutes: durationMin });
          
          // Check against min_notice_hours
          const now = DateTime.now().setZone(timezone);
          if (slotBegin.diff(now, 'hours').hours < minNoticeHours) continue;
          
          // Check against max_advance_days
          if (slotBegin.diff(now, 'days').days > maxAdvanceDays) continue;
          
          // Check against appointments (conflict)
          const overlaps = appointments.some(a => {
            return (
              (slotBegin < DateTime.fromISO(a.end_at, { zone: timezone })) &&
              (slotFinish > DateTime.fromISO(a.start_at, { zone: timezone }))
            );
          });
          
          if (!overlaps) {
            availableSlots.push({
              start: slotBegin.toISO(),
              end: slotFinish.toISO(),
              slotId: slot.id,
              isRecurring: !!slot.recurring_pattern
            });
          }
        }
      }

      return availableSlots;
    } catch (error) {
      console.error('Error calculating available slots:', error);
      return [];
    }
  }

  /**
   * Globally enable or disable clinician availability (for all slots)
   */
  static async toggleAvailabilityActive(clinicianId: string, isActive: boolean): Promise<boolean> {
    try {
      // Update all slots for this clinician
      const { error } = await supabase
        .from('availability_blocks')
        .update({ is_active: isActive })
        .eq('clinician_id', clinicianId);
        
      if (error) {
        console.error("Error toggling availability:", error);
        return false;
      }
      return true;
    } catch (error) {
      console.error("Error toggling availability:", error);
      return false;
    }
  }
}
