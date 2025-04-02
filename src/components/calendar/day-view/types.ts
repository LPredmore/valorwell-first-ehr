
import { Dispatch, SetStateAction } from 'react';

export interface AvailabilityBlock {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  isException?: boolean;
}

export interface AvailabilityException {
  id: string;
  specific_date: string;
  original_availability_id: string;
  start_time: string | null;
  end_time: string | null;
  is_deleted: boolean;
}

export interface TimeBlock {
  start: Date;
  end: Date;
  availabilityIds: string[];
  isException?: boolean;
}

export interface AppointmentBlock {
  id: string;
  start: Date;
  end: Date;
  clientId: string;
  type: string;
  clientName?: string;
}

export interface AppointmentData {
  id: string;
  client_id: string;
  date: string; 
  start_time: string;
  end_time: string;
  type: string;
  status: string;
}

export interface DayViewProps {
  currentDate: Date;
  clinicianId: string | null;
  refreshTrigger?: number;
  appointments?: AppointmentData[];
  getClientName?: (clientId: string) => string;
  onAppointmentClick?: (appointment: any) => void;
  onAvailabilityClick?: (date: Date, availabilityBlock: any) => void;
  userTimeZone?: string;
}

export interface TimeSlotProps {
  timeSlot: Date;
  isAvailable: boolean;
  currentBlock?: TimeBlock;
  appointment?: AppointmentBlock;
  isStartOfBlock: boolean;
  isEndOfBlock: boolean;
  isStartOfAppointment: boolean;
  handleAvailabilityBlockClick: (block: TimeBlock) => void;
  onAppointmentClick?: (appointmentId: string) => void;
  originalAppointments: AppointmentData[];
  formatDateToTime12Hour: (date: Date) => string;
}
