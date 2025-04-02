
import React from 'react';
import { cn } from '@/lib/utils';
import DayView from './day-view/DayView';
import WeekView from './WeekView';
import MonthView from './MonthView';
import AvailabilityPanel from './AvailabilityPanel';
import { Appointment, AvailabilityBlock } from './useCalendarState';

interface CalendarContentProps {
  view: 'day' | 'week' | 'month';
  showAvailability: boolean;
  currentDate: Date;
  clinicianId: string | null;
  refreshTrigger: number;
  appointments: Appointment[];
  getClientName: (clientId: string) => string;
  onAppointmentClick: (appointment: Appointment) => void;
  onAvailabilityClick: (date: Date, availabilityBlock: AvailabilityBlock) => void;
  userTimeZone: string;
}

const CalendarContent: React.FC<CalendarContentProps> = ({
  view,
  showAvailability,
  currentDate,
  clinicianId,
  refreshTrigger,
  appointments,
  getClientName,
  onAppointmentClick,
  onAvailabilityClick,
  userTimeZone
}) => {
  // Create a wrapper function that calls onAvailabilityClick without parameters
  const handleAvailabilityUpdated = () => {
    // This function doesn't need parameters as it's just a trigger for refresh
    if (onAvailabilityClick) {
      // Since we just need to trigger a refresh, we can call with dummy parameters
      // The actual parameters will be set elsewhere when a specific availability is clicked
      const dummyDate = new Date();
      const dummyBlock = {} as AvailabilityBlock;
      onAvailabilityClick(dummyDate, dummyBlock);
    }
  };

  return (
    <div className="flex gap-4">
      <div className={cn("flex-1", showAvailability ? "w-3/4" : "w-full")}>
        {view === 'day' && (
          <DayView 
            currentDate={currentDate} 
            clinicianId={clinicianId} 
            refreshTrigger={refreshTrigger} 
            appointments={appointments.filter(app => app.date === new Date(currentDate).toISOString().split('T')[0])} 
            getClientName={getClientName} 
            onAppointmentClick={onAppointmentClick} 
            onAvailabilityClick={onAvailabilityClick}
            userTimeZone={userTimeZone} 
          />
        )}
        {view === 'week' && (
          <WeekView 
            currentDate={currentDate} 
            clinicianId={clinicianId} 
            refreshTrigger={refreshTrigger} 
            appointments={appointments} 
            getClientName={getClientName} 
            onAppointmentClick={onAppointmentClick} 
            onAvailabilityClick={onAvailabilityClick}
            userTimeZone={userTimeZone} 
          />
        )}
        {view === 'month' && (
          <MonthView 
            currentDate={currentDate} 
            clinicianId={clinicianId} 
            refreshTrigger={refreshTrigger} 
            appointments={appointments} 
            getClientName={getClientName} 
            onAppointmentClick={onAppointmentClick} 
            onAvailabilityClick={onAvailabilityClick}
            userTimeZone={userTimeZone} 
          />
        )}
      </div>

      {showAvailability && (
        <div className="w-1/4">
          <AvailabilityPanel 
            clinicianId={clinicianId} 
            onAvailabilityUpdated={handleAvailabilityUpdated} 
            userTimeZone={userTimeZone} 
          />
        </div>
      )}
    </div>
  );
};

export default CalendarContent;
