
import WeekView from './WeekView';
export default WeekView;

import { useWeekViewData } from './useWeekViewData';
export { useWeekViewData };

export type { 
  Appointment,
  BaseAppointment,
  AvailabilityBlock as AvailabilityBlockType,
  AvailabilityException,
  TimeBlock,
  AppointmentBlock as AppointmentBlockType
} from '@/types/appointment';

export { default as AppointmentBlock } from './AppointmentBlock';
export { default as AvailabilityBlock } from './AvailabilityBlock';
export { default as TimeColumn } from './TimeColumn';

