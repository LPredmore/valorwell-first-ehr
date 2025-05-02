
import React, { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import FullCalendarView from './FullCalendarView';
import { CalendarViewType } from '@/types/calendar';
import { useCalendarView } from '@/hooks/calendar/useCalendarView';
import { useDialogs } from '@/context/DialogContext';
import { DateTime } from 'luxon';

interface CalendarMainViewProps {
  clinicianId: string | null;
  timeZone: string;
  showAvailability: boolean;
  showAppointments: boolean;
  showTimeOff: boolean;
}

const CalendarMainView: React.FC<CalendarMainViewProps> = ({
  clinicianId,
  timeZone,
  showAvailability,
  showAppointments,
  showTimeOff,
}) => {
  const [calendarKey, setCalendarKey] = useState<number>(0);
  const { 
    view, 
    setView, 
    currentDate, 
    setCurrentDate, 
    goToNextPeriod, 
    goToPreviousPeriod, 
    goToToday,
    title 
  } = useCalendarView();
  
  const {
    openDialog,
    openAppointmentDialog,
    openAvailabilitySettings,
    openWeeklyAvailability,
    openSingleAvailability
  } = useDialogs();

  const handleCalendarRefresh = useCallback(() => {
    setCalendarKey(prev => prev + 1);
  }, []);

  const handleEventClick = useCallback((eventInfo: any) => {
    const event = eventInfo.event;
    const eventType = event.extendedProps?.eventType;
    const eventId = event.id;
    
    if (!eventId || !clinicianId) return;
    
    switch (eventType) {
      case 'availability':
        // Pass the day of week as a string parameter
        const dayOfWeek = DateTime.fromJSDate(event.start).toFormat('cccc').toLowerCase();
        openWeeklyAvailability(dayOfWeek);
        
        // Update dialog props with additional information
        openDialog('weeklyAvailability', {
          clinicianId,
          onAvailabilityUpdated: handleCalendarRefresh,
          selectedDate: dayOfWeek,
          availabilityId: eventId
        });
        break;
      case 'appointment':
        // Open appointment dialog and then update props
        openAppointmentDialog();
        
        // Update dialog props with additional information
        openDialog('appointment', {
          appointmentId: eventId,
          clinicianId,
          onAppointmentUpdated: handleCalendarRefresh
        });
        break;
      case 'time_off':
        // Open time off dialog
        openDialog('appointment', {
          isTimeOff: true,
          timeOffId: eventId,
          clinicianId,
          onTimeOffUpdated: handleCalendarRefresh
        });
        break;
      default:
        console.warn('Unknown event type clicked:', eventType);
    }
  }, [clinicianId, openWeeklyAvailability, openAppointmentDialog, openDialog, handleCalendarRefresh]);

  const handleDateSelect = useCallback((selectInfo: any) => {
    const { start, end, allDay } = selectInfo;
    
    if (!clinicianId) return;
    
    // Determine which dialog to open based on the current view and selection
    const startDateTime = DateTime.fromJSDate(start);
    const endDateTime = DateTime.fromJSDate(end);
    const duration = endDateTime.diff(startDateTime, 'minutes').minutes;
    
    // If it's a short duration (< 4 hours), assume it's an appointment
    if (duration < 240 && !allDay) {
      // Open appointment dialog and then update props
      openAppointmentDialog();
      
      // Update dialog props with additional information
      openDialog('appointment', {
        startTime: start,
        endTime: end,
        clinicianId,
        onAppointmentCreated: handleCalendarRefresh
      });
    } 
    // If it's all day or longer duration, ask what type of event to create
    else {
      // Open the event type selector dialog
      openDialog('eventTypeSelector', {
        startTime: start,
        endTime: end,
        clinicianId,
        allDay,
        onEventCreated: handleCalendarRefresh
      });
    }
  }, [clinicianId, openAppointmentDialog, openDialog, handleCalendarRefresh]);

  const handleViewChange = useCallback((newView: CalendarViewType) => {
    setView(newView);
  }, [setView]);

  return (
    <Card className="p-4">
      <div className="mb-4 flex justify-between items-center">
        <div className="flex space-x-2">
          <button 
            onClick={goToPreviousPeriod}
            className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-100"
          >
            Previous
          </button>
          <button 
            onClick={goToToday}
            className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-100"
          >
            Today
          </button>
          <button 
            onClick={goToNextPeriod}
            className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-100"
          >
            Next
          </button>
        </div>
        
        <h2 className="text-xl font-semibold">{title}</h2>
        
        <div className="flex space-x-2">
          <button 
            onClick={() => handleViewChange('dayGridMonth')}
            className={`px-3 py-1 rounded border ${view === 'dayGridMonth' ? 'bg-blue-100 border-blue-300' : 'border-gray-300 hover:bg-gray-100'}`}
          >
            Month
          </button>
          <button 
            onClick={() => handleViewChange('timeGridWeek')}
            className={`px-3 py-1 rounded border ${view === 'timeGridWeek' ? 'bg-blue-100 border-blue-300' : 'border-gray-300 hover:bg-gray-100'}`}
          >
            Week
          </button>
          <button 
            onClick={() => handleViewChange('timeGridDay')}
            className={`px-3 py-1 rounded border ${view === 'timeGridDay' ? 'bg-blue-100 border-blue-300' : 'border-gray-300 hover:bg-gray-100'}`}
          >
            Day
          </button>
        </div>
      </div>
      
      <FullCalendarView
        key={calendarKey}
        clinicianId={clinicianId}
        userTimeZone={timeZone}
        view={view as "dayGridMonth" | "timeGridWeek" | "timeGridDay" | "listWeek"}
        height="700px"
        showAvailability={showAvailability}
        onAvailabilityClick={handleEventClick}
      />
    </Card>
  );
};

export default CalendarMainView;
