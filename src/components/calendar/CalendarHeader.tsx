
import React from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, CalendarIcon } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

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

  return (
    <div className="flex justify-between items-center mb-4">
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onNavigatePrevious}
          aria-label="Previous"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onNavigateToday}
          aria-label="Today"
        >
          Today
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onNavigateNext}
          aria-label="Next"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex items-center">
        <h2 className="text-xl font-semibold flex items-center">
          <CalendarIcon className="h-5 w-5 mr-2" />
          {getHeaderText()}
        </h2>
      </div>
      
      <div className="flex items-center text-sm text-gray-500">
        {!isLoadingTimeZone && (
          <div className="flex items-center">
            <span className="mr-1">Timezone:</span>
            <span className="font-semibold">{userTimeZone}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarHeader;
