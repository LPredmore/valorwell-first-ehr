// Add this at the top of the file to fix the PostgrestFilterBuilder to Promise conversion
import { PostgrestFilterBuilder } from '@supabase/postgrest-js';
import { AvailabilitySlot, AvailabilityEvent, WeeklyAvailability } from '@/types/appointment';
import { supabase } from '@/integrations/supabase/client';

// Define the interface for the AvailabilityEvent if not already defined
interface AvailabilityEvent {
  id: string;
  clinician_id: string;
  start_time: string;
  end_time: string;
  time_zone?: string;
  dayOfWeek?: string; 
  isRecurring?: boolean;
  excludeDates?: string[];
}

export class AvailabilityQueryService {

  /**
   * Get all availability settings for a clinician
   * @param clinicianId The clinician ID
   * @returns Availability settings object
   */
  public static async getAvailabilitySettings(clinicianId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('availability_settings')
        .select('*')
        .eq('clinicianId', clinicianId)
        .single();

      if (error) {
        console.error('Error fetching availability settings:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in getAvailabilitySettings:', error);
      throw error;
    }
  }

  /**
   * Get all availability slots for a clinician
   * @param clinicianId The clinician ID
   * @returns Array of availability slot objects
   */
  public static async getAvailabilitySlots(clinicianId: string): Promise<AvailabilitySlot[]> {
    try {
      const { data, error } = await supabase
        .from('availability_slots')
        .select('*')
        .eq('clinicianId', clinicianId);

      if (error) {
        console.error('Error fetching availability slots:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAvailabilitySlots:', error);
      throw error;
    }
  }

  /**
   * Transform a database calendar event into an AvailabilitySlot
   */
  private static transformDatabaseEventToAvailabilityEvent(event: any): AvailabilitySlot {
    // Check if this is already in the format we need
    if (event.dayOfWeek || event.day_of_week) {
      return {
        id: event.id,
        startTime: event.start_time || event.startTime,
        endTime: event.end_time || event.endTime,
        dayOfWeek: event.dayOfWeek || event.day_of_week,
        isRecurring: event.is_recurring || event.isRecurring || false,
        excludeDates: event.exclude_dates || event.excludeDates || []
      };
    }
    
    // Transform a calendar_events record into an AvailabilitySlot
    const startDate = new Date(event.start_time);
    const dayOfWeek = startDate.toLocaleDateString('en-US', { weekday: 'long' });
    
    return {
      id: event.id,
      startTime: event.start_time,
      endTime: event.end_time,
      dayOfWeek,
      isRecurring: event.availability_type === 'recurring',
      excludeDates: []
    };
  }

  /**
   * Get weekly availability for a clinician from calendar_events
   */
  public static async getWeeklyAvailability(
    clinicianId: string
  ): Promise<WeeklyAvailability> {
    console.log(`[AvailabilityQueryService] Getting weekly availability for clinician: ${clinicianId}`);
    
    try {
      const { data: availabilityEvents, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('clinician_id', clinicianId)
        .eq('event_type', 'availability')
        .eq('is_active', true)
        .then(result => ({ data: result.data || [], error: result.error }));
        
      if (error) {
        console.error('[AvailabilityQueryService] Error fetching availability:', error);
        throw error;
      }
      
      console.log(`[AvailabilityQueryService] Retrieved ${availabilityEvents.length} availability events`);
      
      // Process events into weekly slots
      const weeklySlots: WeeklyAvailability = {
        Sunday: [],
        Monday: [],
        Tuesday: [],
        Wednesday: [],
        Thursday: [],
        Friday: [],
        Saturday: []
      };
      
      // Transform database events to availability slots
      for (const event of availabilityEvents) {
        const availabilitySlot = this.transformDatabaseEventToAvailabilityEvent(event);
        if (availabilitySlot.dayOfWeek && weeklySlots[availabilitySlot.dayOfWeek]) {
          weeklySlots[availabilitySlot.dayOfWeek].push(availabilitySlot);
        }
      }
      
      return weeklySlots;
    } catch (error) {
      console.error('[AvailabilityQueryService] Error in getWeeklyAvailability:', error);
      throw error;
    }
  }

  /**
   * Get a single availability slot by ID
   * @param slotId The ID of the availability slot
   * @returns Availability slot object
   */
  public static async getAvailabilitySlotById(slotId: string): Promise<AvailabilitySlot | null> {
    try {
      const { data, error } = await supabase
        .from('availability_slots')
        .select('*')
        .eq('id', slotId)
        .single();

      if (error) {
        console.error('Error fetching availability slot:', error);
        return null;
      }

      return data || null;
    } catch (error) {
      console.error('Error in getAvailabilitySlotById:', error);
      return null;
    }
  }

  /**
   * Create a new availability slot
   * @param slot The availability slot object to create
   * @returns The created availability slot object
   */
  public static async createAvailabilitySlot(slot: AvailabilitySlot): Promise<AvailabilitySlot | null> {
    try {
      const { data, error } = await supabase
        .from('availability_slots')
        .insert([slot])
        .select()
        .single();

      if (error) {
        console.error('Error creating availability slot:', error);
        return null;
      }

      return data || null;
    } catch (error) {
      console.error('Error in createAvailabilitySlot:', error);
      return null;
    }
  }

  /**
   * Update an existing availability slot
   * @param slotId The ID of the availability slot to update
   * @param slot The updated availability slot object
   * @returns The updated availability slot object
   */
  public static async updateAvailabilitySlot(slotId: string, slot: AvailabilitySlot): Promise<AvailabilitySlot | null> {
    try {
      const { data, error } = await supabase
        .from('availability_slots')
        .update(slot)
        .eq('id', slotId)
        .select()
        .single();

      if (error) {
        console.error('Error updating availability slot:', error);
        return null;
      }

      return data || null;
    } catch (error) {
      console.error('Error in updateAvailabilitySlot:', error);
      return null;
    }
  }

  /**
   * Delete an availability slot
   * @param slotId The ID of the availability slot to delete
   * @returns True if the slot was successfully deleted, false otherwise
   */
  public static async deleteAvailabilitySlot(slotId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('availability_slots')
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
}
