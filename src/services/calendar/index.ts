
/**
 * Calendar Services Index
 * 
 * This file exports all calendar-related services for easier imports.
 */

// Export all services
export { TimeZoneService } from './TimeZoneService';
export { RecurrenceService } from './RecurrenceService';
export { AvailabilityService } from './AvailabilityService';
export { AppointmentService } from './AppointmentService';
export { TimeOffService } from './TimeOffService';
export { CalendarService } from './CalendarService';
export { CalendarError, CalendarErrorHandler, type CalendarErrorCode } from './CalendarErrorHandler';

// Export a default object with all services
import { TimeZoneService } from './TimeZoneService';
import { RecurrenceService } from './RecurrenceService';
import { AvailabilityService } from './AvailabilityService';
import { AppointmentService } from './AppointmentService';
import { TimeOffService } from './TimeOffService';
import { CalendarService } from './CalendarService';
import { CalendarErrorHandler } from './CalendarErrorHandler';

/**
 * Calendar Services
 * 
 * A consolidated export of all calendar-related services.
 */
const CalendarServices = {
  Calendar: CalendarService,
  TimeZone: TimeZoneService,
  Recurrence: RecurrenceService,
  Availability: AvailabilityService,
  Appointment: AppointmentService,
  TimeOff: TimeOffService,
  ErrorHandler: CalendarErrorHandler
};

export default CalendarServices;
