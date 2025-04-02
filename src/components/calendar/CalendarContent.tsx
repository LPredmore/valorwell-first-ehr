
import React from 'react';
import { cn } from '@/lib/utils';
import DayView from './DayView';
import WeekView from './WeekView';
import MonthView from './MonthView';
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
            onAvailabilityUpdated={onAvailabilityClick} 
            userTimeZone={userTimeZone} 
          />
        </div>
      )}
    </div>
  );
};

export default CalendarContent;
