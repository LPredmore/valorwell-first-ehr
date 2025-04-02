
import React from 'react';
import { TimeSlotProps } from './types';

const TimeSlot: React.FC<TimeSlotProps> = ({
  timeSlot,
  isAvailable,
  currentBlock,
  appointment,
  isStartOfBlock,
  isEndOfBlock,
  isStartOfAppointment,
  handleAvailabilityBlockClick,
  onAppointmentClick,
  originalAppointments,
  formatDateToTime12Hour
}) => {
  let showContinuousBlock = false;
  let continuousBlockClass = "";

  if (isAvailable && !appointment) {
    showContinuousBlock = true;

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

  const handleAppointmentClick = () => {
    if (onAppointmentClick && appointment) {
      const originalAppointment = originalAppointments.find(app => app.id === appointment.id);
      if (originalAppointment) {
        onAppointmentClick(originalAppointment.id);
      }
    }
  };

  return (
    <div className="flex-1">
      {appointment && isStartOfAppointment ? (
        <div 
          className="p-2 bg-blue-50 border-l-4 border-blue-500 rounded text-sm h-full cursor-pointer hover:bg-blue-100 transition-colors"
          onClick={handleAppointmentClick}
        >
          <div className="font-medium">{appointment.clientName}</div>
          <div className="text-xs text-gray-600">
            {appointment.type} - {formatDateToTime12Hour(appointment.start)} to {formatDateToTime12Hour(appointment.end)}
          </div>
        </div>
      ) : appointment && !isStartOfAppointment ? (
        <div 
          className="p-2 bg-blue-50 border-l-4 border-blue-500 border-t-0 text-sm h-full opacity-75 cursor-pointer hover:bg-blue-100 transition-colors"
          onClick={handleAppointmentClick}
        >
          {/* Continuation of appointment block */}
        </div>
      ) : showContinuousBlock ? (
        <div
          className={`p-2 ${currentBlock?.isException ? 'bg-teal-50 border-teal-500' : 'bg-green-50 border-green-500'} border-l-4 ${continuousBlockClass} rounded text-sm h-full cursor-pointer hover:opacity-90 transition-colors`}
          onClick={() => currentBlock && handleAvailabilityBlockClick(currentBlock)}
        >
          {isStartOfBlock && (
            <>
              <div className="font-medium flex items-center">
                Available
                {currentBlock?.isException && (
                  <span className="ml-2 text-xs px-1.5 py-0.5 bg-teal-100 text-teal-800 rounded-full">Modified</span>
                )}
              </div>
              <div className="text-xs text-gray-600">
                {formatDateToTime12Hour(currentBlock!.start)} - {formatDateToTime12Hour(currentBlock!.end)}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="h-full w-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs text-gray-400">
          Unavailable
        </div>
      )}
    </div>
  );
};

export default TimeSlot;
