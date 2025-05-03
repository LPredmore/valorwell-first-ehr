import { supabase } from '@/integrations/supabase/client';
import { TimeZoneService } from '@/utils/timezone';
import { AvailabilitySettings, AvailabilitySlot, DayOfWeek, WeeklyAvailability } from '@/types/availability';
import { AvailabilityQueryService } from './AvailabilityQueryService';
import { AvailabilityMutationService } from './AvailabilityMutationService';
import { CalendarErrorHandler } from './calendar/CalendarErrorHandler';
import { AvailabilitySettingService } from './AvailabilitySettingService';
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
      return await AvailabilitySettingService.getSettings(clinicianId);
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
      return await AvailabilitySettingService.updateSettings(clinicianId, settings);
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
      // The AvailabilityQueryService now returns the correct type
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
    timeZone?: string,
    specificDate?: string | Date | DateTime
  ) {
    try {
      // Validate timezone before proceeding
      const validatedTimeZone = TimeZoneService.ensureIANATimeZone(timeZone || 'UTC');
      console.log('[AvailabilityService] Creating slot with validated timezone:', validatedTimeZone);

      // Convert specificDate to string if it's a DateTime or Date object
      let dateString: string | undefined;
      if (specificDate) {
        if (specificDate instanceof DateTime) {
          dateString = specificDate.toISODate() as string;
        } else if (specificDate instanceof Date) {
          dateString = DateTime.fromJSDate(specificDate).toISODate() as string;
        } else {
          dateString = specificDate;
        }
      }

      // Choose the right method based on whether it's recurring or not
      if (isRecurring) {
        return await AvailabilityMutationService.createRecurringAvailability(
          clinicianId,
          dayOfWeek,
          startTime,
          endTime,
          recurrenceRule,
          validatedTimeZone
        );
      } else {
        return await AvailabilityMutationService.createSingleAvailability(
          clinicianId,
          dateString || new Date().toISOString().split('T')[0],
          startTime,
          endTime,
          validatedTimeZone
        );
      }
    } catch (error) {
      console.error('Error creating availability slot:', error);
      throw CalendarErrorHandler.formatError(error);
    }
  }
  
  /**
   * Update an availability slot
   */
  async updateAvailabilitySlot(slotId: string, updates: Partial<AvailabilitySlot>) {
    try {
      // Use updateAvailability method if updateAvailabilitySlot is not available
      return await AvailabilityMutationService.updateAvailability(slotId, updates);
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
      // Use deleteAvailability method if deleteAvailabilitySlot is not available
      return await AvailabilityMutationService.deleteAvailability(slotId);
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
