
import React from 'react';
import WeekViewComponent from './week-view/WeekView';
import { Appointment } from '@/types/appointment';
import { AvailabilityBlock } from '@/types/availability';
import { DateTime } from 'luxon';

// Define the props that match what CalendarView is passing to WeekView
interface WeekViewProps {
  currentDate: Date;
  clinicianId: string | null;
  refreshTrigger?: number;
  appointments?: Appointment[];
  onAppointmentClick?: (appointment: Appointment) => void;
  onAvailabilityClick?: (date: DateTime | Date, availabilityBlock: AvailabilityBlock) => void;
  userTimeZone: string;
  isLoading?: boolean;
  error?: any;
}

// Create a wrapper component that passes props in the format expected by the week view implementation
const WeekView: React.FC<WeekViewProps> = ({
  currentDate,
  clinicianId,
  refreshTrigger = 0,
  appointments = [],
  onAppointmentClick,
  onAvailabilityClick,
  userTimeZone,
  isLoading = false,
  error = null
}) => {
  // Generate days array centered around currentDate
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Start from Sunday
  
  const days = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    return day;
  });

  return (
    <WeekViewComponent
      days={days}
      selectedClinicianId={clinicianId}
      userTimeZone={userTimeZone}
      showAvailability={true}
      refreshTrigger={refreshTrigger}
      appointments={appointments}
      onAppointmentClick={onAppointmentClick}
      onAvailabilityClick={onAvailabilityClick}
      currentDate={currentDate} // Pass currentDate to the implementation component
    />
  );
};

export default WeekView;
