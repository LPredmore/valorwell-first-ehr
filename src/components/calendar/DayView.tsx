
import React, { useState, useEffect } from 'react';
import { format, addMinutes, startOfDay, setHours, setMinutes, isSameDay, differenceInMinutes, parseISO } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DayViewProps {
  currentDate: Date;
  clinicianId: string | null;
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

const DayView: React.FC<DayViewProps> = ({ currentDate, clinicianId }) => {
  const [loading, setLoading] = useState(true);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  
  // Generate time slots for the day (from 8 AM to 6 PM, in 30-minute increments)
  const timeSlots = Array.from({ length: 21 }, (_, i) => {
    const minutes = i * 30; // 30-minute increments
    return addMinutes(setHours(startOfDay(currentDate), 8), minutes);
  });
  
  // Get day of week from current date
  const dayOfWeek = format(currentDate, 'EEEE'); // Returns Monday, Tuesday, etc.
  
  useEffect(() => {
    const fetchAvailability = async () => {
      setLoading(true);
      try {
        // Build query for availability blocks
        let query = supabase
          .from('availability')
          .select('*')
          .eq('day_of_week', dayOfWeek)
          .eq('is_active', true);
          
        // Add clinician filter if provided
        if (clinicianId) {
          query = query.eq('clinician_id', clinicianId);
        }
        
        const { data, error } = await query;
          
        if (error) {
          console.error('Error fetching availability:', error);
        } else {
          console.log('DayView availability data:', data);
          // Process availability data into continuous blocks
          processAvailabilityBlocks(data || []);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAvailability();
  }, [dayOfWeek, clinicianId]);
  
  // Process availability blocks into continuous time blocks
  const processAvailabilityBlocks = (blocks: AvailabilityBlock[]) => {
    if (!blocks.length) {
      setTimeBlocks([]);
      return;
    }
    
    // Parse blocks into Date objects
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
    
    // Sort blocks by start time
    parsedBlocks.sort((a, b) => a.start.getTime() - b.start.getTime());
    
    // Merge overlapping blocks
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
          start: block.start,
          end: block.end,
          availabilityIds: [block.id]
        });
      }
    });
    
    setTimeBlocks(mergedBlocks);
  };
  
  // Check if a time slot is within an availability block
  const isTimeSlotAvailable = (timeSlot: Date) => {
    return timeBlocks.some(block => 
      timeSlot >= block.start && 
      timeSlot < block.end
    );
  };
  
  // Get the continuous block that a time slot belongs to
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
          
          // Determine if this slot should show a continuous block visual
          let showContinuousBlock = false;
          let continuousBlockClass = "";
          
          if (isAvailable) {
            showContinuousBlock = true;
            
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
