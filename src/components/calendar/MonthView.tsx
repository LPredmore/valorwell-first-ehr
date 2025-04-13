import React, { useState, useEffect } from 'react';
import { format, isEqual, isSameDay, isSameMonth, isToday, parseISO } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import WeekView from './week-view/WeekView';
import { formatUTCInTimeZone, ensureIANATimeZone, getUserTimeZone } from '@/utils/timeZoneUtils';

// Define interfaces for our props and data structures
interface MonthViewProps {
  currentDate: Date;
  clinicianId: string | null;
  refreshTrigger?: number;
  appointments: any[];
  getClientName: (clientId: string) => string;
  onAppointmentClick: (appointment: any) => void;
  onAvailabilityClick?: (date: Date, availabilityBlock: any) => void;
  userTimeZone?: string;
  weekViewMode?: boolean;
}

const MonthView: React.FC<MonthViewProps> = ({
  currentDate,
  clinicianId,
  refreshTrigger = 0,
  appointments,
  getClientName,
  onAppointmentClick,
  onAvailabilityClick,
  userTimeZone: propTimeZone,
  weekViewMode = false,
}) => {
  // Use the provided time zone or get the user's time zone
  const userTimeZone = ensureIANATimeZone(propTimeZone || getUserTimeZone());
  
  // Format appointments for display using the new UTC timestamp fields if available
  const formatAppointmentsForDisplay = (appointments: any[]) => {
    return appointments.map(appointment => {
      // Try to get date and time from the new appointment_datetime field if available
      let displayDate = appointment.date;
      let displayStartTime = appointment.start_time;
      let displayEndTime = appointment.end_time || '';
      
      // If we have the new UTC timestamp fields, use them
      if (appointment.appointment_datetime) {
        try {
          // Extract the date and time parts in the user's timezone
          displayDate = formatUTCInTimeZone(appointment.appointment_datetime, userTimeZone, 'yyyy-MM-dd');
          displayStartTime = formatUTCInTimeZone(appointment.appointment_datetime, userTimeZone, 'HH:mm');
          
          if (appointment.appointment_end_datetime) {
            displayEndTime = formatUTCInTimeZone(appointment.appointment_end_datetime, userTimeZone, 'HH:mm');
          }
          
          console.log(`[MonthView] Converted appointment ${appointment.id} time:`, {
            utc: appointment.appointment_datetime,
            localDate: displayDate,
            localTime: displayStartTime,
            timezone: userTimeZone
          });
        } catch (error) {
          console.error('[MonthView] Error formatting appointment datetime:', error);
          // Fall back to using the raw fields
        }
      }
      
      return {
        ...appointment,
        displayDate,
        displayStartTime,
        displayEndTime,
      };
    });
  };
  
  // Format appointments for display
  const formattedAppointments = formatAppointmentsForDisplay(appointments);
  
  // If in week view mode, just render the WeekView component
  if (weekViewMode) {
    return (
      <WeekView
        currentDate={currentDate}
        clinicianId={clinicianId}
        refreshTrigger={refreshTrigger}
        appointments={formattedAppointments} // Pass formatted appointments
        getClientName={getClientName}
        onAppointmentClick={onAppointmentClick}
        onAvailabilityClick={onAvailabilityClick}
        userTimeZone={userTimeZone}
      />
    );
  }

  // Month view implementation
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 (Sunday) to 6 (Saturday)

  // Create a date array for the entire month, starting from the correct day of the week
  const dates: Date[] = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    dates.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), -i));
  }
  dates.reverse(); // Reverse to have the correct order
  for (let i = 1; i <= daysInMonth; i++) {
    dates.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
  }

  const getDayAppointments = (date: Date) => {
    return formattedAppointments.filter(appointment => {
      return appointment.displayDate && isEqual(parseISO(appointment.displayDate), date);
    });
  };

  const renderDay = (date: Date) => {
    const dayAppointments = getDayAppointments(date);
    const isCurrentMonth = isSameMonth(date, currentDate);
    const isTodayDate = isToday(date);

    return (
      <div
        key={date.toISOString()}
        className={cn(
          "h-24 w-32 border p-1 text-sm transition-colors",
          !isCurrentMonth && "text-muted-foreground",
          isTodayDate && "font-semibold",
          "hover:bg-accent hover:text-accent-foreground focus:bg-secondary focus:text-secondary-foreground"
        )}
      >
        <div className="mb-1 flex items-center justify-between">
          <div className="font-semibold">{format(date, 'd')}</div>
        </div>
        {dayAppointments.map(appointment => (
          <div
            key={appointment.id}
            className="rounded-md bg-muted p-1 text-xs"
            onClick={() => onAppointmentClick(appointment)}
          >
            {getClientName(appointment.client_id)}
          </div>
        ))}
      </div>
    );
  };
  
  return (
    <Card>
      <CardContent className="p-1">
        <div className="grid w-full grid-cols-7">
          {dates.map(date => renderDay(date))}
        </div>
      </CardContent>
    </Card>
  );
};

export default MonthView;
