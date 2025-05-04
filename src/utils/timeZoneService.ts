
// Import TimeZoneService from the services folder to provide a single import point
import { TimeZoneService as ServiceTimeZoneService } from "@/services/calendar/TimeZoneService";

// Re-export the TimeZoneService as a convenience
export const TimeZoneService = ServiceTimeZoneService;

// Default export for backward compatibility
export default ServiceTimeZoneService;
