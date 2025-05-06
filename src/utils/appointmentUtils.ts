
import { TimeZoneService } from './timeZoneService';
import { DateTime } from 'luxon';

// Default values
export const DEFAULT_START_TIME = "09:00";
export const DEFAULT_APPOINTMENT_DURATION_MINUTES = 60;

/**
 * Generate time options in 15-minute increments
 */
export const generateTimeOptions = () => {
  const options = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const formattedHour = hour.toString().padStart(2, '0');
      const formattedMinute = minute.toString().padStart(2, '0');
      options.push(`${formattedHour}:${formattedMinute}`);
    }
  }
  return options;
};

/**
 * Calculate end time based on a start time and duration
 */
export const calculateEndTime = (startTimeStr: string, durationMinutes: number = DEFAULT_APPOINTMENT_DURATION_MINUTES): string => {
  try {
    // Create a DateTime object from the start time
    const startTime = TimeZoneService.fromTimeString(startTimeStr);
    
    // Add the duration
    const endTime = startTime.plus({ minutes: durationMinutes });
    
    // Format as HH:mm
    return TimeZoneService.formatTime24(endTime);
  } catch (error) {
    console.error('Error calculating end time:', error);
    
    // Fallback to manual calculation if TimeZoneService fails
    const [hours, minutes] = startTimeStr.split(':').map(Number);
    let totalMinutes = hours * 60 + minutes + durationMinutes;
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMinutes = totalMinutes % 60;
    
    return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
  }
};

/**
 * Format client name for display
 */
export const formatClientName = (client: {
  client_first_name?: string,
  client_preferred_name?: string,
  client_last_name?: string
} | null): string => {
  if (!client) return 'Unnamed Client';
  
  const firstName = client.client_preferred_name || client.client_first_name || '';
  const lastName = client.client_last_name || '';
  return `${firstName} ${lastName}`.trim() || 'Unnamed Client';
};

/**
 * Ensure consistent ID format for database queries
 */
export const ensureStringId = (id: string | null): string | null => {
  if (!id) return null;
  return id.toString().trim();
};

/**
 * Generate dates for recurring appointments
 */
export const generateRecurringDates = (
  startDate: Date,
  recurrenceType: string,
  count = 26 // Default to 6 months (26 weeks) of appointments
): Date[] => {
  // Convert the start date to a DateTime object
  let dt = TimeZoneService.fromJSDate(startDate);
  const dates: Date[] = [startDate];
  
  // Calculate the end date (6 months from start)
  const sixMonthsFromStart = TimeZoneService.addMonths(dt, 6);
  
  for (let i = 1; i < count; i++) {
    // Calculate the next date based on recurrence type
    if (recurrenceType === 'weekly') {
      dt = TimeZoneService.addDays(dt, 7);
    } else if (recurrenceType === 'biweekly') {
      dt = TimeZoneService.addDays(dt, 14);
    } else if (recurrenceType === 'monthly') {
      dt = TimeZoneService.addMonths(dt, 1);
    }
    
    // Stop if we've gone beyond 6 months
    if (dt > sixMonthsFromStart) {
      break;
    }
    
    // Convert back to JS Date and add to the array
    dates.push(dt.toJSDate());
  }
  
  return dates;
};

/**
 * Format time for display using TimeZoneService
 */
export const formatTimeDisplay = (timeString: string, userTimeZone: string): string => {
  try {
    // Create a DateTime object from the time string
    const dt = TimeZoneService.fromTimeString(timeString, userTimeZone);
    
    // Format with AM/PM
    return TimeZoneService.formatTime(dt);
  } catch (error) {
    console.error('Error formatting time display:', error);
    return timeString;
  }
};
