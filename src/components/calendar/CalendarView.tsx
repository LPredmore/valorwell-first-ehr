
import React, { useState } from 'react';
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  startOfMonth, 
  endOfMonth,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays
} from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock,
  Calendar as CalendarIcon,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import DayView from './DayView';
import WeekView from './WeekView';
import MonthView from './MonthView';
import AvailabilityPanel from './AvailabilityPanel';

interface CalendarViewProps {
  view: 'day' | 'week' | 'month';
  showAvailability: boolean;
}

const CalendarView: React.FC<CalendarViewProps> = ({ view, showAvailability }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const navigatePrevious = () => {
    if (view === 'day') {
      setCurrentDate(subDays(currentDate, 1));
    } else if (view === 'week') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else if (view === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };
  
  const navigateNext = () => {
    if (view === 'day') {
      setCurrentDate(addDays(currentDate, 1));
    } else if (view === 'week') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else if (view === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };
  
  const navigateToday = () => {
    setCurrentDate(new Date());
  };
  
  // Format the header based on the current view
  const getHeaderText = () => {
    if (view === 'day') {
      return format(currentDate, 'MMMM d, yyyy');
    } else if (view === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 });
      const end = endOfWeek(currentDate, { weekStartsOn: 0 });
      
      if (format(start, 'MMM') === format(end, 'MMM')) {
        return `${format(start, 'MMMM d')} - ${format(end, 'd, yyyy')}`;
      } else {
        return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
      }
    } else {
      return format(currentDate, 'MMMM yyyy');
    }
  };
  
  return (
    <div className="flex flex-col space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={navigateToday}>
            Today
          </Button>
          <Button variant="ghost" size="icon" onClick={navigatePrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={navigateNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold ml-2">{getHeaderText()}</h2>
        </div>
        
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Appointment
        </Button>
      </div>
      
      <div className="flex gap-4">
        <div className={cn("flex-1", showAvailability ? "w-3/4" : "w-full")}>
          {view === 'day' && <DayView currentDate={currentDate} />}
          {view === 'week' && <WeekView currentDate={currentDate} />}
          {view === 'month' && <MonthView currentDate={currentDate} />}
        </div>
        
        {showAvailability && (
          <div className="w-1/4">
            <AvailabilityPanel />
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarView;
