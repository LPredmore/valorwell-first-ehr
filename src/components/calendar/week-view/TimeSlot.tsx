
import React from 'react';
import { format, differenceInMinutes, addMinutes } from 'date-fns';
import { TimeBlock, AppointmentBlock, Appointment } from './useWeekViewData';

interface TimeSlotProps {
  day: Date;
  timeSlot: Date;
  isAvailable: boolean;
  currentBlock?: TimeBlock;
  appointment?: AppointmentBlock;
  isStartOfBlock: boolean;
  isEndOfBlock: boolean;
  isStartOfAppointment: boolean;
  handleAvailabilityBlockClick: (day: Date, block: TimeBlock) => void;
  onAppointmentClick?: (appointment: Appointment) => void;
  originalAppointments: Appointment[];
}

const TimeSlot: React.FC<TimeSlotProps> = ({
  day,
  timeSlot,
  isAvailable,
  currentBlock,
  appointment,
  isStartOfBlock,
  isEndOfBlock,
  isStartOfAppointment,
  handleAvailabilityBlockClick,
  onAppointmentClick,
  originalAppointments
}) => {
  // Improved continuous block styling
  let continuousBlockClass = "";

  if (isAvailable && !appointment) {
    if (isStartOfBlock && isEndOfBlock) {
      continuousBlockClass = "rounded";
    } else if (isStartOfBlock) {
      continuousBlockClass = "rounded-t border-b-0";
    } else if (isEndOfBlock) {
      continuousBlockClass = "rounded-b border-t-0";
    } else {
      continuousBlockClass = "border-t-0 border-b-0";
    }
  }

  // For appointments, handle continuous styling
  if (appointment) {
    // Find the corresponding original appointment
    const originalAppointment = originalAppointments.find(app => 
      app.id === appointment.id
    );
    
    // Define appointment styling conditionally with "let" instead of "const" 
    let appointmentClass = "";
    
    // Add appropriate rounding and borders based on position in appointment
    if (isStartOfAppointment) {
      appointmentClass = "rounded-t border-b-0";
    } else {
      appointmentClass = "border-t-0"; 
    }
    
    // Add rounded bottom if it's the end of the appointment
    if (isEndOfBlock) {
      appointmentClass += " rounded-b border-b";
    } else {
      appointmentClass += " border-b-0";
    }

    // Render the start of an appointment with client name
    if (isStartOfAppointment) {
      return (
        <div 
          className={`p-1 bg-blue-100 border-l-4 border-blue-500 ${appointmentClass} h-full text-xs font-medium truncate cursor-pointer hover:bg-blue-200 transition-colors`}
          onClick={() => {
            if (onAppointmentClick && originalAppointment) {
              onAppointmentClick(originalAppointment);
            }
          }}
        >
          {appointment.clientName}
        </div>
      );
    } 
    
    // Render continuation of appointment without visual break
    return (
      <div 
        className={`p-1 bg-blue-100 border-l-4 border-blue-500 ${appointmentClass} h-full text-xs opacity-75 cursor-pointer hover:bg-blue-200 transition-colors`}
        onClick={() => {
          if (onAppointmentClick && originalAppointment) {
            onAppointmentClick(originalAppointment);
          }
        }}
      >
        {/* Continuation of appointment */}
      </div>
    );
  } 
  
  // For availability blocks, create a continuous effect
  if (isAvailable) {
    const availabilityBaseClass = currentBlock?.isException ? 'bg-teal-100 border-teal-500' : 'bg-green-100 border-green-500';
    
    return (
      <div
        className={`p-1 ${availabilityBaseClass} border-l-4 ${continuousBlockClass} h-full text-xs cursor-pointer hover:bg-opacity-80 transition-colors`}
        onClick={() => currentBlock && handleAvailabilityBlockClick(day, currentBlock)}
      >
        {isStartOfBlock && (
          <div className="font-medium truncate flex items-center">
            Available
            {currentBlock?.isException && (
              <span className="ml-1 text-[10px] px-1 py-0.5 bg-teal-200 text-teal-800 rounded-full">Modified</span>
            )}
          </div>
        )}
      </div>
    );
  }
  
  // Default empty cell with faded "Unavailable" text on hover
  return (
    <div className="h-full w-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-gray-400">
      Unavailable
    </div>
  );
};

export default TimeSlot;
