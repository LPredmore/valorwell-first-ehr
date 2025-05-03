
import { TimeZoneService as ImplementedTimeZoneService } from './timezone/TimeZoneService';

// Re-export the core functionality
export * from './timezone/TimeZoneService';

// Export the main service
export const TimeZoneService = ImplementedTimeZoneService;

// Default export
export default ImplementedTimeZoneService;
