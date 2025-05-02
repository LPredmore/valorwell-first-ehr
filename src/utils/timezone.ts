
// Re-export TimeZoneService from timeZoneService.ts for backward compatibility
export { TimeZoneService } from './timeZoneService';

// Also export the class as a const for compatibility with existing imports
export const timezone = TimeZoneService;
