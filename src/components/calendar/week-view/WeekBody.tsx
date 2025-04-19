
import React from 'react';
import { format } from 'date-fns';
import { TimeBlock } from './types';

interface WeekBodyProps {
  days: Date[];
  timeBlocks: TimeBlock[];
  appointments: any[];
  onAppointmentClick?: (appointment: any) => void;
  onTimeBlockClick?: (day: Date, block: TimeBlock) => void;
}

// Generate time slots from 6 AM to 8 PM
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 6; hour <= 20; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
  }
  return slots;
};

const timeSlots = generateTimeSlots();

const WeekBody: React.FC<WeekBodyProps> = ({
  days,
  timeBlocks,
  appointments,
  onAppointmentClick,
  onTimeBlockClick
}) => {
  // Function to get availability blocks for a specific day and time
  const getAvailabilityForDayAndTime = (day: Date, timeStr: string) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const hour = parseInt(timeStr.split(':')[0]);
    
    return timeBlocks.filter(block => {
      const blockDayStr = format(block.day, 'yyyy-MM-dd');
      const blockStartHour = block.start.getHours();
      const blockEndHour = block.end.getHours();
      
      // Check if this block is for the right day
      if (blockDayStr !== dayStr) return false;
      
      // Check if this time slot is within the block's time range
      return blockStartHour <= hour && hour < blockEndHour;
    });
  };
  
  // Function to get appointments for a specific day and time
  const getAppointmentsForDayAndTime = (day: Date, timeStr: string) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const hour = parseInt(timeStr.split(':')[0]);
    
    return appointments.filter(appointment => {
      const appointmentDayStr = format(appointment.day, 'yyyy-MM-dd');
      const appointmentStartHour = appointment.start.getHours();
      const appointmentEndHour = appointment.end.getHours();
      
      // Check if this appointment is for the right day
      if (appointmentDayStr !== dayStr) return false;
      
      // Check if this time slot is within the appointment's time range
      return appointmentStartHour <= hour && hour < appointmentEndHour;
    });
  };
  
  return (
    <div className="grid grid-cols-8 gap-1 mt-1">
      {/* Time labels column */}
      <div className="space-y-1">
        {timeSlots.map((time, index) => (
          <div key={index} className="h-14 flex items-center justify-center text-xs text-gray-500">
            {time}
          </div>
        ))}
      </div>
      
      {/* Day columns */}
      {days.map((day, dayIndex) => (
        <div key={dayIndex} className="space-y-1">
          {timeSlots.map((time, timeIndex) => {
            const availabilityBlocks = getAvailabilityForDayAndTime(day, time);
            const dayAppointments = getAppointmentsForDayAndTime(day, time);
            const hasAvailability = availabilityBlocks.length > 0;
            const hasAppointment = dayAppointments.length > 0;
            
            return (
              <div 
                key={timeIndex} 
                className={`h-14 rounded border ${
                  hasAvailability 
                    ? 'bg-green-50 border-green-100 hover:bg-green-100 cursor-pointer' 
                    : 'bg-gray-50 border-gray-100'
                }`}
                onClick={() => {
                  if (hasAvailability && onTimeBlockClick && availabilityBlocks[0]) {
                    onTimeBlockClick(day, availabilityBlocks[0]);
                  }
                }}
              >
                {hasAppointment && dayAppointments.map((appointment, appIndex) => (
                  <div 
                    key={appIndex}
                    className="h-full w-full p-1 bg-blue-200 rounded text-xs overflow-hidden cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation(); // Stop propagation to parent
                      if (onAppointmentClick) {
                        onAppointmentClick(appointment);
                      }
                    }}
                  >
                    <div className="font-medium truncate">{appointment.clientName}</div>
                    <div className="text-[10px] text-gray-600">
                      {format(appointment.start, 'h:mm a')} - {format(appointment.end, 'h:mm a')}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default WeekBody;
