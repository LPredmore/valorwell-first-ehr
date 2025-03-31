import React, { useState, useEffect } from 'react';
import { format, addMinutes, startOfDay, setHours, setMinutes, isSameDay, differenceInMinutes, parseISO } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DayViewProps {
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
  onAvailabilityClick?: (date: Date, availabilityBlock: any) => void;
  userTimeZone?: string;
}

interface AvailabilityBlock {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  isException?: boolean;
}

interface AvailabilityException {
  id: string;
  specific_date: string;
  original_availability_id: string;
  start_time: string | null;
  end_time: string | null;
  is_deleted: boolean;
}

interface TimeBlock {
  start: Date;
  end: Date;
  availabilityIds: string[];
  isException?: boolean;
}

interface AppointmentBlock {
  id: string;
  start: Date;
  end: Date;
  clientId: string;
  type: string;
  clientName?: string;
}

const DayView: React.FC<DayViewProps> = ({ 
  currentDate, 
  clinicianId, 
  refreshTrigger = 0,
  appointments = [],
  getClientName = () => 'Client',
  onAppointmentClick,
  onAvailabilityClick,
  userTimeZone
}) => {
  const [loading, setLoading] = useState(true);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [availabilityBlocks, setAvailabilityBlocks] = useState<AvailabilityBlock[]>([]);
  const [exceptions, setExceptions] = useState<AvailabilityException[]>([]);
  const [appointmentBlocks, setAppointmentBlocks] = useState<AppointmentBlock[]>([]);

  const timeSlots = Array.from({ length: 21 }, (_, i) => {
    const minutes = i * 30;
    return addMinutes(setHours(startOfDay(currentDate), 8), minutes);
  });

  const dayOfWeek = format(currentDate, 'EEEE');
  const formattedDate = format(currentDate, 'yyyy-MM-dd');

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
    const fetchAvailabilityAndExceptions = async () => {
      setLoading(true);
      try {
        let availabilityQuery = supabase
          .from('availability')
          .select('*')
          .eq('day_of_week', dayOfWeek)
          .eq('is_active', true);

        if (clinicianId) {
          availabilityQuery = availabilityQuery.eq('clinician_id', clinicianId);
        }

        const { data: availabilityData, error: availabilityError } = await availabilityQuery;

        if (availabilityError) {
          console.error('Error fetching availability:', availabilityError);
        } else {
          console.log('DayView availability data:', availabilityData);
          setAvailabilityBlocks(availabilityData || []);
          
          if (availabilityData && availabilityData.length > 0 && clinicianId) {
            const availabilityIds = availabilityData.map(block => block.id);
            
            const { data: exceptionsData, error: exceptionsError } = await supabase
              .from('availability_exceptions')
              .select('*')
              .eq('clinician_id', clinicianId)
              .eq('specific_date', formattedDate)
              .in('original_availability_id', availabilityIds);
              
            if (exceptionsError) {
              console.error('Error fetching availability exceptions:', exceptionsError);
            } else {
              console.log('DayView exceptions data:', exceptionsData);
              setExceptions(exceptionsData || []);
            }
          }
          
          processAvailabilityWithExceptions(availabilityData || [], exceptionsData || []);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailabilityAndExceptions();
  }, [dayOfWeek, clinicianId, refreshTrigger, formattedDate]);

  const processAvailabilityWithExceptions = (blocks: AvailabilityBlock[], exceptionsData: AvailabilityException[]) => {
    if (!blocks.length) {
      setTimeBlocks([]);
      return;
    }

    const exceptionsMap: Record<string, AvailabilityException> = {};
    exceptionsData.forEach(exception => {
      exceptionsMap[exception.original_availability_id] = exception;
    });

    const effectiveBlocks = blocks
      .filter(block => {
        const exception = exceptionsMap[block.id];
        return !exception || !exception.is_deleted;
      })
      .map(block => {
        const exception = exceptionsMap[block.id];
        
        if (exception && exception.start_time && exception.end_time) {
          return {
            ...block,
            start_time: exception.start_time,
            end_time: exception.end_time,
            isException: true
          };
        }
        
        return block;
      });

    const parsedBlocks = effectiveBlocks.map(block => {
      const [startHour, startMinute] = block.start_time.split(':').map(Number);
      const [endHour, endMinute] = block.end_time.split(':').map(Number);

      const start = setMinutes(setHours(startOfDay(currentDate), startHour), startMinute);
      const end = setMinutes(setHours(startOfDay(currentDate), endHour), endMinute);

      return {
        id: block.id,
        start,
        end,
        isException: block.isException
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
        if (block.isException) {
          lastBlock.isException = true;
        }
      } else {
        mergedBlocks.push({
          start: block.start,
          end: block.end,
          availabilityIds: [block.id],
          isException: block.isException
        });
      }
    });

    setTimeBlocks(mergedBlocks);
  };

  const isTimeSlotAvailable = (timeSlot: Date) => {
    return timeBlocks.some(block =>
      timeSlot >= block.start &&
      timeSlot < block.end
    );
  };

  const getBlockForTimeSlot = (timeSlot: Date) => {
    return timeBlocks.find(block =>
      timeSlot >= block.start &&
      timeSlot < block.end
    );
  };

  const getAvailabilityForBlock = (blockId: string) => {
    return availabilityBlocks.find(block => block.id === blockId);
  };

  const handleAvailabilityBlockClick = (block: TimeBlock) => {
    if (!onAvailabilityClick || !block.availabilityIds.length) return;
    
    const availabilityId = block.availabilityIds[0];
    const availabilityBlock = getAvailabilityForBlock(availabilityId);
    
    if (availabilityBlock) {
      onAvailabilityClick(currentDate, availabilityBlock);
    }
  };

  const getAppointmentForTimeSlot = (timeSlot: Date) => {
    return appointmentBlocks.find(block => {
      const slotTime = new Date(timeSlot);
      return slotTime >= block.start && slotTime < block.end;
    });
  };

  if (loading) {
    return (
      <Card className="p-4 flex justify-center items-center h-[500px]">
        <Loader2 className="h-6 w-6 animate-spin text-valorwell-500" />
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex flex-col space-y-2">
        {timeSlots.map((timeSlot, index) => {
          const isAvailable = isTimeSlotAvailable(timeSlot);
          const currentBlock = getBlockForTimeSlot(timeSlot);
          const appointment = getAppointmentForTimeSlot(timeSlot);
          
          const isStartOfBlock = currentBlock &&
            differenceInMinutes(timeSlot, currentBlock.start) < 30;
          const isEndOfBlock = currentBlock &&
            differenceInMinutes(currentBlock.end, addMinutes(timeSlot, 30)) < 30;

          const isStartOfAppointment = appointment && 
            differenceInMinutes(timeSlot, appointment.start) < 30;

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

          return (
            <div
              key={timeSlot.toString()}
              className="flex p-2 min-h-[60px] group border-b border-gray-100 hover:bg-gray-50"
            >
              <div className="w-20 text-sm text-gray-500 font-medium">
                {format(timeSlot, 'h:mm a')}
              </div>

              <div className="flex-1">
                {appointment && isStartOfAppointment ? (
                  <div 
                    className="p-2 bg-blue-50 border-l-4 border-blue-500 rounded text-sm h-full cursor-pointer hover:bg-blue-100 transition-colors"
                    onClick={() => {
                      if (onAppointmentClick) {
                        const originalAppointment = appointments.find(app => app.id === appointment.id);
                        if (originalAppointment) {
                          onAppointmentClick(originalAppointment);
                        }
                      }
                    }}
                  >
                    <div className="font-medium">{appointment.clientName}</div>
                    <div className="text-xs text-gray-600">
                      {appointment.type} - {format(appointment.start, 'h:mm a')} to {format(appointment.end, 'h:mm a')}
                    </div>
                  </div>
                ) : appointment && !isStartOfAppointment ? (
                  <div 
                    className="p-2 bg-blue-50 border-l-4 border-blue-500 border-t-0 text-sm h-full opacity-75 cursor-pointer hover:bg-blue-100 transition-colors"
                    onClick={() => {
                      if (onAppointmentClick) {
                        const originalAppointment = appointments.find(app => app.id === appointment.id);
                        if (originalAppointment) {
                          onAppointmentClick(originalAppointment);
                        }
                      }
                    }}
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
                          {format(currentBlock.start, 'h:mm a')} - {format(currentBlock.end, 'h:mm a')}
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
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default DayView;
