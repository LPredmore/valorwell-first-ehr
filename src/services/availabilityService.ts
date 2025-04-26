
import { supabase } from '@/integrations/supabase/client';
import { TimeZoneService } from '@/utils/timeZoneService';
import { AvailabilitySettings, AvailabilitySlot, DayOfWeek, WeeklyAvailability } from '@/types/availability';
import { AvailabilityQueryService } from './AvailabilityQueryService';
import { AvailabilityMutationService } from './AvailabilityMutationService';
import { DateTime } from 'luxon';

/**
 * Service for managing availability settings and slots
 */
class AvailabilityService {
  /**
   * Get availability settings for a clinician
   */
  async getSettingsForClinician(clinicianId: string): Promise<AvailabilitySettings> {
    try {
      const { data, error } = await supabase
        .from('availability_settings')
        .select('*')
        .eq('clinician_id', clinicianId)
        .maybeSingle();
      
      if (error) throw error;
      
      if (!data) {
        // Create default settings if none exist
        const defaultSettings: AvailabilitySettings = {
          clinicianId,
          defaultSlotDuration: 60,
          minNoticeDays: 1,
          maxAdvanceDays: 30,
          timeZone: 'America/Chicago',
          slotDuration: 60,
          timeGranularity: 'hour',
          isActive: true
        };
        
        const { data: newData, error: createError } = await supabase
          .from('availability_settings')
          .insert(defaultSettings)
          .select()
          .single();
        
        if (createError) throw createError;
        
        return newData as AvailabilitySettings;
      }
      
      return data as AvailabilitySettings;
    } catch (error) {
      console.error('Error getting availability settings:', error);
      throw error;
    }
  }
  
  /**
   * Update availability settings for a clinician
   */
  async updateSettings(clinicianId: string, settings: Partial<AvailabilitySettings>): Promise<AvailabilitySettings> {
    try {
      const { data, error } = await supabase
        .from('availability_settings')
        .update(settings)
        .eq('clinician_id', clinicianId)
        .select()
        .single();
      
      if (error) throw error;
      
      return data as AvailabilitySettings;
    } catch (error) {
      console.error('Error updating availability settings:', error);
      throw error;
    }
  }
  
  /**
   * Get weekly availability for a clinician
   */
  async getWeeklyAvailabilityForClinician(clinicianId: string): Promise<WeeklyAvailability> {
    try {
      return await AvailabilityQueryService.getWeeklyAvailability(clinicianId);
    } catch (error) {
      console.error('Error getting weekly availability:', error);
      throw error;
    }
  }
  
  /**
   * Create an availability slot
   */
  async createAvailabilitySlot(
    clinicianId: string,
    dayOfWeek: DayOfWeek,
    startTime: string,
    endTime: string,
    isRecurring: boolean = true,
    recurrenceRule?: string,
    timeZone?: string
  ) {
    try {
      return await AvailabilityMutationService.createAvailabilitySlot(
        clinicianId,
        dayOfWeek,
        startTime,
        endTime,
        isRecurring,
        recurrenceRule,
        timeZone
      );
    } catch (error) {
      console.error('Error creating availability slot:', error);
      throw error;
    }
  }
  
  /**
   * Update an availability slot
   */
  async updateAvailabilitySlot(slotId: string, updates: Partial<AvailabilitySlot>) {
    try {
      return await AvailabilityMutationService.updateAvailabilitySlot(slotId, updates);
    } catch (error) {
      console.error('Error updating availability slot:', error);
      throw error;
    }
  }
  
  /**
   * Delete an availability slot
   */
  async deleteAvailabilitySlot(slotId: string) {
    try {
      return await AvailabilityMutationService.deleteAvailabilitySlot(slotId);
    } catch (error) {
      console.error('Error deleting availability slot:', error);
      throw error;
    }
  }
  
  /**
   * Calculate available time slots for a specific date
   */
  async calculateAvailableSlots(clinicianId: string, date: string) {
    try {
      const settings = await this.getSettingsForClinician(clinicianId);
      
      // For now, just use an empty array for existing appointments
      // In a real implementation, we would fetch existing appointments for the date
      const existingAppointments: any[] = [];
      
      // Return available slots based on settings and existing appointments
      return await AvailabilityQueryService.calculateAvailableSlots(
        settings,
        date,
        existingAppointments
      );
    } catch (error) {
      console.error('Error calculating available slots:', error);
      throw error;
    }
  }
}

export const availabilityService = new AvailabilityService();
