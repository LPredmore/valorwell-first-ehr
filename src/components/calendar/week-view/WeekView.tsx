
import React, { useMemo, useEffect, useState } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addHours, startOfDay, addMinutes, isSameDay } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useWeekViewData } from './useWeekViewData';
import { WeekViewProps } from './types';
import AppointmentBlock from './AppointmentBlock';
import AvailabilityBlock from './AvailabilityBlock';
import TimeColumn from './TimeColumn';
import { useTimeZone } from '@/context/TimeZoneContext';

const WeekView: React.FC<WeekViewProps> = ({ 
  currentDate, 
  clinicianId, 
  refreshTrigger = 0,
  appointments = [],
  getClientName = () => 'Client',
  onAppointmentClick,
  onAvailabilityClick,
  userTimeZone
}) => {
  const { userTimeZone: contextTimeZone } = useTimeZone();
  const effectiveTimeZone = userTimeZone || contextTimeZone;
  const [errorState, setErrorState] = useState<string | null>(null);

  const { days, hours } = useMemo(() => {
    const days = eachDayOfInterval({
      start: startOfWeek(currentDate, { weekStartsOn: 0 }),
      end: endOfWeek(currentDate, { weekStartsOn: 0 })
    });

    const hours = Array.from({ length: 18 }, (_, i) => i + 6);

    return { days, hours };
  }, [currentDate]);

  useEffect(() => {
    console.log(`[WeekView] Received ${appointments.length} appointments with timezone ${effectiveTimeZone}:`, 
      appointments.map(app => ({
        id: app.id,
        date: app.date,
        start: app.start_time,
        end: app.end_time,
        clientId: app.client_id,
        hasUTC: app.appointment_datetime ? true : false
      }))
    );
  }, [appointments, effectiveTimeZone]);

  const {
    loading,
    timeBlocks,
    appointmentBlocks,
    error
  } = useWeekViewData(days, clinicianId, refreshTrigger, appointments, getClientName, effectiveTimeZone);

  const hourHeight = 60;

  useEffect(() => {
    if (appointmentBlocks.length > 0) {
      console.log('[WeekView] Appointment blocks for rendering:', appointmentBlocks.map(block => ({
        id: block.id,
        clientName: block.clientName,
        day: format(block.day, 'yyyy-MM-dd'),
        start: format(block.start, 'HH:mm:ss'),
        end: format(block.end, 'HH:mm:ss'),
        startHour: block.start.getHours() + (block.start.getMinutes() / 60),
        endHour: block.end.getHours() + (block.end.getMinutes() / 60)
      })));
    }
  }, [appointmentBlocks]);

  useEffect(() => {
    if (timeBlocks.length > 0) {
      console.log('[WeekView] Time blocks for rendering:', timeBlocks.map(block => ({
        day: format(block.day, 'yyyy-MM-dd'),
        start: format(block.start, 'HH:mm'),
        end: format(block.end, 'HH:mm'),
        startHour: block.start.getHours() + (block.start.getMinutes() / 60),
        endHour: block.end.getHours() + (block.end.getMinutes() / 60)
      })));
    }
  }, [timeBlocks]);

  try {
    console.log('[WeekView] Rendering with props:', {
      currentDate: currentDate?.toISOString(),
      clinicianId,
      refreshTrigger,
      appointmentsCount: appointments.length,
      userTimeZone: effectiveTimeZone
    });

    if (loading) {
      return (
        <Card className="p-4 flex justify-center items-center h-[300px]">
          <Loader2 className="h-6 w-6 animate-spin text-valorwell-500" />
        </Card>
      );
    }

    if (error) {
      return (
        <Card className="p-4 flex justify-center items-center h-[300px]">
          <div className="text-center text-red-500">
            <p className="mb-2 font-medium">Error displaying calendar</p>
            <p>{error}</p>
          </div>
        </Card>
      );
    }

    return (
      <Card className="p-4 overflow-hidden">
        <div className="grid grid-cols-8 h-[1080px]">
          <TimeColumn hours={hours} hourHeight={hourHeight} />

          {days.map((day, dayIndex) => (
            <div key={day.toString()} className="col-span-1 relative">
              <div className="h-14 border-b border-gray-200 flex flex-col items-center justify-center">
                <div className="text-sm text-gray-500">{format(day, 'EEE')}</div>
                <div className={`text-lg ${format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? 
                  'bg-valorwell-500 text-white rounded-full w-8 h-8 flex items-center justify-center' : ''}`}>
                  {format(day, 'd')}
                </div>
              </div>

              {hours.map((hour) => (
                <div 
                  key={hour} 
                  className="w-full border-b border-gray-200" 
                  style={{ height: `${hourHeight}px` }}
                >
                  <div className="w-full h-1/2 border-b border-gray-100"></div>
                </div>
              ))}

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
  } catch (error) {
    console.error('[WeekView] Error rendering component:', error);
    return (
      <Card className="p-4 flex justify-center items-center h-[300px]">
        <div className="text-center text-red-500">
          <p className="mb-2 font-medium">Error displaying calendar</p>
          <p>{error instanceof Error ? error.message : 'An unexpected error occurred'}</p>
        </div>
      </Card>
    );
  }
};

export default WeekView;
