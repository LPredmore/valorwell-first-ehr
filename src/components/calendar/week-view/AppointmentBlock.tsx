
import React from 'react';
import { format } from 'date-fns';
import { AppointmentBlockType, Appointment } from './types/availability-types';

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
  // Calculate position and height based on start and end time
  const startHour = appointment.start.getHours() + (appointment.start.getMinutes() / 60);
  const endHour = appointment.end.getHours() + (appointment.end.getMinutes() / 60);
  const duration = endHour - startHour;
  
  const top = startHour * hourHeight + 56; // 56px is the header height
  const height = duration * hourHeight;

  const handleClick = () => {
    if (onAppointmentClick) {
      const originalAppointment = originalAppointments.find(app => 
        app.id === appointment.id
      );
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
            {format(appointment.start, 'h:mm a')} - {format(appointment.end, 'h:mm a')}
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentBlock;
