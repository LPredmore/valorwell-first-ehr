
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
  differenceInMinutes
} from 'date-fns';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface WeekViewProps {
  currentDate: Date;
  clinicianId: string | null;
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

const WeekView: React.FC<WeekViewProps> = ({ currentDate, clinicianId }) => {
  const [loading, setLoading] = useState(true);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  
  // Generate days for the week
  const days = eachDayOfInterval({
    start: startOfWeek(currentDate, { weekStartsOn: 0 }),
    end: endOfWeek(currentDate, { weekStartsOn: 0 })
  });
  
  // Generate time slots for each day (from 8 AM to 6 PM, in 30-minute increments)
  const timeSlots = Array.from({ length: 21 }, (_, i) => {
    const minutes = i * 30; // 30-minute increments
    return addMinutes(setHours(startOfDay(new Date()), 8), minutes);
  });
  
  useEffect(() => {
    const fetchAvailability = async () => {
      setLoading(true);
      try {
        // Fetch all availability blocks for the given clinician, or all if no clinician ID provided
        let query = supabase
          .from('availability')
          .select('*')
          .eq('is_active', true);
          
        // If clinicianId is provided, filter by it
        if (clinicianId) {
          query = query.eq('clinician_id', clinicianId);
        }
        
        const { data, error } = await query;
          
        if (error) {
          console.error('Error fetching availability:', error);
        } else {
          console.log('WeekView fetched availability data:', data);
          console.log('Current clinician ID:', clinicianId);
          // Process availability data into continuous blocks for each day
          processAvailabilityBlocks(data || []);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAvailability();
  }, [clinicianId]);
  
  // Process availability blocks into continuous time blocks for each day
  const processAvailabilityBlocks = (blocks: AvailabilityBlock[]) => {
    if (!blocks.length) {
      setTimeBlocks([]);
      return;
    }
    
    const allTimeBlocks: TimeBlock[] = [];
    
    // Process each day separately
    days.forEach(day => {
      const dayOfWeek = format(day, 'EEEE'); // e.g. "Monday"
      const dayBlocks = blocks.filter(block => block.day_of_week === dayOfWeek);
      
      // Parse blocks into Date objects for this day
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
      
      // Sort blocks by start time
      parsedBlocks.sort((a, b) => a.start.getTime() - b.start.getTime());
      
      // Merge overlapping blocks for this day
      const mergedBlocks: TimeBlock[] = [];
      
      parsedBlocks.forEach(block => {
        const lastBlock = mergedBlocks[mergedBlocks.length - 1];
        
        if (lastBlock && block.start <= lastBlock.end) {
          // Blocks overlap, extend the end time if needed
          if (block.end > lastBlock.end) {
            lastBlock.end = block.end;
          }
          // Add this block's ID to the list of availability IDs
          lastBlock.availabilityIds.push(block.id);
        } else {
          // No overlap, add as a new block
          mergedBlocks.push({
            day: block.day,
            start: block.start,
            end: block.end,
            availabilityIds: [block.id]
          });
        }
      });
      
      // Add this day's blocks to the overall list
      allTimeBlocks.push(...mergedBlocks);
    });
    
    setTimeBlocks(allTimeBlocks);
  };
  
  // Check if a specific day and time slot is within an availability block
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
  
  // Get the continuous block that a time slot belongs to
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
              
              // For week view, we need to determine if this is the start/middle/end of a block
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
              
              let continuousBlockClass = "";
              
              if (isAvailable) {
                if (isStartOfBlock && isEndOfBlock) {
                  // This is a single-slot block
                  continuousBlockClass = "rounded";
                } else if (isStartOfBlock) {
                  // This is the start of a block
                  continuousBlockClass = "rounded-t border-b-0";
                } else if (isEndOfBlock) {
                  // This is the end of a block
                  continuousBlockClass = "rounded-b";
                } else {
                  // This is the middle of a block
                  continuousBlockClass = "border-t-0 border-b-0";
                }
              }
              
              return (
                <div 
                  key={`${day}-${timeSlot}`} 
                  className="col-span-1 min-h-[40px] border-t border-l border-gray-100 p-1 group hover:bg-gray-50"
                >
                  {isAvailable ? (
                    <div 
                      className={`p-1 bg-green-50 border-l-4 border-green-500 ${continuousBlockClass} h-full text-xs`}
                    >
                      {isStartOfBlock && (
                        <div className="font-medium truncate">Available</div>
                      )}
                    </div>
                  ) : (
                    <div className="h-full w-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-gray-400">
                      +
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
