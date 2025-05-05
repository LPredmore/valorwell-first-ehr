
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import Calendar from './Calendar';
import { Loader2 } from 'lucide-react';

interface CalendarViewProps {
  view: 'week' | 'month';
  showAvailability: boolean;
  clinicianId: string | null;
  userTimeZone: string;
  refreshTrigger?: number;
}

const CalendarView: React.FC<CalendarViewProps> = ({ 
  view, 
  showAvailability, 
  clinicianId,
  userTimeZone, 
  refreshTrigger = 0
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);

  // Update calendar when view or currentDate changes
  useEffect(() => {
    const fetchCalendarData = async () => {
      setIsLoading(true);
      // Simulate loading - in a real app this might fetch data
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    };

    fetchCalendarData();
  }, [view, currentDate, clinicianId, refreshTrigger]);

  if (isLoading) {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-valorwell-500" />
      </div>
    );
  }

  return (
    <Calendar 
      view={view}
      showAvailability={showAvailability}
      clinicianId={clinicianId}
      currentDate={currentDate}
      userTimeZone={userTimeZone}
      refreshTrigger={refreshTrigger}
    />
  );
};

export default CalendarView;
