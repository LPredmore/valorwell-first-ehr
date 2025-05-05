import React from 'react';
import { format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
interface CalendarHeaderProps {
  currentDate: Date;
  view: 'day' | 'week' | 'month';
  userTimeZone: string;
  isLoadingTimeZone: boolean;
  onNavigatePrevious: () => void;
  onNavigateNext: () => void;
  onNavigateToday: () => void;
}
const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentDate,
  view,
  userTimeZone,
  isLoadingTimeZone,
  onNavigatePrevious,
  onNavigateNext,
  onNavigateToday
}) => {
  const getHeaderText = () => {
    if (view === 'day') {
      return format(currentDate, 'MMMM d, yyyy');
    } else if (view === 'week') {
      const start = new Date(currentDate);
      start.setDate(start.getDate() - start.getDay());
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      if (format(start, 'MMM') === format(end, 'MMM')) {
        return `${format(start, 'MMMM d')} - ${format(end, 'd, yyyy')}`;
      } else {
        return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
      }
    } else {
      return format(currentDate, 'MMMM yyyy');
    }
  };
  return <div className="flex justify-between items-center mb-4">
      
      {!isLoadingTimeZone}
    </div>;
};
export default CalendarHeader;