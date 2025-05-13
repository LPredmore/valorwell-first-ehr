
import React from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarHeaderProps {
  currentDate: Date;
  userTimeZone: string;
  isLoadingTimeZone: boolean;
  onNavigatePrevious: () => void;
  onNavigateNext: () => void;
  onNavigateToday: () => void;
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentDate,
  userTimeZone,
  isLoadingTimeZone,
  onNavigatePrevious,
  onNavigateNext,
  onNavigateToday
}) => {
  const getHeaderText = () => {
    // For week view only
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    
    if (format(start, 'MMM') === format(end, 'MMM')) {
      return `${format(start, 'MMMM d')} - ${format(end, 'd, yyyy')}`;
    } else {
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
    }
  };

  return (
    <div className="flex justify-between items-center mb-4">
      <div className="flex items-center space-x-2">
        <Button onClick={onNavigatePrevious} size="icon" variant="outline">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-lg font-medium">{getHeaderText()}</span>
        <Button onClick={onNavigateNext} size="icon" variant="outline">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <Button variant="outline" onClick={onNavigateToday}>
        Today
      </Button>
    </div>
  );
};

export default CalendarHeader;
