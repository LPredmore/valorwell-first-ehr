import React from 'react';
import { formatDateToTime12Hour } from '@/utils/timeZoneUtils';
import { TimeBlock, AppointmentBlock } from './types';
import { Appointment } from '@/types/appointment';
import { isStartOfBlock, isEndOfBlock, isStartOfAppointment } from './utils';
import { addMinutes } from 'date-fns';

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
  // Create a class for continuous blocks with consistent border styling
  let continuousBlockClass = "";

  if (isAvailable && !appointment) {
    if (isStartOfBlock && isEndOfBlock) {
      continuousBlockClass = "rounded";
    } else if (isStartOfBlock) {
      continuousBlockClass = "rounded-t border-b-0";
    } else if (isEndOfBlock) {
      continuousBlockClass = "rounded-b";
    } else {
      continuousBlockClass = "border-t-0 border-b-0";
    }
  }

  // For appointments, handle styling to ensure visual continuity
  if (appointment) {
    // Find the corresponding original appointment
    const originalAppointment = originalAppointments.find(app => 
      app.id === appointment.id
    );
    
    // Handle appointment click event
    const handleAppointmentClick = () => {
      if (onAppointmentClick && originalAppointment) {
        onAppointmentClick(originalAppointment);
      }
    };
    
    // Base appointment styling that's consistent for all cells
    const baseAppointmentClass = "p-1 bg-blue-100 border-l-4 border-blue-500 h-full cursor-pointer transition-colors";
    
    // Position-specific styling
    let positionClass = "";
    
    if (isStartOfAppointment) {
      // Top of appointment
      positionClass = "rounded-t border-t border-r border-l";
      if (!isEndOfBlock) {
        positionClass += " border-b-0";
      }
    } else {
      // Middle sections - no top border
      positionClass = "border-r border-l border-t-0";
      if (!isEndOfBlock) {
        positionClass += " border-b-0";
      }
    }
    
    // Add bottom rounding if it's the end
    if (isEndOfBlock) {
      positionClass += " rounded-b border-b";
    }

    // For the start of an appointment, show client name
    if (isStartOfAppointment) {
      return (
        <div 
          className={`${baseAppointmentClass} ${positionClass} text-xs font-medium truncate hover:bg-blue-200`}
          onClick={handleAppointmentClick}
        >
          {appointment.clientName}
        </div>
      );
    } 
    
    // For continuation cells
    return (
      <div 
        className={`${baseAppointmentClass} ${positionClass} text-xs opacity-75 hover:bg-blue-200`}
        onClick={handleAppointmentClick}
      >
        {/* Continuation of appointment */}
      </div>
    );
  } 
  
  // For availability blocks, ensure visual continuity
  if (isAvailable) {
    const availabilityBaseClass = currentBlock?.isException 
      ? 'bg-teal-100 border-teal-500' 
      : 'bg-green-100 border-green-500';
    
    // Complete class set for availability, with consistent borders
    let availabilityClass = `p-1 ${availabilityBaseClass} border-l-4 border-r border-l`;
    
    // Apply top/bottom borders and rounding based on position
    if (isStartOfBlock) {
      availabilityClass += " border-t rounded-t";
    } else {
      availabilityClass += " border-t-0";
    }
    
    if (isEndOfBlock) {
      availabilityClass += " border-b rounded-b";
    } else {
      availabilityClass += " border-b-0";
    }
    
    return (
      <div
        className={`${availabilityClass} h-full text-xs cursor-pointer hover:bg-opacity-80 transition-colors`}
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
