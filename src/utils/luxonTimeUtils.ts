import { DateTime } from "luxon";
import { ensureIANATimeZone } from "./timeZoneUtils";
import { 
  formatDateTime as formatDateTimeUtil,
  formatInTimezone,
  formatTime 
} from "./dateFormatUtils";

/**
 * Convert a date and time to a Luxon DateTime object in a specific timezone
 * @param date Date string in YYYY-MM-DD format or Date object
 * @param time Time string in HH:MM or HH:MM:SS format
 * @param timezone IANA timezone identifier
 * @returns Luxon DateTime object
 */
export const createDateTime = (
  date: string | Date,
  time: string,
  timezone: string
): DateTime => {
  // Ensure we have a valid IANA timezone
  const ianaZone = ensureIANATimeZone(timezone);
  
  // Format date as string if it's a Date object
  const dateStr = typeof date === "string" ? date : date.toISOString().split("T")[0];
  
  // Parse time components
  const [hours, minutes] = time.split(":").map(Number);
  
  // Create a Luxon DateTime object in the specified timezone
  return DateTime.fromObject(
    { 
      year: parseInt(dateStr.split("-")[0]), 
      month: parseInt(dateStr.split("-")[1]), 
      day: parseInt(dateStr.split("-")[2]),
      hour: hours,
      minute: minutes,
    },
    { zone: ianaZone }
  );
};

/**
 * Convert a Luxon DateTime to another timezone
 * @param dateTime Luxon DateTime object
 * @param targetTimezone Target IANA timezone identifier
 * @returns Luxon DateTime object in the target timezone
 */
export const convertToTimezone = (
  dateTime: DateTime,
  targetTimezone: string
): DateTime => {
  const ianaZone = ensureIANATimeZone(targetTimezone);
  return dateTime.setZone(ianaZone);
};

/**
 * Format a Luxon DateTime for display
 * Use the centralized formatDateTime utility from dateFormatUtils
 * @param dateTime Luxon DateTime object
 * @param formatStr Format string (defaults to 'h:mm a')
 * @returns Formatted date/time string
 */
export const formatLuxonDateTime = (
  dateTime: DateTime,
  formatStr: string = "h:mm a"
): string => {
  return dateTime.toFormat(formatStr);
};

/**
 * Convert a date and time from one timezone to another
 * @param date Date string in YYYY-MM-DD format or Date object
 * @param time Time string in HH:MM format
 * @param sourceTimezone Source IANA timezone identifier
 * @param targetTimezone Target IANA timezone identifier
 * @returns Object with new date and time strings
 */
export const convertDateTimeToTimezone = (
  date: string | Date,
  time: string,
  sourceTimezone: string,
  targetTimezone: string
): { date: string; time: string } => {
  const dateTime = createDateTime(date, time, sourceTimezone);
  const convertedDateTime = convertToTimezone(dateTime, targetTimezone);
  
  return {
    date: convertedDateTime.toFormat("yyyy-MM-dd"),
    time: convertedDateTime.toFormat("HH:mm")
  };
};

/**
 * Convert a UTC ISO string to a datetime in a specific timezone
 * @param utcString UTC ISO datetime string
 * @param timezone Target IANA timezone identifier
 * @returns Luxon DateTime object in the target timezone
 */
export const fromUTCToTimezone = (
  utcString: string,
  timezone: string
): DateTime => {
  const ianaZone = ensureIANATimeZone(timezone);
  return DateTime.fromISO(utcString, { zone: "utc" }).setZone(ianaZone);
};

/**
 * Convert a datetime in a specific timezone to a UTC ISO string
 * @param date Date string in YYYY-MM-DD format or Date object
 * @param time Time string in HH:MM format
 * @param timezone Source IANA timezone identifier
 * @returns UTC ISO datetime string
 */
export const toUTCFromTimezone = (
  date: string | Date,
  time: string,
  timezone: string
): string => {
  const dateTime = createDateTime(date, time, timezone);
  return dateTime.toUTC().toISO();
};

/**
 * Check if a time is ambiguous due to DST transitions
 * @param date Date string in YYYY-MM-DD format or Date object
 * @param time Time string in HH:MM format
 * @param timezone IANA timezone identifier
 * @returns Boolean indicating if the time is ambiguous
 */
export const isDSTTransitionTime = (
  date: string | Date,
  time: string,
  timezone: string
): boolean => {
  const ianaZone = ensureIANATimeZone(timezone);
  const dateTime = createDateTime(date, time, timezone);
  
  // Get times one hour before and after
  const hourBefore = dateTime.minus({ hours: 1 });
  const hourAfter = dateTime.plus({ hours: 1 });
  
  // If the offset changes within this window, we're in a DST transition
  return hourBefore.offset !== hourAfter.offset;
};

/**
 * Get timezone display name from IANA identifier
 * @param timezone IANA timezone identifier
 * @returns User-friendly timezone display name
 */
export const getTimezoneDisplayName = (timezone: string): string => {
  const ianaZone = ensureIANATimeZone(timezone);
  const zone = new IANAZone(ianaZone);
  
  try {
    // Try to get the location-based name
    const locationName = ianaZone.split("/").pop()?.replace("_", " ") || ianaZone;
    
    // Get current offset for this timezone
    const now = DateTime.now().setZone(ianaZone);
    const offsetStr = now.toFormat("ZZZZ"); // Format like "EST" or "EDT"
    
    return `${locationName} (${offsetStr})`;
  } catch (error) {
    console.error("Error formatting timezone name:", error);
    return ianaZone;
  }
};

/**
 * Enhance our existing WeekView component with Luxon integration
 * This is a helper function for gradual migration
 * @param appointments Array of appointments to convert
 * @param userTimeZone User's timezone
 * @returns Processed appointments with proper timezone handling
 */
export const processAppointmentsWithLuxon = (
  appointments: any[],
  userTimeZone: string
): any[] => {
  return appointments.map(appointment => {
    try {
      // Use display_date/time if available, otherwise use original date/time
      const dateToUse = appointment.display_date || appointment.date;
      const startTimeToUse = appointment.display_start_time || appointment.start_time;
      const endTimeToUse = appointment.display_end_time || appointment.end_time;
      
      // Create Luxon DateTime objects for start and end times
      const startDateTime = createDateTime(dateToUse, startTimeToUse, userTimeZone);
      const endDateTime = createDateTime(dateToUse, endTimeToUse, userTimeZone);
      
      // Add Luxon objects to the appointment for easier manipulation
      return {
        ...appointment,
        luxon_start: startDateTime,
        luxon_end: endDateTime,
        // Keep compatibility with existing fields
        start: startDateTime.toJSDate(),
        end: endDateTime.toJSDate(),
        day: startDateTime.startOf('day').toJSDate()
      };
    } catch (error) {
      console.error("Error processing appointment with Luxon:", error, appointment);
      return appointment;
    }
  });
};

/**
 * @deprecated Use formatInTimezone from dateFormatUtils instead
 * This is kept for backward compatibility
 */
export const formatDateTime = formatLuxonDateTime;
