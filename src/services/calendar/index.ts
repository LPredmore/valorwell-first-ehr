
// Re-export all calendar services for easier imports
export * from './CalendarFacade';
export * from './CalendarQueryService';
export * from './CalendarMutationService';
export * from './CalendarErrorHandler';
export * from './CalendarHealthService';

/**
 * Consolidated calendar services export
 * Provides a single entry point for all calendar-related functionality
 */
import { CalendarFacade } from './CalendarFacade';
import { CalendarQueryService } from './CalendarQueryService';
import { CalendarMutationService } from './CalendarMutationService';
import { CalendarErrorHandler } from './CalendarErrorHandler';
import { CalendarHealthService } from './CalendarHealthService';

export const CalendarServices = {
  Facade: CalendarFacade,
  Query: CalendarQueryService,
  Mutation: CalendarMutationService,
  ErrorHandler: CalendarErrorHandler,
  Health: CalendarHealthService,
};

export default CalendarServices;
