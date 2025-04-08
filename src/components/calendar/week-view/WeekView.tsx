
import React, { useMemo } from 'react';
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addHours,
  startOfDay,
  addMinutes,
  isSameDay
} from 'date-fns';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useWeekViewData } from './useWeekViewData';
import { WeekViewProps } from './types';
import AppointmentBlock from './AppointmentBlock';
import AvailabilityBlock from './AvailabilityBlock';
import TimeColumn from './TimeColumn';

const WeekView: React.FC<WeekViewProps> = ({ 
  currentDate, 
  clinicianId, 
  refreshTrigger = 0,
  appointments = [],
  getClientName = () => 'Client',
  onAppointmentClick,
  onAvailabilityClick
}) => {
  // Create array of days for the week and time slots for each day
  const { days, hours } = useMemo(() => {
    const days = eachDayOfInterval({
      start: startOfWeek(currentDate, { weekStartsOn: 0 }),
      end: endOfWeek(currentDate, { weekStartsOn: 0 })
    });

    // Create hours starting from 6am, going to 12am the next day (18 hours total)
    const hours = Array.from({ length: 18 }, (_, i) => i + 6);

    return { days, hours };
  }, [currentDate]);

  // Use the custom hook to get all the data
  const {
    loading,
    timeBlocks,
    appointmentBlocks
  } = useWeekViewData(days, clinicianId, refreshTrigger, appointments, getClientName);

  // Calculate the height of each hour cell
  const hourHeight = 60; // pixels per hour

  if (loading) {
    return (
      <Card className="p-4 flex justify-center items-center h-[300px]">
        <Loader2 className="h-6 w-6 animate-spin text-valorwell-500" />
      </Card>
    );
  }

  return (
    <Card className="p-4 overflow-hidden">
      <div className="grid grid-cols-8 h-[1080px]">
        {/* Time column */}
        <TimeColumn hours={hours} hourHeight={hourHeight} />

        {/* Days columns */}
        {days.map((day, dayIndex) => (
          <div key={day.toString()} className="col-span-1 relative">
            {/* Day header */}
            <div className="h-14 border-b border-gray-200 flex flex-col items-center justify-center">
              <div className="text-sm text-gray-500">{format(day, 'EEE')}</div>
              <div className={`text-lg ${format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? 
                'bg-valorwell-500 text-white rounded-full w-8 h-8 flex items-center justify-center' : ''}`}>
                {format(day, 'd')}
              </div>
            </div>

            {/* Hour cells background */}
            {hours.map((hour) => (
              <div 
                key={hour} 
                className="w-full border-b border-gray-200" 
                style={{ height: `${hourHeight}px` }}
              >
                {/* Half-hour divider */}
                <div className="w-full h-1/2 border-b border-gray-100"></div>
              </div>
            ))}

            {/* Appointment blocks - rendered on top using absolute positioning */}
            {appointmentBlocks
              .filter(appt => isSameDay(appt.day, day))
              .map(appointment => (
                <AppointmentBlock 
                  key={appointment.id}
                  appointment={appointment}
                  hourHeight={hourHeight}
                  onAppointmentClick={onAppointmentClick}
                  originalAppointments={appointments}
                />
              ))}

            {/* Availability blocks - rendered with a lower z-index than appointments */}
            {timeBlocks
              .filter(block => isSameDay(block.day, day))
              .map((block, index) => (
                <AvailabilityBlock
                  key={`${block.availabilityIds.join('-')}-${index}`}
                  block={block}
                  day={day}
                  hourHeight={hourHeight}
                  onAvailabilityClick={onAvailabilityClick ? 
                    (day, block) => onAvailabilityClick(day, block) : 
                    undefined}
                />
              ))}
          </div>
        ))}
      </div>
    </Card>
  );
};

export default WeekView;
