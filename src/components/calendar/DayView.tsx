
import React, { useState, useEffect } from 'react';
import { format, addHours, startOfDay, setHours, setMinutes, isSameDay } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DayViewProps {
  currentDate: Date;
}

interface AvailabilityBlock {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
}

const DayView: React.FC<DayViewProps> = ({ currentDate }) => {
  const [loading, setLoading] = useState(true);
  const [availabilityBlocks, setAvailabilityBlocks] = useState<AvailabilityBlock[]>([]);
  
  // Generate hours for the day (from 8 AM to 6 PM)
  const hours = Array.from({ length: 11 }, (_, i) => {
    const hour = i + 8; // Starting at 8 AM
    return addHours(startOfDay(currentDate), hour);
  });
  
  // Get day of week from current date
  const dayOfWeek = format(currentDate, 'EEEE'); // Returns Monday, Tuesday, etc.
  
  useEffect(() => {
    const fetchAvailability = async () => {
      setLoading(true);
      try {
        // Fetch all availability blocks for the current day of week
        const { data, error } = await supabase
          .from('availability')
          .select('*')
          .eq('day_of_week', dayOfWeek)
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
  }, [dayOfWeek]);
  
  // Function to check if hour has availability
  const getAvailabilityForHour = (hour: Date) => {
    const hourNumber = hour.getHours();
    
    return availabilityBlocks.filter(block => {
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
      <div className="flex flex-col space-y-2">
        {hours.map((hour) => {
          const hourAvailability = getAvailabilityForHour(hour);
          
          return (
            <div 
              key={hour.toString()} 
              className="flex p-2 min-h-[80px] group border-b border-gray-100 hover:bg-gray-50"
            >
              <div className="w-20 text-sm text-gray-500 font-medium">
                {format(hour, 'h:mm a')}
              </div>
              
              <div className="flex-1">
                {hourAvailability.length > 0 ? (
                  hourAvailability.map(block => (
                    <div 
                      key={block.id}
                      className="p-2 bg-valorwell-100 border-l-4 border-valorwell-500 rounded text-sm mb-1"
                    >
                      <div className="font-medium">Available</div>
                      <div className="text-xs text-gray-600">
                        {block.start_time.substring(0, 5)} - {block.end_time.substring(0, 5)}
                      </div>
                    </div>
                  ))
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
