
/**
 * This file re-exports the TimeZoneService from utils/timeZoneService 
 * to maintain backwards compatibility for services using this import path
 */
import { TimeZoneService } from '@/utils/timeZoneService';

// Re-export the TimeZoneService
export { TimeZoneService };
export default TimeZoneService;
