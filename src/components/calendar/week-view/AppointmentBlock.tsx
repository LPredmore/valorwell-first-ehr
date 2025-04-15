import React from 'react';
import { format } from 'date-fns';
import { AppointmentBlock as AppointmentBlockType, Appointment } from './useWeekViewData';
import { formatDateToTime12Hour } from '@/utils/timeZoneUtils';
import { useTimeZone } from '@/context/TimeZoneContext';

interface AppointmentBlockProps {
  appointment: AppointmentBlockType;
  hourHeight: number;
  onAppointmentClick?: (appointment: Appointment) => void;
  originalAppointments: Appointment[];
}

const AppointmentBlock: React.FC<AppointmentBlockProps> = ({
  appointment,
  hourHeight,
  onAppointmentClick,
  originalAppointments
}) => {
  const { userTimeZone } = useTimeZone();
  
  // Calculate position and height based on start and end time
  const startHour = appointment.start.getHours() + (appointment.start.getMinutes() / 60);
  const endHour = appointment.end.getHours() + (appointment.end.getMinutes() / 60);
  const duration = endHour - startHour;
  
  // First hour shown is 6 AM (index 0), so adjust position calculation
  // by subtracting 6 from the hour to get the correct vertical offset
  const displayStartHour = startHour - 6;
  const top = displayStartHour * hourHeight + 56; // 56px is the header height
  const height = duration * hourHeight;

  // Enhanced logging for appointment positioning
  console.log(`[AppointmentBlock] Rendering appointment ${appointment.id}:`, {
    clientName: appointment.clientName,
    date: format(appointment.day, 'yyyy-MM-dd'),
    startTime: format(appointment.start, 'HH:mm:ss'),
    endTime: format(appointment.end, 'HH:mm:ss'),
    startHour,
    displayStartHour, // Include the adjusted hour value
    endHour,
    duration,
    top,
    height,
    userTimeZone
  });

  // Find the original appointment details for the click handler
  const handleClick = () => {
    if (onAppointmentClick) {
      const originalAppointment = originalAppointments.find(app => 
        app.id === appointment.id
      );
      
      // Log the found original appointment for debugging
      console.log('[AppointmentBlock] Original appointment data for click:', 
        originalAppointment ? {
          id: originalAppointment.id,
          date: originalAppointment.date,
          start_time: originalAppointment.start_time,
          end_time: originalAppointment.end_time,
          hasUTC: originalAppointment.appointment_datetime ? true : false,
          utc_time: originalAppointment.appointment_datetime
        } : 'Not found');
        
      if (originalAppointment) {
        onAppointmentClick(originalAppointment);
      }
    }
  };

  return (
    <div 
      className="absolute left-0.5 right-0.5 z-10 rounded-md border border-blue-400 bg-blue-50 p-1 overflow-hidden cursor-pointer hover:bg-blue-100 transition-colors shadow-sm"
      style={{ 
        top: `${top}px`, 
        height: `${height}px`,
        maxHeight: `${Math.max(height, 24)}px` // Ensure minimum height for very short appointments
      }}
      onClick={handleClick}
    >
      <div className="flex flex-col h-full text-xs">
        <div className="font-medium truncate">{appointment.clientName}</div>
        {height >= 40 && (
          <div className="text-[10px] text-gray-500 mt-0.5">
            {formatDateToTime12Hour(appointment.start)} - {formatDateToTime12Hour(appointment.end)}
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentBlock;
