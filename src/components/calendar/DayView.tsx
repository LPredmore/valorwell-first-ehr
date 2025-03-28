import React, { useState, useEffect } from 'react';
import { format, addMinutes, startOfDay, setHours, setMinutes, isSameDay, differenceInMinutes, parseISO } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DayViewProps {
  currentDate: Date;
  clinicianId: string | null;
  refreshTrigger?: number;
}

interface AvailabilityBlock {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
}

interface TimeBlock {
  start: Date;
  end: Date;
  availabilityIds: string[];
}

const DayView: React.FC<DayViewProps> = ({ currentDate, clinicianId, refreshTrigger = 0 }) => {
  const [loading, setLoading] = useState(true);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);

  const timeSlots = Array.from({ length: 21 }, (_, i) => {
    const minutes = i * 30;
    return addMinutes(setHours(startOfDay(currentDate), 8), minutes);
  });

  const dayOfWeek = format(currentDate, 'EEEE');

  useEffect(() => {
    const fetchAvailability = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from('availability')
          .select('*')
          .eq('day_of_week', dayOfWeek)
          .eq('is_active', true);

        if (clinicianId) {
          query = query.eq('clinician_id', clinicianId);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Error fetching availability:', error);
        } else {
          console.log('DayView availability data:', data);
          processAvailabilityBlocks(data || []);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, [dayOfWeek, clinicianId, refreshTrigger]);

  const processAvailabilityBlocks = (blocks: AvailabilityBlock[]) => {
    if (!blocks.length) {
      setTimeBlocks([]);
      return;
    }

    const parsedBlocks = blocks.map(block => {
      const [startHour, startMinute] = block.start_time.split(':').map(Number);
      const [endHour, endMinute] = block.end_time.split(':').map(Number);

      const start = setMinutes(setHours(startOfDay(currentDate), startHour), startMinute);
      const end = setMinutes(setHours(startOfDay(currentDate), endHour), endMinute);

      return {
        id: block.id,
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
          start: block.start,
          end: block.end,
          availabilityIds: [block.id]
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
          const isStartOfBlock = currentBlock &&
            differenceInMinutes(timeSlot, currentBlock.start) < 30;
          const isEndOfBlock = currentBlock &&
            differenceInMinutes(currentBlock.end, addMinutes(timeSlot, 30)) < 30;

          let showContinuousBlock = false;
          let continuousBlockClass = "";

          if (isAvailable) {
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
                {showContinuousBlock ? (
                  <div
                    className={`p-2 bg-green-50 border-l-4 border-green-500 ${continuousBlockClass} rounded text-sm h-full`}
                  >
                    {isStartOfBlock && (
                      <>
                        <div className="font-medium">Available</div>
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
