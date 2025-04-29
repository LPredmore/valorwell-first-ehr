import { supabase } from '@/integrations/supabase/client';
import { cachedSupabase } from '@/integrations/supabase/cacheClient';
import { AvailabilitySettings, AvailabilitySlot, DayOfWeek, WeeklyAvailability, TimeSlot } from '@/types/availability';
import { createEmptyWeeklyAvailability } from '@/utils/availabilityUtils';
import { TimeZoneService } from '@/utils/timezone';
import { CalendarErrorHandler } from '@/services/calendar/CalendarErrorHandler';
import { DateTime } from 'luxon';

// Define the type for availability events from the database
interface AvailabilityEvent {
  id: string;
  clinician_id: string;
  start_time: string;
  end_time: string;
  time_zone: string;
  availability_type: string;
  is_active: boolean;
  recurrence_rule?: string;
  event_type: string;
  client_name?: string;
  status?: string;
}

// Cache TTL configuration (in milliseconds)
const CACHE_CONFIG = {
  SHORT: 2 * 60 * 1000,  // 2 minutes for frequently changing data
  MEDIUM: 10 * 60 * 1000, // 10 minutes for moderately changing data
  LONG: 30 * 60 * 1000   // 30 minutes for rarely changing data
};

// In-memory cache for weekly availability to reduce database hits
const weeklyAvailabilityCache = new Map<string, { data: WeeklyAvailability, timestamp: number }>();

export class AvailabilityQueryService {
  /**
   * Get weekly availability with caching
   * Uses both in-memory and database caching for optimal performance
   */
  static async getWeeklyAvailability(clinicianId: string): Promise<WeeklyAvailability> {
    try {
      console.log('[AvailabilityQueryService] Fetching weekly availability for clinician:', clinicianId);
      
      // Check in-memory cache first (fastest)
      const cacheKey = `weekly_availability:${clinicianId}`;
      const cachedData = weeklyAvailabilityCache.get(cacheKey);
      
      // If we have valid cached data, return it
      if (cachedData && (Date.now() - cachedData.timestamp < CACHE_CONFIG.MEDIUM)) {
        console.log('[AvailabilityQueryService] Using in-memory cached weekly availability');
        return cachedData.data;
      }
      
      // Use database cache layer
      const { data, error, fromCache } = await cachedSupabase.query<AvailabilityEvent[]>(
        'calendar_events',
        (client) => client
          .from('calendar_events')
          .select('*')
          .eq('clinician_id', clinicianId)
          .eq('event_type', 'availability')
          .eq('is_active', true),
        { ttl: CACHE_CONFIG.MEDIUM }
      );
      
      if (error) {
        console.error('[AvailabilityQueryService] Database error:', error);
        throw CalendarErrorHandler.handleDatabaseError(error);
      }

      console.log(`[AvailabilityQueryService] Retrieved ${data?.length || 0} availability records (from DB cache: ${fromCache})`);

      if (!data) {
        console.log('[AvailabilityQueryService] No availability data found for clinician:', clinicianId);
        return createEmptyWeeklyAvailability();
      }
      
      const weeklyAvailability = createEmptyWeeklyAvailability();
      
      // Process calendar events into weekly availability slots
      for (const event of data) {
        try {
          const startDt = DateTime.fromISO(event.start_time);
          const endDt = DateTime.fromISO(event.end_time);
          
          if (!startDt.isValid || !endDt.isValid) {
            console.error('[AvailabilityQueryService] Invalid date in event:', {
              event,
              startInvalid: startDt.invalidReason,
              endInvalid: endDt.invalidReason
            });
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
            timeZone: event.time_zone || 'UTC',
            isActive: event.is_active,
            recurrenceRule: event.recurrence_rule,
            isAppointment: event.event_type === 'appointment',
            clientName: event.client_name,
            appointmentStatus: event.status
          };
          
          weeklyAvailability[day].push(slot);
        } catch (slotError) {
          console.error('[AvailabilityQueryService] Error processing availability slot:', {
            error: slotError,
            event
          });
        }
      }
      
      // Update in-memory cache
      weeklyAvailabilityCache.set(cacheKey, {
        data: weeklyAvailability,
        timestamp: Date.now()
      });
      
      return weeklyAvailability;
    } catch (error) {
      console.error('[AvailabilityQueryService] Error getting weekly availability:', error);
      throw CalendarErrorHandler.formatError(error);
    }
  }

  /**
   * Calculate available slots with optimized queries
   * Prefetches availability data and reduces database calls
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
      
      // Based on the date, determine day of week
      const dateObj = DateTime.fromISO(date);
      const dayOfWeek = dateObj.weekdayLong.toLowerCase() as DayOfWeek;
      
      // Get clinician weekly availability (uses caching)
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
   * Batch calculate available slots for multiple dates
   * Reduces number of database queries by prefetching data
   */
  static async calculateAvailableSlotsForDateRange(
    settings: AvailabilitySettings,
    startDate: string,
    endDate: string,
    existingAppointments: any[]
  ): Promise<Record<string, TimeSlot[]>> {
    try {
      // Parse dates
      const start = DateTime.fromISO(startDate);
      const end = DateTime.fromISO(endDate);
      
      if (!start.isValid || !end.isValid) {
        throw new Error('Invalid date range provided');
      }
      
      console.log(`[AvailabilityQueryService] Calculating available slots for date range: ${startDate} to ${endDate}`);
      
      // Generate all dates in the range
      const dates: string[] = [];
      let currentDate = start;
      
      while (currentDate <= end) {
        dates.push(currentDate.toISODate() as string);
        currentDate = currentDate.plus({ days: 1 });
      }
      
      // Get weekly availability once (uses caching)
      const availability = await this.getWeeklyAvailability(settings.clinicianId);
      
      // Group appointments by date for efficient lookup
      const appointmentsByDate: Record<string, any[]> = {};
      
      for (const appt of existingAppointments) {
        const apptDate = appt.date || DateTime.fromISO(appt.startTime).toISODate();
        if (!appointmentsByDate[apptDate]) {
          appointmentsByDate[apptDate] = [];
        }
        appointmentsByDate[apptDate].push(appt);
      }
      
      // Calculate slots for each date
      const result: Record<string, TimeSlot[]> = {};
      
      for (const date of dates) {
        const dateObj = DateTime.fromISO(date);
        const dayOfWeek = dateObj.weekdayLong.toLowerCase() as DayOfWeek;
        
        // Get availability blocks for this day of week
        const dayAvailability = availability[dayOfWeek] || [];
        
        // Get appointments for this date
        const dateAppointments = appointmentsByDate[date] || [];
        
        // Calculate available slots for this date
        result[date] = await this.calculateSlotsForDay(
          settings,
          dayAvailability,
          dateAppointments
        );
      }
      
      return result;
    } catch (error) {
      console.error('[AvailabilityQueryService] Error calculating slots for date range:', error);
      throw error;
    }
  }
  
  /**
   * Helper method to calculate slots for a single day
   * Extracted to avoid code duplication
   */
  private static async calculateSlotsForDay(
    settings: AvailabilitySettings,
    dayAvailability: AvailabilitySlot[],
    existingAppointments: any[]
  ): Promise<TimeSlot[]> {
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
  }

  /**
   * Prefetch availability data for a clinician
   * Call this when loading a calendar view to warm up the cache
   */
  static async prefetchAvailabilityData(clinicianId: string): Promise<void> {
    try {
      console.log(`[AvailabilityQueryService] Prefetching availability data for clinician: ${clinicianId}`);
      
      // Prefetch weekly availability (will be cached)
      await this.getWeeklyAvailability(clinicianId);
      
      console.log(`[AvailabilityQueryService] Successfully prefetched availability data`);
    } catch (error) {
      console.error('[AvailabilityQueryService] Error prefetching availability data:', error);
      // Don't throw - this is a background optimization
    }
  }

  /**
   * Invalidate availability cache for a clinician
   * Call this after mutations to ensure fresh data
   */
  static invalidateAvailabilityCache(clinicianId: string): void {
    // Clear in-memory cache
    const cacheKey = `weekly_availability:${clinicianId}`;
    weeklyAvailabilityCache.delete(cacheKey);
    
    // Invalidate database cache
    cachedSupabase.invalidateTable('calendar_events');
    
    console.log(`[AvailabilityQueryService] Invalidated availability cache for clinician: ${clinicianId}`);
  }

  private static timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

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
      timeZone: raw.time_zone || 'UTC',
      isActive: raw.is_active,
      isAppointment: raw.event_type === 'appointment',
      clientName: raw.client_name,
      appointmentStatus: raw.status
    };
  }

  static validateTimeGranularity(granularity: string): 'hour' | 'halfhour' {
    return granularity === 'halfhour' ? 'halfhour' : 'hour';
  }
}
