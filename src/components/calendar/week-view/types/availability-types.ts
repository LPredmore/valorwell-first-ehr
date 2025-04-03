
import { Dispatch, SetStateAction } from 'react';

export interface Appointment {
  id: string;
  client_id: string;
  date: string;
  start_time: string;
  end_time: string;
  type: string;
  status: string;
  video_room_url?: string | null;
}

export interface AvailabilityBlock {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  clinician_id?: string;
  is_active?: boolean;
  isException?: boolean;
  isStandalone?: boolean;
  originalAvailabilityId?: string | null;
}

export interface AvailabilityException {
  id: string;
  specific_date: string;
  original_availability_id: string | null;
  start_time: string | null;
  end_time: string | null;
  is_deleted: boolean;
  clinician_id: string;
}

export interface TimeBlock {
  id: string;
  day: Date;
  start: Date;
  end: Date;
  availabilityIds: string[];
  isException?: boolean;
  isStandalone?: boolean;
  originalAvailabilityId?: string | null;
}

export interface AppointmentBlock {
  id: string;
  day: Date;
  start: Date;
  end: Date;
  clientId: string;
  type: string;
  clientName?: string;
}

export interface TimeSlotUtils {
  isTimeSlotAvailable: (day: Date, timeSlot: Date) => boolean;
  getBlockForTimeSlot: (day: Date, timeSlot: Date) => TimeBlock | undefined;
  getAppointmentForTimeSlot: (day: Date, timeSlot: Date) => AppointmentBlock | undefined;
}

export interface WeekViewDataResult extends TimeSlotUtils {
  loading: boolean;
  timeBlocks: TimeBlock[];
  appointmentBlocks: AppointmentBlock[];
  exceptions: AvailabilityException[];
  availabilityBlocks: AvailabilityBlock[];
  getAvailabilityForBlock: (blockId: string) => AvailabilityBlock | undefined;
}

export interface UseWeekViewDataParams {
  days: Date[];
  clinicianId: string | null;
  refreshTrigger?: number;
  appointments?: Appointment[];
  getClientName?: (clientId: string) => string;
}
