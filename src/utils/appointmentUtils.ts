
import { format } from 'date-fns';
import { TimeZoneService } from './timeZoneService';

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
  const [hours, minutes] = startTimeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  date.setMinutes(date.getMinutes() + durationMinutes);
  
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
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
  const dates: Date[] = [new Date(startDate)];
  let currentDate = new Date(startDate);
  
  for (let i = 1; i < count; i++) {
    if (recurrenceType === 'weekly') {
      currentDate = new Date(currentDate);
      currentDate.setDate(currentDate.getDate() + 7);
    } else if (recurrenceType === 'biweekly') {
      currentDate = new Date(currentDate);
      currentDate.setDate(currentDate.getDate() + 14);
    } else if (recurrenceType === 'monthly') {
      currentDate = new Date(currentDate);
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    // Limit to 6 months from start
    const sixMonthsFromStart = new Date(startDate);
    sixMonthsFromStart.setMonth(sixMonthsFromStart.getMonth() + 6);
    
    if (currentDate > sixMonthsFromStart) {
      break;
    }
    
    dates.push(new Date(currentDate));
  }
  
  return dates;
};

/**
 * Format time for display using TimeZoneService
 */
export const formatTimeDisplay = (timeString: string, userTimeZone: string): string => {
  try {
    return TimeZoneService.formatDateTime(
      TimeZoneService.createDateTime('2023-01-01', timeString, userTimeZone),
      'h:mm a',
      userTimeZone
    );
  } catch (error) {
    console.error('Error formatting time display:', error);
    return timeString;
  }
};
