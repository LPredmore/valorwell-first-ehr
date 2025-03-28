import React, { useState, useEffect } from 'react';
import {
format,
startOfWeek,
endOfWeek,
eachDayOfInterval,
addMinutes,
startOfDay,
isSameDay,
setHours,
setMinutes,
differenceInMinutes,
parseISO
} from 'date-fns';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface WeekViewProps {
  currentDate: Date;
  clinicianId: string | null;
  refreshTrigger?: number;
  appointments?: Array<{
    id: string;
    client_id: string;
    date: string; 
    start_time: string;
    end_time: string;
    type: string;
    status: string;
  }>;
  getClientName?: (clientId: string) => string;
  onAppointmentClick?: (appointment: any) => void;
}

interface AvailabilityBlock {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  clinician_id?: string;
}

interface TimeBlock {
  day: Date;
  start: Date;
  end: Date;
  availabilityIds: string[];
}

interface AppointmentBlock {
  id: string;
  day: Date;
  start: Date;
  end: Date;
  clientId: string;
  type: string;
  clientName?: string;
}

const WeekView: React.FC<WeekViewProps> = ({ 
  currentDate, 
  clinicianId, 
  refreshTrigger = 0,
  appointments = [],
  getClientName = () => 'Client',
  onAppointmentClick
}) => {
  const [loading, setLoading] = useState(true);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [appointmentBlocks, setAppointmentBlocks] = useState<AppointmentBlock[]>([]);

  const days = eachDayOfInterval({
    start: startOfWeek(currentDate, { weekStartsOn: 0 }),
    end: endOfWeek(currentDate, { weekStartsOn: 0 })
  });

  const timeSlots = Array.from({ length: 21 }, (_, i) => {
    const minutes = i * 30;
    return addMinutes(setHours(startOfDay(new Date()), 8), minutes);
  });

  useEffect(() => {
    if (!appointments.length) {
      setAppointmentBlocks([]);
      return;
    }

    const blocks: AppointmentBlock[] = appointments.map(appointment => {
      const [startHour, startMinute] = appointment.start_time.split(':').map(Number);
      const [endHour, endMinute] = appointment.end_time.split(':').map(Number);

      const dateObj = parseISO(appointment.date);
      const start = setMinutes(setHours(startOfDay(dateObj), startHour), startMinute);
      const end = setMinutes(setHours(startOfDay(dateObj), endHour), endMinute);

      return {
        id: appointment.id,
        day: dateObj,
        start,
        end,
        clientId: appointment.client_id,
        type: appointment.type,
        clientName: getClientName(appointment.client_id)
      };
    });

    setAppointmentBlocks(blocks);
  }, [appointments, getClientName]);

  useEffect(() => {
    const fetchAvailability = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from('availability')
          .select('*')
          .eq('is_active', true);

        if (clinicianId) {
          query = query.eq('clinician_id', clinicianId);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Error fetching availability:', error);
        } else {
          console.log('WeekView fetched availability data:', data);
          console.log('Current clinician ID:', clinicianId);
          processAvailabilityBlocks(data || []);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, [clinicianId, refreshTrigger]);

  const processAvailabilityBlocks = (blocks: AvailabilityBlock[]) => {
    if (!blocks.length) {
      setTimeBlocks([]);
      return;
    }

    const allTimeBlocks: TimeBlock[] = [];

    days.forEach(day => {
      const dayOfWeek = format(day, 'EEEE');
      const dayBlocks = blocks.filter(block => block.day_of_week === dayOfWeek);

      const parsedBlocks = dayBlocks.map(block => {
        const [startHour, startMinute] = block.start_time.split(':').map(Number);
        const [endHour, endMinute] = block.end_time.split(':').map(Number);

        const start = setMinutes(setHours(startOfDay(day), startHour), startMinute);
        const end = setMinutes(setHours(startOfDay(day), endHour), endMinute);

        return {
          id: block.id,
          day,
          start,
          end
        };
      });

      parsedBlocks.sort((a, b) => a.start.getTime() - b.start.getTime());

      const mergedBlocks: TimeBlock[] = [];

      parsedBlocks.forEach(block => {
        const lastBlock = mergedBlocks[mergedBlocks.length - 1];

        if (lastBlock && block.start <= lastBlock.end) {
          if (block.end > lastBlock.end) {
            lastBlock.end = block.end;
          }
          lastBlock.availabilityIds.push(block.id);
        } else {
          mergedBlocks.push({
            day: block.day,
            start: block.start,
            end: block.end,
            availabilityIds: [block.id]
          });
        }
      });

      allTimeBlocks.push(...mergedBlocks);
    });

    setTimeBlocks(allTimeBlocks);
  };

  const isTimeSlotAvailable = (day: Date, timeSlot: Date) => {
    const slotTime = setMinutes(
      setHours(startOfDay(day), timeSlot.getHours()),
      timeSlot.getMinutes()
    );

    return timeBlocks.some(block =>
      isSameDay(block.day, day) &&
      slotTime >= block.start &&
      slotTime < block.end
    );
  };

  const getBlockForTimeSlot = (day: Date, timeSlot: Date) => {
    const slotTime = setMinutes(
      setHours(startOfDay(day), timeSlot.getHours()),
      timeSlot.getMinutes()
    );

    return timeBlocks.find(block =>
      isSameDay(block.day, day) &&
      slotTime >= block.start &&
      slotTime < block.end
    );
  };

  const getAppointmentForTimeSlot = (day: Date, timeSlot: Date) => {
    const slotTime = setMinutes(
      setHours(startOfDay(day), timeSlot.getHours()),
      timeSlot.getMinutes()
    );

    return appointmentBlocks.find(block => 
      isSameDay(block.day, day) &&
      slotTime >= block.start && 
      slotTime < block.end
    );
  };

  if (loading) {
    return (
      <Card className="p-4 flex justify-center items-center h-[300px]">
        <Loader2 className="h-6 w-6 animate-spin text-valorwell-500" />
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="grid grid-cols-8 gap-1">
        <div className="col-span-1"></div>
        {days.map(day => (
          <div
            key={day.toString()}
            className="col-span-1 p-2 text-center font-medium border-b-2 border-gray-200"
          >
            <div className="text-sm text-gray-400">{format(day, 'EEE')}</div>
            <div className={`text-lg ${isSameDay(day, new Date()) ? 'bg-valorwell-500 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto' : ''}`}>
              {format(day, 'd')}
            </div>
          </div>
        ))}

        {timeSlots.map((timeSlot, slotIndex) => (
          <React.Fragment key={timeSlot.toString()}>
            <div className="col-span-1 p-2 text-xs text-gray-500 text-right pr-4 border-t border-gray-100">
              {format(timeSlot, 'h:mm a')}
            </div>

            {days.map(day => {
              const isAvailable = isTimeSlotAvailable(day, timeSlot);
              const currentBlock = getBlockForTimeSlot(day, timeSlot);
              const appointment = getAppointmentForTimeSlot(day, timeSlot);

              const isStartOfBlock = currentBlock &&
                differenceInMinutes(
                  setMinutes(setHours(startOfDay(day), timeSlot.getHours()), timeSlot.getMinutes()),
                  currentBlock.start
                ) < 30;

              const isEndOfBlock = currentBlock &&
                differenceInMinutes(
                  currentBlock.end,
                  addMinutes(setMinutes(setHours(startOfDay(day), timeSlot.getHours()), timeSlot.getMinutes()), 30)
                ) < 30;

              const isStartOfAppointment = appointment && 
                differenceInMinutes(
                  setMinutes(setHours(startOfDay(day), timeSlot.getHours()), timeSlot.getMinutes()),
                  appointment.start
                ) < 30;

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

              return (
                <div
                  key={`${day}-${timeSlot}`}
                  className="col-span-1 min-h-[40px] border-t border-l border-gray-100 p-1 group hover:bg-gray-50"
                >
                  {appointment && isStartOfAppointment ? (
                    <div 
                      className="p-1 bg-blue-50 border-l-4 border-blue-500 rounded h-full text-xs font-medium truncate cursor-pointer hover:bg-blue-100 transition-colors"
                      onClick={() => {
                        if (onAppointmentClick) {
                          const originalAppointment = appointments.find(app => 
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
                  ) : appointment && !isStartOfAppointment ? (
                    <div 
                      className="p-1 bg-blue-50 border-l-4 border-blue-500 border-t-0 h-full text-xs opacity-75 cursor-pointer hover:bg-blue-100 transition-colors"
                      onClick={() => {
                        if (onAppointmentClick) {
                          const originalAppointment = appointments.find(app => 
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
                  ) : isAvailable ? (
                    <div
                      className={`p-1 bg-green-50 border-l-4 border-green-500 ${continuousBlockClass} h-full text-xs`}
                    >
                      {isStartOfBlock && (
                        <div className="font-medium truncate">Available</div>
                      )}
                    </div>
                  ) : (
                    <div className="h-full w-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-gray-400">
                      Unavailable
                    </div>
                  )}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </Card>
  );
};

export default WeekView;
