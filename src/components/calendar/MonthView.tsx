import React, { useState, useEffect } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  parseISO,
  formatISO
} from 'date-fns';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface MonthViewProps {
  currentDate: Date;
  clinicianId: string | null;
  refreshTrigger?: number;
}

const MonthView: React.FC<MonthViewProps> = ({ currentDate, clinicianId, refreshTrigger = 0 }) => {
  const [loading, setLoading] = useState(true);
  const [availabilityData, setAvailabilityData] = useState<any[]>([]);

  // Get days for the current month, including those from previous/next months
  // that appear in the calendar view
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
  
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  useEffect(() => {
    const fetchAvailability = async () => {
      setLoading(true);
      try {
        // Build query for availability blocks
        let query = supabase
          .from('availability')
          .select('*')
          .eq('is_active', true);

        // Add clinician filter if provided
        if (clinicianId) {
          query = query.eq('clinician_id', clinicianId);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Error fetching availability:', error);
        } else {
          console.log('MonthView fetched availability data:', data);
          setAvailabilityData(data || []);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, [clinicianId, refreshTrigger]);

  // Check if a day has availability slots
  const hasDayAvailability = (day: Date) => {
    const dayOfWeek = format(day, 'EEEE'); // e.g., "Monday"
    return availabilityData.some(slot => slot.day_of_week === dayOfWeek);
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
      <div className="grid grid-cols-7 gap-1">
        {/* Header - Days of week */}
        {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
          <div key={day} className="p-2 text-center font-medium border-b border-gray-200">
            {day.slice(0, 3)}
          </div>
        ))}

        {/* Calendar days */}
        {days.map((day) => (
          <div
            key={day.toString()}
            className={`p-2 min-h-[100px] border border-gray-100 ${!isSameMonth(day, monthStart) ? 'bg-gray-50 text-gray-400' : ''} ${isSameDay(day, new Date()) ? 'border-valorwell-500 border-2' : ''}`}
          >
            <div className="flex justify-between items-start">
              <span className={`text-sm font-medium ${isSameDay(day, new Date()) ? 'text-valorwell-500' : ''}`}>
                {format(day, 'd')}
              </span>
              {hasDayAvailability(day) && isSameMonth(day, monthStart) && (
                <div className="bg-green-100 text-green-800 text-xs px-1 py-0.5 rounded">
                  Available
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default MonthView;
