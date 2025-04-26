import { AvailabilitySettings, WeeklyAvailability } from '@/types/availability';
import { TimeZoneService } from '@/utils/timeZoneService';
import { createEmptyWeeklyAvailability } from '@/utils/availabilityUtils';

export class AvailabilityQueryService {
  static mapSettingsFromDB(data: any): AvailabilitySettings {
    return {
      id: data.id,
      clinicianId: data.clinicianId,
      timeZone: TimeZoneService.ensureIANATimeZone(data.timeZone || 'America/Chicago'),
      slotDuration: data.defaultSlotDuration,
      defaultSlotDuration: data.defaultSlotDuration,
      minDaysAhead: data.minNoticeDays,
      maxDaysAhead: data.maxAdvanceDays,
      minNoticeDays: data.minNoticeDays,
      maxAdvanceDays: data.maxAdvanceDays,
      bufferBetweenSlots: data.bufferBetweenSlots || 0,
      earlyMorningHours: data.earlyMorningHours || false,
      lateEveningHours: data.lateEveningHours || false,
      weekendAvailability: data.weekendAvailability || false,
      allowRecurringScheduling: data.allowRecurringScheduling || false,
      autoConfirm: data.autoConfirm || false,
      timeGranularity: data.timeGranularity || 'hour',
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    };
  }
  
  static calculateAvailableSlots(
    settings: AvailabilitySettings,
    date: string,
    existingAppointments: any[] = []
  ): { start: string; end: string }[] {
    // Default slot duration in minutes
    const slotDuration = settings.slotDuration || 60;
    
    // Get the day of week (0-6, where 0 is Sunday)
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay();
    
    // Skip if weekend and weekend availability is disabled
    if ((dayOfWeek === 0 || dayOfWeek === 6) && !settings.weekendAvailability) {
      return [];
    }
    
    // Define start and end hours based on settings
    let startHour = settings.earlyMorningHours ? 6 : 8;
    let endHour = settings.lateEveningHours ? 20 : 18;
    
    // Generate time slots
    const slots: { start: string; end: string }[] = [];
    const timeZone = TimeZoneService.ensureIANATimeZone(settings.timeZone);
    
    for (let hour = startHour; hour < endHour; hour++) {
      // For each hour, create slots based on granularity
      const slotsPerHour = this.getSlotsPerHour(settings.timeGranularity || 'hour');
      const minutesPerSlot = 60 / slotsPerHour;
      
      for (let i = 0; i < slotsPerHour; i++) {
        const startMinute = i * minutesPerSlot;
        
        // Create the slot start and end times
        const slotStart = new Date(date);
        slotStart.setHours(hour, startMinute, 0, 0);
        
        const slotEnd = new Date(slotStart);
        slotEnd.setMinutes(slotStart.getMinutes() + slotDuration);
        
        // Convert to ISO strings in the clinician's timezone
        const startISO = TimeZoneService.createISODateTimeString(
          date,
          `${hour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`,
          timeZone
        );
        
        const endISO = TimeZoneService.createISODateTimeString(
          date,
          `${slotEnd.getHours().toString().padStart(2, '0')}:${slotEnd.getMinutes().toString().padStart(2, '0')}`,
          timeZone
        );
        
        // Check if slot conflicts with existing appointments
        const isAvailable = !this.hasConflict(startISO, endISO, existingAppointments);
        
        if (isAvailable) {
          slots.push({
            start: startISO,
            end: endISO
          });
        }
      }
    }
    
    return slots;
  }
  
  static getSlotsPerHour(granularity: string): number {
    switch (granularity) {
      case 'quarter':
        return 4; // 15-minute slots
      case 'halfhour':
        return 2; // 30-minute slots
      case 'hour':
      default:
        return 1; // 60-minute slots
    }
  }
  
  static hasConflict(
    start: string,
    end: string,
    appointments: { start: string; end: string }[]
  ): boolean {
    return appointments.some(appointment => {
      const appointmentStart = new Date(appointment.start).getTime();
      const appointmentEnd = new Date(appointment.end).getTime();
      const slotStart = new Date(start).getTime();
      const slotEnd = new Date(end).getTime();
      
      // Check for overlap
      return (
        (slotStart >= appointmentStart && slotStart < appointmentEnd) ||
        (slotEnd > appointmentStart && slotEnd <= appointmentEnd) ||
        (slotStart <= appointmentStart && slotEnd >= appointmentEnd)
      );
    });
  }
  
  static getDefaultSettings(clinicianId: string): AvailabilitySettings {
    const now = new Date();
    return {
      id: `default-${clinicianId}`,
      clinicianId,
      timeZone: TimeZoneService.getUserTimeZone(),
      slotDuration: 60,
      defaultSlotDuration: 60,
      minDaysAhead: 1,
      maxDaysAhead: 30,
      minNoticeDays: 1,
      maxAdvanceDays: 30,
      bufferBetweenSlots: 0,
      earlyMorningHours: false,
      lateEveningHours: false,
      weekendAvailability: false,
      allowRecurringScheduling: true,
      autoConfirm: false,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };
  }

  static async getWeeklyAvailability(clinicianId: string): Promise<WeeklyAvailability> {
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
      startTime: TimeZoneService.formatTime(slot.start_time),
      endTime: TimeZoneService.formatTime(slot.end_time),
      dayOfWeek: slot.day_of_week,
      isRecurring: slot.is_recurring || false
    }));

    const weeklySlots = createEmptyWeeklyAvailability();
    slots.forEach(slot => {
      if (slot.dayOfWeek && slot.dayOfWeek in weeklySlots) {
        weeklySlots[slot.dayOfWeek].push(slot);
      }
    });

    return weeklySlots;
  }
}
