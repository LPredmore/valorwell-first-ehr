
import React from 'react';
import { useAppointments } from '@/hooks/useAppointments';
import Calendar from './Calendar';

interface CalendarViewProps {
  view: 'week' | 'month';
  showAvailability: boolean;
  clinicianId: string | null;
  currentDate?: Date;
  userTimeZone: string;
  refreshTrigger?: number;
}

const CalendarView: React.FC<CalendarViewProps> = ({
  view,
  showAvailability,
  clinicianId,
  currentDate = new Date(),
  userTimeZone,
  refreshTrigger = 0
}) => {
  // Use the appointments hook to fetch appointments
  const { 
    appointments, 
    isLoading: loadingAppointments, 
    error,
    refetch
  } = useAppointments(clinicianId);
  
  // Trigger a refresh when the refresh trigger changes
  React.useEffect(() => {
    if (refreshTrigger > 0) {
      refetch();
    }
  }, [refreshTrigger, refetch]);

  // Function to get client name from an appointment
  const getClientName = (clientId: string): string => {
    const appointment = appointments.find(app => app.client_id === clientId);
    return appointment?.client?.client_preferred_name && appointment?.client?.client_last_name
      ? `${appointment.client.client_preferred_name} ${appointment.client.client_last_name}`
      : 'Client';
  };

  return (
    <Calendar 
      view={view}
      showAvailability={showAvailability}
      clinicianId={clinicianId}
      currentDate={currentDate}
      userTimeZone={userTimeZone}
      refreshTrigger={refreshTrigger}
    />
  );
};

export default CalendarView;
