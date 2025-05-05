
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

  if (appointment && isStartOfAppointment) {
    return (
      <div 
        className="p-1 bg-blue-50 border-l-4 border-blue-500 rounded h-full text-xs font-medium truncate cursor-pointer hover:bg-blue-100 transition-colors"
        onClick={() => {
          if (onAppointmentClick) {
            const originalAppointment = originalAppointments.find(app => 
              app.id === appointment.id
            );
            if (originalAppointment) {
              onAppointmentClick(originalAppointment);
            }
          }
        }}
      >
        {appointment.clientName}
      </div>
    );
  } 
  
  if (appointment && !isStartOfAppointment) {
    return (
      <div 
        className="p-1 bg-blue-50 border-l-4 border-blue-500 border-t-0 h-full text-xs opacity-75 cursor-pointer hover:bg-blue-100 transition-colors"
        onClick={() => {
          if (onAppointmentClick) {
            const originalAppointment = originalAppointments.find(app => 
              app.id === appointment.id
            );
            if (originalAppointment) {
              onAppointmentClick(originalAppointment);
            }
          }
        }}
      >
        {/* Continuation of appointment */}
      </div>
    );
  } 
  
  if (isAvailable) {
    return (
      <div
        className={`p-1 ${currentBlock?.isException ? 'bg-teal-50 border-teal-500' : 'bg-green-50 border-green-500'} border-l-4 ${continuousBlockClass} h-full text-xs`}
      >
        {isStartOfBlock && (
          <div className="font-medium truncate flex items-center">
            Available
            {currentBlock?.isException && (
              <span className="ml-1 text-[10px] px-1 py-0.5 bg-teal-100 text-teal-800 rounded-full">Modified</span>
            )}
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className="h-full w-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-gray-400">
      Unavailable
    </div>
  );
};

export default TimeSlot;
