
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
      // First try to get existing settings
      const { data, error } = await supabase
        .from('availability_settings')
        .select('*')
        .eq('clinician_id', clinicianId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching availability settings:', error);
        throw error;
      }
      
      // If settings exist, return them
      if (data) {
        return {
          id: data.id,
          clinicianId: data.clinician_id,
          defaultSlotDuration: data.default_slot_duration || 60,
          slotDuration: data.slot_duration || 60,
          minNoticeDays: data.min_notice_days || 1,
          maxAdvanceDays: data.max_advance_days || 30,
          timeZone: data.time_zone || 'America/Chicago',
          timeGranularity: data.time_granularity as 'hour' | 'halfhour' | 'quarter' || 'hour',
          isActive: data.is_active !== false
        };
      }
      
      // If settings don't exist, get clinician's timezone and create default settings
      const { data: clinicianData, error: clinicianError } = await supabase
        .from('clinicians')
        .select('clinician_timezone')
        .eq('id', clinicianId)
        .single();
      
      if (clinicianError) {
        console.error('Error fetching clinician data:', clinicianError);
      }
      
      const timeZone = clinicianData?.clinician_timezone?.length > 0 
        ? clinicianData.clinician_timezone[0] 
        : 'America/Chicago';
      
      // Create default settings
      const defaultSettings: AvailabilitySettings = {
        clinicianId,
        defaultSlotDuration: 60,
        slotDuration: 60,
        minNoticeDays: 1,
        maxAdvanceDays: 30,
        timeZone: TimeZoneService.ensureIANATimeZone(timeZone),
        timeGranularity: 'hour',
        isActive: true
      };
      
      // Save default settings to database
      const { data: newSettings, error: createError } = await supabase
        .from('availability_settings')
        .insert({
          clinician_id: clinicianId,
          default_slot_duration: defaultSettings.defaultSlotDuration,
          slot_duration: defaultSettings.slotDuration,
          min_notice_days: defaultSettings.minNoticeDays,
          max_advance_days: defaultSettings.maxAdvanceDays,
          time_zone: defaultSettings.timeZone,
          time_granularity: defaultSettings.timeGranularity,
          is_active: defaultSettings.isActive
        })
        .select()
        .single();
      
      if (createError) {
        console.error('Error creating availability settings:', createError);
        throw createError;
      }
      
      return {
        ...defaultSettings,
        id: newSettings.id
      };
    } catch (error) {
      console.error('Error in getSettingsForClinician:', error);
      throw error;
    }
  }
  
  /**
   * Update availability settings for a clinician
   */
  async updateSettings(clinicianId: string, settings: Partial<AvailabilitySettings>): Promise<AvailabilitySettings> {
    try {
      // First check if settings exist
      const existingSettings = await this.getSettingsForClinician(clinicianId);
      
      // Prepare update data
      const updateData: Record<string, any> = {};
      if (settings.defaultSlotDuration !== undefined) updateData.default_slot_duration = settings.defaultSlotDuration;
      if (settings.slotDuration !== undefined) updateData.slot_duration = settings.slotDuration;
      if (settings.minNoticeDays !== undefined) updateData.min_notice_days = settings.minNoticeDays;
      if (settings.maxAdvanceDays !== undefined) updateData.max_advance_days = settings.maxAdvanceDays;
      if (settings.timeZone !== undefined) updateData.time_zone = settings.timeZone;
      if (settings.timeGranularity !== undefined) updateData.time_granularity = settings.timeGranularity;
      if (settings.isActive !== undefined) updateData.is_active = settings.isActive;
      
      // Update settings
      const { data, error } = await supabase
        .from('availability_settings')
        .update(updateData)
        .eq('id', existingSettings.id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating availability settings:', error);
        throw error;
      }
      
      // Return updated settings
      return {
        id: data.id,
        clinicianId: data.clinician_id,
        defaultSlotDuration: data.default_slot_duration,
        slotDuration: data.slot_duration,
        minNoticeDays: data.min_notice_days,
        maxAdvanceDays: data.max_advance_days,
        timeZone: data.time_zone,
        timeGranularity: data.time_granularity as 'hour' | 'halfhour' | 'quarter',
        isActive: data.is_active
      };
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
      // Query for recurring availability blocks
      const { data, error } = await supabase
        .from('availability_blocks')
        .select(`
          id,
          clinician_id,
          start_time,
          end_time,
          availability_type,
          time_zone,
          day_of_week
        `)
        .eq('clinician_id', clinicianId)
        .eq('availability_type', 'recurring')
        .eq('is_active', true);
      
      if (error) {
        console.error('Error fetching weekly availability:', error);
        throw error;
      }
      
      // Initialize weekly availability structure
      const weeklyAvailability: WeeklyAvailability = {
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
        saturday: [],
        sunday: []
      };
      
      // Process each availability block
      data?.forEach(block => {
        // Map numeric day of week to string
        const daysOfWeek: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayIndex = typeof block.day_of_week === 'number' ? block.day_of_week % 7 : 0;
        const day = daysOfWeek[dayIndex];
        
        // Extract time from datetime strings
        const startTime = block.start_time.substring(11, 16); // HH:MM format
        const endTime = block.end_time.substring(11, 16); // HH:MM format
        
        // Add to appropriate day
        weeklyAvailability[day].push({
          id: block.id,
          startTime,
          endTime,
          dayOfWeek: day,
          clinicianId: block.clinician_id,
          isRecurring: true
        });
      });
      
      return weeklyAvailability;
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
      // Get the clinician's timezone if not provided
      let slotTimeZone = timeZone;
      
      if (!slotTimeZone) {
        const { data } = await supabase
          .from('clinicians')
          .select('clinician_timezone')
          .eq('id', clinicianId)
          .maybeSingle();
          
        slotTimeZone = data?.clinician_timezone?.length > 0 
          ? data.clinician_timezone[0] 
          : 'America/Chicago';
      }
      
      // Validate timezone before proceeding
      const validatedTimeZone = TimeZoneService.ensureIANATimeZone(slotTimeZone);
      console.log('[AvailabilityService] Creating slot with validated timezone:', validatedTimeZone);
      
      // Map days of week to numbers for database storage
      const dayMap: Record<DayOfWeek, number> = {
        'sunday': 0, 
        'monday': 1, 
        'tuesday': 2, 
        'wednesday': 3, 
        'thursday': 4, 
        'friday': 5, 
        'saturday': 6
      };
      
      let dateStr: string | undefined;
      const dayOfWeekNum = dayMap[dayOfWeek];
      
      if (isRecurring) {
        // For recurring slots, we need a reference date to create the correct UTC times
        // We'll use the next occurrence of this day of the week
        const now = DateTime.now().setZone(validatedTimeZone);
        const daysToAdd = (dayOfWeekNum + 7 - now.weekday) % 7;
        dateStr = now.plus({ days: daysToAdd }).toISODate() as string;
      } else if (specificDate) {
        // For single slots, use the provided specific date
        if (specificDate instanceof DateTime) {
          dateStr = specificDate.toISODate() as string;
        } else if (specificDate instanceof Date) {
          dateStr = DateTime.fromJSDate(specificDate).toISODate() as string;
        } else {
          dateStr = specificDate;
        }
      } else {
        // Default to today if no specific date provided for non-recurring slots
        dateStr = DateTime.now().setZone(validatedTimeZone).toISODate() as string;
      }
      
      // Create start and end DateTime objects
      const startDt = TimeZoneService.createDateTime(dateStr, startTime, validatedTimeZone);
      const endDt = TimeZoneService.createDateTime(dateStr, endTime, validatedTimeZone);
      
      console.log('[AvailabilityService] Creating availability with:', {
        startDateTime: startDt.toISO(),
        endDateTime: endDt.toISO(),
        timeZone: validatedTimeZone,
        isRecurring,
        dayOfWeek: isRecurring ? dayOfWeekNum : undefined
      });
      
      // Convert to UTC for storage
      const startUtc = startDt.toUTC().toISO();
      const endUtc = endDt.toUTC().toISO();
      
      if (!startUtc || !endUtc) {
        throw new Error('Failed to convert times to UTC');
      }
      
      // Create availability block in database
      const { data, error } = await supabase
        .from('availability_blocks')
        .insert({
          clinician_id: clinicianId,
          start_time: startUtc,
          end_time: endUtc,
          availability_type: isRecurring ? 'recurring' : 'single',
          day_of_week: isRecurring ? dayOfWeekNum : null,
          specific_date: !isRecurring ? dateStr : null,
          is_active: true,
          time_zone: validatedTimeZone
        })
        .select()
        .single();
        
      if (error) {
        console.error('[AvailabilityService] Error creating availability:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('[AvailabilityService] Error creating availability slot:', error);
      throw CalendarErrorHandler.formatError(error);
    }
  }
  
  /**
   * Update an availability slot
   */
  async updateAvailabilitySlot(slotId: string, updates: Partial<AvailabilitySlot>) {
    try {
      // Create update object with correct property names for database
      const updateData: Record<string, any> = {};
      
      if (updates.startTime) {
        // Need to get the original record to preserve date part
        const { data: original } = await supabase
          .from('availability_blocks')
          .select('start_time, time_zone')
          .eq('id', slotId)
          .single();
          
        if (original) {
          const timezone = updates.timezone || original.time_zone || 'UTC';
          const dateStr = original.start_time.substring(0, 10); // YYYY-MM-DD
          const startDt = TimeZoneService.createDateTime(dateStr, updates.startTime, timezone);
          updateData.start_time = startDt.toUTC().toISO();
        }
      }
      
      if (updates.endTime) {
        // Need to get the original record to preserve date part
        const { data: original } = await supabase
          .from('availability_blocks')
          .select('end_time, time_zone')
          .eq('id', slotId)
          .single();
          
        if (original) {
          const timezone = updates.timezone || original.time_zone || 'UTC';
          const dateStr = original.end_time.substring(0, 10); // YYYY-MM-DD
          const endDt = TimeZoneService.createDateTime(dateStr, updates.endTime, timezone);
          updateData.end_time = endDt.toUTC().toISO();
        }
      }
      
      if (updates.dayOfWeek !== undefined) {
        const dayMap: Record<string, number> = {
          'sunday': 0, 
          'monday': 1, 
          'tuesday': 2, 
          'wednesday': 3, 
          'thursday': 4, 
          'friday': 5, 
          'saturday': 6
        };
        
        updateData.day_of_week = typeof updates.dayOfWeek === 'string' 
          ? dayMap[updates.dayOfWeek.toLowerCase()] 
          : updates.dayOfWeek;
      }
      
      if (updates.specificDate) {
        updateData.specific_date = updates.specificDate;
      }
      
      if (updates.timezone) {
        updateData.time_zone = updates.timezone;
      }
      
      // Update the record
      const { data, error } = await supabase
        .from('availability_blocks')
        .update(updateData)
        .eq('id', slotId)
        .select()
        .single();
        
      if (error) {
        console.error('[AvailabilityService] Error updating availability:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('[AvailabilityService] Error updating availability slot:', error);
      throw error;
    }
  }
  
  /**
   * Delete an availability slot
   */
  async deleteAvailabilitySlot(slotId: string) {
    try {
      const { data, error } = await supabase
        .from('availability_blocks')
        .update({ is_active: false })
        .eq('id', slotId)
        .select();
        
      if (error) {
        console.error('[AvailabilityService] Error deleting availability:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('[AvailabilityService] Error deleting availability slot:', error);
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
      console.error('[AvailabilityService] Error calculating available slots:', error);
      throw error;
    }
  }
}

export const availabilityService = new AvailabilityService();
