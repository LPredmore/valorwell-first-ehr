
import React, { useState, useEffect } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth,
  isSameDay,
  startOfWeek,
  endOfWeek,
  isToday
} from 'date-fns';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface MonthViewProps {
  currentDate: Date;
}

interface AvailabilityBlock {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
}

const MonthView: React.FC<MonthViewProps> = ({ currentDate }) => {
  const [loading, setLoading] = useState(true);
  const [availabilityBlocks, setAvailabilityBlocks] = useState<AvailabilityBlock[]>([]);
  
  // Get all days in the current month view (including days from prev/next months to fill the calendar grid)
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  
  useEffect(() => {
    const fetchAvailability = async () => {
      setLoading(true);
      try {
        // Fetch all availability blocks
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
  
  // Get availability blocks for a specific day
  const getAvailabilityForDay = (day: Date) => {
    const dayOfWeek = format(day, 'EEEE'); // Returns Monday, Tuesday, etc.
    
    return availabilityBlocks.filter(block => block.day_of_week === dayOfWeek);
  };
  
  // Create week rows
  const weeks = [];
  let weekDays = [];
  
  for (let i = 0; i < days.length; i++) {
    weekDays.push(days[i]);
    
    if (weekDays.length === 7 || i === days.length - 1) {
      weeks.push(weekDays);
      weekDays = [];
    }
  }
  
  if (loading) {
    return (
      <Card className="p-4 flex justify-center items-center h-[500px]">
        <Loader2 className="h-6 w-6 animate-spin text-valorwell-500" />
      </Card>
    );
  }
  
  return (
    <Card className="p-4">
      <div className="grid grid-cols-7 gap-1 text-center font-medium mb-2 border-b pb-2">
        <div>Sun</div>
        <div>Mon</div>
        <div>Tue</div>
        <div>Wed</div>
        <div>Thu</div>
        <div>Fri</div>
        <div>Sat</div>
      </div>
      
      {weeks.map((week, weekIndex) => (
        <div key={weekIndex} className="grid grid-cols-7 gap-1 mb-1">
          {week.map((day) => {
            const dayAvailability = getAvailabilityForDay(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            
            return (
              <div 
                key={day.toString()}
                className={cn(
                  "min-h-[100px] p-1 border border-gray-100 hover:bg-gray-50 rounded-md",
                  !isCurrentMonth && "bg-gray-50 opacity-40"
                )}
              >
                <div className={cn(
                  "text-right p-1",
                  isToday(day) && "bg-valorwell-500 text-white rounded-full w-6 h-6 flex items-center justify-center ml-auto"
                )}>
                  {format(day, 'd')}
                </div>
                
                <div className="mt-1 space-y-1">
                  {dayAvailability.length > 0 ? (
                    <>
                      {dayAvailability.slice(0, 3).map(block => (
                        <div 
                          key={block.id}
                          className="p-1 bg-valorwell-100 border-l-4 border-valorwell-500 rounded text-xs truncate"
                        >
                          {block.start_time.substring(0, 5)} - {block.end_time.substring(0, 5)}
                        </div>
                      ))}
                      
                      {dayAvailability.length > 3 && (
                        <div className="text-xs text-gray-500 text-center">
                          +{dayAvailability.length - 3} more
                        </div>
                      )}
                    </>
                  ) : (
                    isCurrentMonth && (
                      <div className="text-xs text-gray-400 text-center italic mt-4">
                        No availability
                      </div>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </Card>
  );
};

export default MonthView;
