
import WeekView from './WeekView';

export default WeekView;
export { useWeekViewData } from './hooks/useWeekViewData';
export type { 
  Appointment,
  AvailabilityBlock as AvailabilityBlockType,
  AvailabilityException,
  TimeBlock,
  AppointmentBlock as AppointmentBlockType
} from './types/availability-types';

export { default as AppointmentBlock } from './AppointmentBlock';
export { default as AvailabilityBlock } from './AvailabilityBlock';
export { default as TimeColumn } from './TimeColumn';
