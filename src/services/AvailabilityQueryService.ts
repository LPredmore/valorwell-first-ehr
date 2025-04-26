
// Update the imports to use proper types
import { supabase } from '@/integrations/supabase/client';
import { AvailabilitySettings, AvailabilitySlot, DayOfWeek, WeeklyAvailability, TimeSlot } from '@/types/availability';
import { createEmptyWeeklyAvailability } from '@/utils/availabilityUtils';
import { TimeZoneService } from '@/utils/timeZoneService';
import { DateTime } from 'luxon';

/**
 * Service for querying availability data from the database
 */
export class AvailabilityQueryService {
  /**
   * Get weekly availability for a clinician
   * @param clinicianId Clinician ID to get availability for
   * @returns Weekly availability object
   */
  static async getWeeklyAvailability(clinicianId: string): Promise<WeeklyAvailability> {
    try {
      console.log('Fetching weekly availability for clinician:', clinicianId);
      
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('clinician_id', clinicianId)
        .eq('event_type', 'availability')
        .eq('is_active', true);
      
      if (error) throw error;
      
      const weeklyAvailability = createEmptyWeeklyAvailability();
      
      // Process calendar events into weekly availability slots
      for (const event of data || []) {
        try {
          const startDt = DateTime.fromISO(event.start_time);
          const endDt = DateTime.fromISO(event.end_time);
          
          if (!startDt.isValid || !endDt.isValid) {
            console.error('Invalid date in availability event:', event);
            continue;
          }
          
          const day = startDt.weekdayLong.toLowerCase() as DayOfWeek;
          const slot: AvailabilitySlot = {
            id: event.id,
            clinicianId: event.clinician_id,
            dayOfWeek: day,
            startTime: startDt.toFormat('HH:mm'),
            endTime: endDt.toFormat('HH:mm'),
            isRecurring: event.availability_type === 'recurring',
            timeZone: 'UTC' // Default to UTC as the database stores in UTC
          };
          
          weeklyAvailability[day].push(slot);
        } catch (slotError) {
          console.error('Error processing availability slot:', slotError);
        }
      }
      
      return weeklyAvailability;
    } catch (error) {
      console.error('Error getting weekly availability:', error);
      throw error;
    }
  }
  
  /**
   * Calculate available appointment slots for a specific date
   * @param settings Availability settings to use
   * @param date Date to calculate slots for
   * @param existingAppointments Array of existing appointments to avoid
   * @returns Array of available time slots
   */
  static async calculateAvailableSlots(
    settings: AvailabilitySettings,
    date: string,
    existingAppointments: any[]
  ): Promise<TimeSlot[]> {
    try {
      const { timeGranularity, slotDuration = 60, defaultSlotDuration } = settings;
      
      // Determine time slot interval in minutes
      let intervalMinutes = 60; // Default to hour
      
      if (timeGranularity === 'quarter') {
        intervalMinutes = 15;
      } else if (timeGranularity === 'halfhour') {
        intervalMinutes = 30;
      }
      
      // Get actual slot duration (use default if not specified)
      const actualSlotDuration = slotDuration || defaultSlotDuration || 60;
      
      // Based on the date, determine day of week and fetch clinician availability
      const dateObj = DateTime.fromISO(date);
      const dayOfWeek = dateObj.weekdayLong.toLowerCase() as DayOfWeek;
      
      // Get clinician weekly availability
      // Here we would typically filter by clinicianId but we already have settings
      const availability = await this.getWeeklyAvailability(settings.clinicianId);
      
      // Get availability blocks for the specific day
      const dayAvailability = availability[dayOfWeek] || [];
      
      // Available slots to return
      const availableSlots: TimeSlot[] = [];
      
      // For each availability block on this day
      for (const block of dayAvailability) {
        // Convert times to minutes since midnight for easier calculations
        const blockStart = this.timeToMinutes(block.startTime);
        const blockEnd = this.timeToMinutes(block.endTime);
        
        // Step through the block in interval increments
        for (let time = blockStart; time + actualSlotDuration <= blockEnd; time += intervalMinutes) {
          const slotStartTime = this.minutesToTime(time);
          const slotEndTime = this.minutesToTime(time + actualSlotDuration);
          
          // Check if this slot overlaps with any existing appointments
          const isOverlapping = existingAppointments.some(appt => {
            const apptStart = this.timeToMinutes(appt.startTime);
            const apptEnd = this.timeToMinutes(appt.endTime);
            return (time < apptEnd && time + actualSlotDuration > apptStart);
          });
          
          if (!isOverlapping) {
            availableSlots.push({
              start: slotStartTime,
              end: slotEndTime,
              startTime: slotStartTime,
              endTime: slotEndTime
            });
          }
        }
      }
      
      return availableSlots;
      
    } catch (error) {
      console.error('Error calculating available slots:', error);
      throw error;
    }
  }
  
  /**
   * Convert time string to minutes since midnight
   * @param time Time string in format HH:MM
   * @returns Minutes since midnight
   */
  private static timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
  
  /**
   * Convert minutes since midnight to time string
   * @param minutes Minutes since midnight
   * @returns Time string in format HH:MM
   */
  private static minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  static mapRawSlotToAvailabilitySlot(raw: any): AvailabilitySlot {
    return {
      id: raw.id,
      clinicianId: raw.clinician_id,
      dayOfWeek: raw.day_of_week,
      startTime: raw.start_time,
      endTime: raw.end_time,
      isRecurring: raw.is_recurring,
      recurrenceRule: raw.recurrence_rule,
      timeZone: raw.time_zone
    };
  }

  static validateTimeGranularity(granularity: string): 'hour' | 'halfhour' {
    return granularity === 'halfhour' ? 'halfhour' : 'hour';
  }
}
