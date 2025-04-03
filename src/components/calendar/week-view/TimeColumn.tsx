import React from 'react';
import { format } from 'date-fns';
import { AppointmentBlock } from '..';
import { AvailabilityBlockComponent } from '..';
import { TimeBlock, AppointmentBlockType, Appointment as AppointmentType } from '../types/availability-types';

interface TimeColumnProps {
  day: Date;
  timeSlots: Date[];
  hourHeight: number;
  timeBlocks: TimeBlock[];
  appointmentBlocks: AppointmentBlockType[];
  onAppointmentClick?: (appointment: AppointmentType) => void;
  onAvailabilityClick?: (day: Date, block: TimeBlock) => void;
  originalAppointments: AppointmentType[];
}

const TimeColumn: React.FC<TimeColumnProps> = ({
  day,
  timeSlots,
  hourHeight,
  timeBlocks,
  appointmentBlocks,
  onAppointmentClick,
  onAvailabilityClick,
  originalAppointments
}) => {
  return (
    <div className="relative h-full">
      {timeSlots.map((timeSlot, index) => {
        const timeSlotString = format(timeSlot, 'HH:mm');
        const isFullHour = timeSlotString.endsWith('00');

        return (
          <React.Fragment key={timeSlot.toISOString()}>
            {isFullHour && index > 0 && (
              <div
                className="absolute left-0 top-0 w-full border-b border-gray-200"
                style={{ top: `${(index * hourHeight)}px` }}
              />
            )}
            <div
              className="absolute left-0 top-0 w-full"
              style={{ height: `${hourHeight}px`, top: `${(index * hourHeight)}px` }}
            >
              {/* Render Availability Blocks */}
              {timeBlocks.map(block => {
                if (block.day.toDateString() === day.toDateString()) {
                  return (
                    <AvailabilityBlockComponent
                      key={block.id}
                      block={block}
                      day={day}
                      hourHeight={hourHeight}
                      onAvailabilityClick={onAvailabilityClick}
                    />
                  );
                }
                return null;
              })}

              {/* Render Appointment Blocks */}
              {appointmentBlocks.map(appointment => {
                if (appointment.day.toDateString() === day.toDateString()) {
                  return (
                    <AppointmentBlock
                      key={appointment.id}
                      appointment={appointment}
                      hourHeight={hourHeight}
                      onAppointmentClick={onAppointmentClick}
                      originalAppointments={originalAppointments}
                    />
                  );
                }
                return null;
              })}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default TimeColumn;
