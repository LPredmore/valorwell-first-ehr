import { CalendarEvent, DayOfWeek, AvailabilitySlot } from '@/types/calendar';
import { DateTime } from 'luxon';
import { TimeZoneService } from '@/utils/timezone';
import { AvailabilitySettings } from '@/types/availability';

/**
 * Service for generating mock availability data
 */
export class MockAvailabilityService {
  private static daysOfWeek: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  private static mockSettings: Record<string, AvailabilitySettings> = {};

  /**
   * Generate mock availability slots for a clinician
   * @param clinicianId The clinician ID
   * @param count Number of slots to generate
   * @returns Array of availability slots
   */
  static generateMockAvailabilitySlots(clinicianId: string, count: number = 10): AvailabilitySlot[] {
    const slots: AvailabilitySlot[] = [];
    
    for (let i = 0; i < count; i++) {
      // Generate random day of week (1-5 for Monday-Friday)
      const dayIndex = Math.floor(Math.random() * 5) + 1;
      const dayOfWeek = this.daysOfWeek[dayIndex];
      
      // Generate random start hour between 8 AM and 5 PM
      const startHour = Math.floor(Math.random() * 9) + 8;
      // Duration of 1 hour
      const endHour = startHour + 1;
      
      const slot: AvailabilitySlot = {
        id: `mock-availability-${i}-${clinicianId}`,
        clinicianId: clinicianId,
        dayOfWeek: dayOfWeek,
        startTime: `${startHour.toString().padStart(2, '0')}:00`,
        endTime: `${endHour.toString().padStart(2, '0')}:00`,
        isRecurring: true,
        isAppointment: false
      };
      
      slots.push(slot);
    }
    
    return slots;
  }
  
  /**
   * Generate default weekly availability pattern
   * @param clinicianId The clinician ID
   * @returns Array of availability slots representing a standard weekly schedule
   */
  static generateDefaultWeeklyAvailability(clinicianId: string): AvailabilitySlot[] {
    const slots: AvailabilitySlot[] = [];
    
    // Monday to Friday, 9 AM to 5 PM
    for (let dayIndex = 1; dayIndex <= 5; dayIndex++) {
      const dayOfWeek = this.daysOfWeek[dayIndex];
      
      // Morning slot: 9 AM to 12 PM
      slots.push({
        id: `default-morning-${dayOfWeek}-${clinicianId}`,
        clinicianId: clinicianId,
        dayOfWeek: dayOfWeek,
        startTime: '09:00',
        endTime: '12:00',
        isRecurring: true,
        isAppointment: false
      });
      
      // Afternoon slot: 1 PM to 5 PM
      slots.push({
        id: `default-afternoon-${dayOfWeek}-${clinicianId}`,
        clinicianId: clinicianId,
        dayOfWeek: dayOfWeek,
        startTime: '13:00',
        endTime: '17:00',
        isRecurring: true,
        isAppointment: false
      });
    }
    
    return slots;
  }
  
  /**
   * Convert availability slots to calendar events for a specific date range
   * @param slots Array of availability slots
   * @param startDate Start date of the range
   * @param endDate End date of the range
   * @param timezone Timezone for the events
   * @returns Array of calendar events
   */
  static convertSlotsToEvents(
    slots: AvailabilitySlot[],
    startDate: Date | string,
    endDate: Date | string,
    timezone: string
  ): CalendarEvent[] {
    const events: CalendarEvent[] = [];
    
    // Convert dates to DateTime objects
    const start = typeof startDate === 'string' 
      ? DateTime.fromISO(startDate, { zone: timezone }) 
      : DateTime.fromJSDate(startDate, { zone: timezone });
    
    const end = typeof endDate === 'string' 
      ? DateTime.fromISO(endDate, { zone: timezone }) 
      : DateTime.fromJSDate(endDate, { zone: timezone });
    
    // Loop through each day in the range
    let currentDay = start.startOf('day');
    const lastDay = end.endOf('day');
    
    while (currentDay <= lastDay) {
      const weekday = currentDay.weekday % 7; // Convert to 0-6 format (Sunday = 0)
      const dayOfWeek = this.daysOfWeek[weekday];
      
      // Find slots for this day of week
      const daySlots = slots.filter(slot => slot.dayOfWeek === dayOfWeek);
      
      // Create an event for each slot
      for (const slot of daySlots) {
        // Parse the time strings
        const [startHour, startMinute] = slot.startTime.split(':').map(Number);
        const [endHour, endMinute] = slot.endTime.split(':').map(Number);
        
        // Create start and end times for this specific day
        const eventStart = currentDay.set({ hour: startHour, minute: startMinute });
        const eventEnd = currentDay.set({ hour: endHour, minute: endMinute });
        
        // Create the event
        const event: CalendarEvent = {
          id: `${slot.id}-${currentDay.toFormat('yyyyMMdd')}`,
          title: 'Available',
          start: eventStart.toJSDate(),
          end: eventEnd.toJSDate(),
          allDay: false,
          backgroundColor: '#10b981',
          borderColor: '#059669',
          textColor: '#ffffff',
          extendedProps: {
            eventType: 'availability',
            clinicianId: slot.clinicianId,
            sourceTimeZone: timezone,
            isAvailability: true,
            isRecurring: slot.isRecurring,
            dayOfWeek: dayOfWeek,
            originalSlotId: slot.id
          }
        };
        
        events.push(event);
      }
      
      // Move to next day
      currentDay = currentDay.plus({ days: 1 });
    }
    
    return events;
  }
  
  /**
   * Get mock availability events for a specific date range
   */
  static getMockAvailabilityEvents(
    clinicianId: string,
    timezone: string,
    startDate: Date | string,
    endDate: Date | string
  ): CalendarEvent[] {
    // Get or generate availability slots
    const slots = this.generateDefaultWeeklyAvailability(clinicianId);
    
    // Convert slots to events in the date range
    return this.convertSlotsToEvents(slots, startDate, endDate, timezone);
  }

  /**
   * Get preferred days for appointments based on mock data
   */
  static getPreferredDays(): DayOfWeek[] {
    return ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  }

  /**
   * Get availability settings for a clinician
   */
  static async getSettingsForClinician(clinicianId: string): Promise<AvailabilitySettings> {
    console.log('[MockAvailabilityService] Getting settings for clinician:', clinicianId);
    
    // Generate or retrieve stored settings
    const settings = this.mockSettings[clinicianId] || this.generateDefaultSettings(clinicianId);
    
    // Store for future use
    this.mockSettings[clinicianId] = settings;
    
    return settings;
  }

  /**
   * Update settings for a clinician
   */
  static async updateSettings(clinicianId: string, updates: Partial<AvailabilitySettings>): Promise<AvailabilitySettings> {
    // Get current settings or create new ones
    let currentSettings = this.mockSettings[clinicianId];
    if (!currentSettings) {
      currentSettings = await this.getSettingsForClinician(clinicianId);
    }
    
    // Apply updates while keeping the current structure
    const updatedSettings: AvailabilitySettings = {
      ...currentSettings,
      ...updates,
    };
    
    // Update in-memory store
    this.mockSettings[clinicianId] = updatedSettings;
    
    return updatedSettings;
  }

  /**
   * Generate default settings for a clinician
   */
  private static generateDefaultSettings(clinicianId: string): AvailabilitySettings {
    return {
      id: `settings_${clinicianId}`,
      clinicianId: clinicianId,
      defaultSlotDuration: 60,
      minNoticeDays: 1,
      maxAdvanceDays: 30,
      timeZone: 'America/Chicago',
      slotDuration: 60,
      timeGranularity: 'hour',
      isActive: true
    };
  }

  /**
   * Get weekly availability for a clinician
   */
  static getWeeklyAvailabilityForClinician(clinicianId: string): Promise<any> {
    const slots = this.generateDefaultWeeklyAvailability(clinicianId);
    const weeklyAvailability = {
      monday: slots.filter(s => s.dayOfWeek === 'monday'),
      tuesday: slots.filter(s => s.dayOfWeek === 'tuesday'),
      wednesday: slots.filter(s => s.dayOfWeek === 'wednesday'),
      thursday: slots.filter(s => s.dayOfWeek === 'thursday'),
      friday: slots.filter(s => s.dayOfWeek === 'friday'),
      saturday: slots.filter(s => s.dayOfWeek === 'saturday'),
      sunday: slots.filter(s => s.dayOfWeek === 'sunday')
    };
    return Promise.resolve(weeklyAvailability);
  }

  /**
   * Create an availability slot
   */
  static createAvailabilitySlot(
    clinicianId: string,
    dayOfWeek: DayOfWeek,
    startTime: string,
    endTime: string,
    isRecurring: boolean = true,
    recurrenceRule?: string,
    timeZone?: string,
    specificDate?: string | Date | DateTime
  ): Promise<AvailabilitySlot> {
    const newSlot: AvailabilitySlot = {
      id: `mock-slot-${Date.now()}`,
      clinicianId,
      dayOfWeek,
      startTime,
      endTime,
      isRecurring,
      sourceTimeZone: timeZone || 'America/Chicago',
      isAppointment: false
    };
    return Promise.resolve(newSlot);
  }

  /**
   * Update an availability slot
   */
  static updateAvailabilitySlot(slotId: string, updates: Partial<AvailabilitySlot>): Promise<AvailabilitySlot> {
    const updatedSlot: AvailabilitySlot = {
      id: slotId,
      clinicianId: updates.clinicianId || 'mock-clinician',
      dayOfWeek: updates.dayOfWeek || 'monday',
      startTime: updates.startTime || '09:00',
      endTime: updates.endTime || '10:00',
      isRecurring: updates.isRecurring !== undefined ? updates.isRecurring : true,
      sourceTimeZone: updates.sourceTimeZone || 'America/Chicago',
      isAppointment: updates.isAppointment || false
    };
    return Promise.resolve(updatedSlot);
  }

  /**
   * Delete an availability slot
   */
  static deleteAvailabilitySlot(slotId: string): Promise<boolean> {
    return Promise.resolve(true);
  }

  /**
   * Calculate available slots for a specific date
   */
  static calculateAvailableSlots(
    clinicianId: string,
    date: string,
    timezone: string
  ): Promise<AvailabilitySlot[]> {
    const dt = DateTime.fromISO(date, { zone: timezone });
    const dayOfWeek = this.daysOfWeek[dt.weekday % 7];
    
    const slots = this.generateDefaultWeeklyAvailability(clinicianId)
      .filter(slot => slot.dayOfWeek === dayOfWeek);
    
    return Promise.resolve(slots);
  }
}

export default MockAvailabilityService;
