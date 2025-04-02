
import React from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import CalendarHeader from './CalendarHeader';
import CalendarContent from './CalendarContent';
import CalendarDialogs from './CalendarDialogs';
import { useCalendarState } from './useCalendarState';
import AvailabilityPanel from './AvailabilityPanel';
import DayView from './day-view/DayView';
import WeekView from './WeekView';
import MonthView from './MonthView';

interface CalendarViewProps {
  view: 'day' | 'week' | 'month';
  showAvailability: boolean;
  clinicianId: string | null;
  userTimeZone?: string;
  refreshTrigger?: number;
}

const CalendarView: React.FC<CalendarViewProps> = ({
  view,
  showAvailability,
  clinicianId,
  userTimeZone: propTimeZone,
  refreshTrigger = 0
}) => {
  const {
    currentDate,
    userTimeZone,
    isLoadingTimeZone,
    appointments,
    availabilityRefreshTrigger,
    selectedAppointment,
    isDetailsDialogOpen,
    selectedAvailability,
    selectedAvailabilityDate,
    isAvailabilityDialogOpen,
    navigatePrevious,
    navigateNext,
    navigateToday,
    getClientName,
    getClientTimeZone,
    handleAppointmentClick,
    handleAppointmentUpdated,
    handleAvailabilityClick,
    handleAvailabilityUpdated,
    setIsDetailsDialogOpen,
    setIsAvailabilityDialogOpen
  } = useCalendarState({
    view,
    clinicianId,
    propTimeZone,
    refreshTrigger
  });

  return (
    <div className="flex flex-col space-y-4">
      <CalendarHeader
        currentDate={currentDate}
        view={view}
        userTimeZone={userTimeZone}
        isLoadingTimeZone={isLoadingTimeZone}
        navigatePrevious={navigatePrevious}
        navigateNext={navigateNext}
        navigateToday={navigateToday}
      />

      <CalendarContent
        view={view}
        showAvailability={showAvailability}
        currentDate={currentDate}
        clinicianId={clinicianId}
        refreshTrigger={availabilityRefreshTrigger}
        appointments={appointments}
        getClientName={getClientName}
        onAppointmentClick={handleAppointmentClick}
        onAvailabilityClick={handleAvailabilityClick}
        userTimeZone={userTimeZone}
      />

      <CalendarDialogs
        isDetailsDialogOpen={isDetailsDialogOpen}
        isAvailabilityDialogOpen={isAvailabilityDialogOpen}
        selectedAppointment={selectedAppointment}
        selectedAvailability={selectedAvailability}
        selectedAvailabilityDate={selectedAvailabilityDate}
        clinicianId={clinicianId}
        userTimeZone={userTimeZone}
        clientTimeZone={selectedAppointment ? getClientTimeZone(selectedAppointment.client_id) : ''}
        onAppointmentUpdated={handleAppointmentUpdated}
        onAvailabilityUpdated={handleAvailabilityUpdated}
        onCloseDetailsDialog={() => setIsDetailsDialogOpen(false)}
        onCloseAvailabilityDialog={() => setIsAvailabilityDialogOpen(false)}
      />
    </div>
  );
};

export default CalendarView;
