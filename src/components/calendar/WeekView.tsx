
import React, { useState, useEffect } from 'react';
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  addHours, 
  startOfDay,
  isSameDay
} from 'date-fns';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface WeekViewProps {
  currentDate: Date;
}

interface AvailabilityBlock {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
}

const WeekView: React.FC<WeekViewProps> = ({ currentDate }) => {
  const [loading, setLoading] = useState(true);
  const [availabilityBlocks, setAvailabilityBlocks] = useState<AvailabilityBlock[]>([]);
  
  // Generate days for the week
  const days = eachDayOfInterval({
    start: startOfWeek(currentDate, { weekStartsOn: 0 }),
    end: endOfWeek(currentDate, { weekStartsOn: 0 })
  });
  
  // Generate hours for each day (from 8 AM to 6 PM)
  const hours = Array.from({ length: 11 }, (_, i) => {
    const hour = i + 8; // Starting at 8 AM
    return addHours(startOfDay(new Date()), hour);
  });
  
  useEffect(() => {
    const fetchAvailability = async () => {
      setLoading(true);
      try {
        // Fetch all availability blocks for all days
        const { data, error } = await supabase
          .from('availability')
          .select('*')
          .eq('is_active', true);
          
        if (error) {
          console.error('Error fetching availability:', error);
        } else {
          setAvailabilityBlocks(data || []);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAvailability();
  }, []);
  
  // Function to get availability for a specific day and hour
  const getAvailabilityForTimeSlot = (day: Date, hourObj: Date) => {
    const dayOfWeek = format(day, 'EEEE'); // Returns Monday, Tuesday, etc.
    const hourNumber = hourObj.getHours();
    
    return availabilityBlocks.filter(block => {
      // Check if the block matches the current day of week
      if (block.day_of_week !== dayOfWeek) return false;
      
      // Parse time strings to get hours and minutes
      const startTime = block.start_time.split(':');
      const endTime = block.end_time.split(':');
      
      const startHour = parseInt(startTime[0], 10);
      const endHour = parseInt(endTime[0], 10);
      
      // Check if the current hour falls within a time block
      return hourNumber >= startHour && hourNumber < endHour;
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
        
        {hours.map(hour => (
          <React.Fragment key={hour.toString()}>
            <div className="col-span-1 p-2 text-xs text-gray-500 text-right pr-4 border-t border-gray-100">
              {format(hour, 'h:mm a')}
            </div>
            
            {days.map(day => {
              const availability = getAvailabilityForTimeSlot(day, hour);
              
              return (
                <div 
                  key={`${day}-${hour}`} 
                  className="col-span-1 min-h-[60px] border-t border-l border-gray-100 p-1 group hover:bg-gray-50"
                >
                  {availability.length > 0 ? (
                    <div 
                      className="p-1 bg-valorwell-100 border-l-4 border-valorwell-500 rounded text-xs h-full"
                    >
                      <div className="font-medium truncate">Available</div>
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
