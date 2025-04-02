
import React from 'react';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarHeaderProps {
  currentDate: Date;
  view: 'day' | 'week' | 'month';
  userTimeZone: string;
  isLoadingTimeZone: boolean;
  navigatePrevious: () => void;
  navigateNext: () => void;
  navigateToday: () => void;
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentDate,
  view,
  userTimeZone,
  isLoadingTimeZone,
  navigatePrevious,
  navigateNext,
  navigateToday,
}) => {
  const getHeaderText = () => {
    if (view === 'day') {
      return format(currentDate, 'MMMM d, yyyy');
    } else if (view === 'week') {
      const start = startOfWeek(currentDate, {
        weekStartsOn: 0
      });
      const end = endOfWeek(currentDate, {
        weekStartsOn: 0
      });
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
      {!isLoadingTimeZone && (
        <div className="text-sm text-gray-500">
          Showing times in {userTimeZone.replace('_', ' ')}
        </div>
      )}
    </div>
  );
};

export default CalendarHeader;
