import WeekView from './WeekView';
export default WeekView;

export { useWeekViewData } from './useWeekViewData';

export type { 
  ProcessedAppointment,
  ProcessedAvailability,
  WeekViewData
} from './useWeekViewData';

// Future centralized type imports/exports:
// import { Appointment } from '@/types/appointment';
// export type { Appointment };

export type { AvailabilityBlock } from './types';

// Export components
export { default as AppointmentBlock } from './AppointmentBlock';
export { default as AvailabilityBlockComponent } from './AvailabilityBlock';
export { default as TimeColumn } from './TimeColumn';
