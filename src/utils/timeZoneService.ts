
// Simplified TimeZoneService that provides basic timezone functionality
import { DateTime } from 'luxon';

/**
 * Service for managing time zones and date/time conversions
 */
export class TimeZoneService {
  /**
   * Ensure we have a valid IANA timezone string
   * @param timezone The timezone to validate
   * @param defaultTimeZone Default timezone to use if none provided
   * @returns A valid IANA timezone string
   */
  static ensureIANATimeZone(timezone?: string | null, defaultTimeZone = 'UTC'): string {
    if (!timezone) {
      return defaultTimeZone;
    }

    try {
      // Check if this is a valid timezone by trying to create a DateTime with it
      const dt = DateTime.now().setZone(timezone);
      return dt.isValid ? timezone : defaultTimeZone;
    } catch (error) {
      console.error(`Invalid timezone: ${timezone}, using ${defaultTimeZone} instead`);
      return defaultTimeZone;
    }
  }

  /**
   * Format a time string (HH:MM) to a display format
   * @param timeStr Time string in 24-hour format (HH:MM)
   * @param format Format to use (default: 'h:mm a')
   * @returns Formatted time string
   */
  static formatTime(timeStr: string, format: string = 'h:mm a'): string {
    if (!timeStr) return '';
    
    try {
      // Extract hours and minutes
      const [hours, minutes] = timeStr.split(':').map(Number);
      
      // Create a DateTime object with today's date and the specified time
      const dt = DateTime.now().set({ hour: hours, minute: minutes });
      
      // Format the time according to the specified format
      return dt.toFormat(format);
    } catch (error) {
      console.error(`Error formatting time ${timeStr}:`, error);
      return timeStr;
    }
  }

  /**
   * Convert a time string from one timezone to another
   * @param timeStr Time string in 24-hour format (HH:MM)
   * @param fromTimeZone Source timezone
   * @param toTimeZone Target timezone
   * @returns Time string in target timezone
   */
  static convertTime(timeStr: string, fromTimeZone: string, toTimeZone: string): string {
    if (!timeStr) return '';
    
    try {
      // Extract hours and minutes
      const [hours, minutes] = timeStr.split(':').map(Number);
      
      // Create a DateTime object with today's date and the specified time
      const dt = DateTime.now()
        .setZone(this.ensureIANATimeZone(fromTimeZone))
        .set({ hour: hours, minute: minutes });
      
      // Convert to target timezone
      const converted = dt.setZone(this.ensureIANATimeZone(toTimeZone));
      
      // Return the time in HH:MM format
      return converted.toFormat('HH:mm');
    } catch (error) {
      console.error(`Error converting time ${timeStr}:`, error);
      return timeStr;
    }
  }
}

export default TimeZoneService;
