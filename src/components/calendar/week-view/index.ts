
import WeekView from './WeekView';
export default WeekView;

export { useWeekViewData } from './useWeekViewData';

// Export types correctly with 'export type'
export type { Appointment, ProcessedAppointment } from '@/types/appointment';
export type { AvailabilityBlock } from './types';

// Export components
export { default as AppointmentBlock } from './AppointmentBlock';
export { default as AvailabilityBlock as AvailabilityBlockComponent } from './AvailabilityBlock';
export { default as TimeColumn } from './TimeColumn';
