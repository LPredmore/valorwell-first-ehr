
import { supabase } from '@/integrations/supabase/client';
import { AvailabilitySettings } from '@/types/availability';
import { TimeZoneService } from '@/utils/timeZoneService';
import { CalendarErrorHandler } from './calendar/CalendarErrorHandler';

export class AvailabilitySettingService {
  static async getSettings(clinicianId: string): Promise<AvailabilitySettings | null> {
    try {
      console.log('[AvailabilitySettingService] Fetching settings for clinician:', clinicianId);
      
      const { data, error } = await supabase
        .from('availability_settings')
        .select('*')
        .eq('clinician_id', clinicianId)
        .maybeSingle();
      
      if (error) throw error;
      
      if (!data) {
        console.log('[AvailabilitySettingService] No settings found, creating defaults');
        return this.createDefaultSettings(clinicianId);
      }

      // Map snake_case database columns to camelCase for our application
      return {
        id: data.id,
        clinicianId: data.clinician_id,
        defaultSlotDuration: data.default_slot_duration,
        minNoticeDays: data.min_notice_days,
        maxAdvanceDays: data.max_advance_days,
        timeZone: TimeZoneService.ensureIANATimeZone(data.time_zone),
        slotDuration: data.slot_duration,
        timeGranularity: data.time_granularity || 'hour',
        isActive: data.is_active
      };
    } catch (error) {
      console.error('[AvailabilitySettingService] Error:', error);
      throw CalendarErrorHandler.formatError(error);
    }
  }

  static async updateSettings(
    clinicianId: string, 
    updates: Partial<AvailabilitySettings>
  ): Promise<AvailabilitySettings> {
    try {
      // Convert camelCase object to snake_case for database
      const dbUpdates: Record<string, any> = {
        updated_at: new Date().toISOString()
      };
      
      if (updates.defaultSlotDuration !== undefined) {
        dbUpdates.default_slot_duration = updates.defaultSlotDuration;
      }
      if (updates.minNoticeDays !== undefined) {
        dbUpdates.min_notice_days = updates.minNoticeDays;
      }
      if (updates.maxAdvanceDays !== undefined) {
        dbUpdates.max_advance_days = updates.maxAdvanceDays;
      }
      if (updates.timeZone !== undefined) {
        dbUpdates.time_zone = TimeZoneService.ensureIANATimeZone(updates.timeZone);
      }
      if (updates.slotDuration !== undefined) {
        dbUpdates.slot_duration = updates.slotDuration;
      }
      if (updates.timeGranularity !== undefined) {
        dbUpdates.time_granularity = updates.timeGranularity;
      }
      if (updates.isActive !== undefined) {
        dbUpdates.is_active = updates.isActive;
      }

      const { data, error } = await supabase
        .from('availability_settings')
        .update(dbUpdates)
        .eq('clinician_id', clinicianId)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        clinicianId: data.clinician_id,
        defaultSlotDuration: data.default_slot_duration,
        minNoticeDays: data.min_notice_days,
        maxAdvanceDays: data.max_advance_days,
        timeZone: TimeZoneService.ensureIANATimeZone(data.time_zone),
        slotDuration: data.slot_duration,
        timeGranularity: data.time_granularity,
        isActive: data.is_active
      };
    } catch (error) {
      console.error('[AvailabilitySettingService] Error updating settings:', error);
      throw CalendarErrorHandler.formatError(error);
    }
  }

  private static async createDefaultSettings(
    clinicianId: string
  ): Promise<AvailabilitySettings> {
    const defaultSettings: Omit<AvailabilitySettings, 'id'> = {
      clinicianId,
      defaultSlotDuration: 60,
      minNoticeDays: 1,
      maxAdvanceDays: 30,
      timeZone: 'America/Chicago',
      slotDuration: 60,
      timeGranularity: 'hour',
      isActive: true
    };

    try {
      const { data, error } = await supabase
        .from('availability_settings')
        .insert({
          clinician_id: clinicianId,
          default_slot_duration: defaultSettings.defaultSlotDuration,
          min_notice_days: defaultSettings.minNoticeDays,
          max_advance_days: defaultSettings.maxAdvanceDays,
          time_zone: defaultSettings.timeZone,
          slot_duration: defaultSettings.slotDuration,
          time_granularity: defaultSettings.timeGranularity,
          is_active: defaultSettings.isActive
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        ...defaultSettings
      };
    } catch (error) {
      console.error('[AvailabilitySettingService] Error creating default settings:', error);
      throw CalendarErrorHandler.formatError(error);
    }
  }
}
