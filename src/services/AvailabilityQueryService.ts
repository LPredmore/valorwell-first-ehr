
import { DateTime } from 'luxon';
import { supabase } from '@/integrations/supabase/client';
import { TimeZoneService } from '@/utils/timeZoneService';
import { 
  AvailabilitySettings,
  TimeSlot,
  DayOfWeek,
  AvailabilitySlot,
  WeeklyAvailability
} from '@/types/availability';

export class AvailabilityQueryService {
  static async calculateAvailableSlots(
    settings: AvailabilitySettings,
    date: string,
    existingAppointments: any[] // TODO: Define type for existing appointments
  ): Promise<TimeSlot[]> {
    const { timeZone, slotDuration, timeGranularity } = settings;
    const validTimeZone = TimeZoneService.ensureIANATimeZone(timeZone);
    const dayOfWeek = DateTime.fromISO(date).setZone(validTimeZone).toFormat('cccc').toLowerCase() as DayOfWeek;

    // Fetch weekly availability for the clinician
    const weeklyAvailability = await this.getWeeklyAvailability(settings.clinicianId);
    const dayAvailability = weeklyAvailability[dayOfWeek];

    if (!dayAvailability || dayAvailability.length === 0) {
      console.log(`No availability found for ${dayOfWeek}`);
      return [];
    }

    // Convert date string to DateTime object in the clinician's timezone
    const currentDate = DateTime.fromISO(date, { zone: validTimeZone });

    // Calculate start and end of the day in the clinician's timezone
    const startOfDay = currentDate.startOf('day');
    const endOfDay = currentDate.endOf('day');

    let availableSlots: TimeSlot[] = [];

    // Iterate through each availability slot for the day
    dayAvailability.forEach(slot => {
      const startTime = DateTime.fromFormat(slot.startTime, 'HH:mm', { zone: validTimeZone });
      const endTime = DateTime.fromFormat(slot.endTime, 'HH:mm', { zone: validTimeZone });

      // Ensure start and end times are valid
      if (!startTime.isValid || !endTime.isValid) {
        console.error('Invalid start or end time:', slot.startTime, slot.endTime);
        return;
      }

      let currentSlotTime = startOfDay.set({
        hour: startTime.hour,
        minute: startTime.minute,
        second: 0,
        millisecond: 0
      });

      // Generate time slots for the current availability slot
      while (currentSlotTime < endOfDay && currentSlotTime < endTime) {
        const slotEndTime = currentSlotTime.plus({ minutes: slotDuration });

        // Check if the slot end time exceeds the end of the availability slot
        if (slotEndTime > endTime) {
          break;
        }

        // Check if the slot overlaps with any existing appointments
        const isSlotBooked = existingAppointments.some(appointment => {
          const appointmentStartTime = DateTime.fromISO(appointment.start_time, { zone: validTimeZone });
          return currentSlotTime < appointmentStartTime && slotEndTime > appointmentStartTime;
        });

        if (!isSlotBooked) {
          availableSlots.push({
            startTime: currentSlotTime.toFormat('HH:mm'),
            endTime: slotEndTime.toFormat('HH:mm'),
            available: true
          });
        }

        // Increment the current slot time based on the time granularity
        if (timeGranularity === 'half-hour') {
          currentSlotTime = currentSlotTime.plus({ minutes: 30 });
        } else {
          currentSlotTime = currentSlotTime.plus({ minutes: 60 });
        }
      }
    });

    return availableSlots;
  }

  static async getWeeklyAvailability(clinicianId: string): Promise<WeeklyAvailability> {
    try {
      const { data, error } = await supabase
        .from('availability_slots')
        .select('*')
        .eq('clinician_id', clinicianId);

      if (error) {
        console.error('Error fetching weekly availability:', error);
        return this.getEmptyWeeklyAvailability();
      }

      const weeklyAvailability: WeeklyAvailability = this.getEmptyWeeklyAvailability();

      data.forEach(slot => {
        const dayOfWeek = slot.day_of_week as DayOfWeek;
        if (weeklyAvailability[dayOfWeek]) {
          const availabilitySlot: AvailabilitySlot = {
            id: slot.id,
            dayOfWeek,
            startTime: slot.start_time,
            endTime: slot.end_time,
            isRecurring: !!slot.is_recurring,
            isAppointment: false, // Regular availability slot
            timeZone: slot.time_zone || 'UTC'
          };
          
          weeklyAvailability[dayOfWeek].push(availabilitySlot);
        }
      });

      return weeklyAvailability;
    } catch (error) {
      console.error('Error in getWeeklyAvailability:', error);
      return this.getEmptyWeeklyAvailability();
    }
  }
  
  private static getEmptyWeeklyAvailability(): WeeklyAvailability {
    return {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: []
    };
  }
}
