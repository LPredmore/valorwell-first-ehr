
import React from 'react';
import { CalendarViewType } from '@/types/calendar';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';

interface CalendarToolbarProps {
  onViewChange: (view: CalendarViewType) => void;
  currentView: CalendarViewType;
}

const CalendarToolbar: React.FC<CalendarToolbarProps> = ({
  onViewChange,
  currentView,
}) => {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Button
        variant={currentView === 'timeGridDay' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onViewChange('timeGridDay')}
      >
        Day
      </Button>
      <Button
        variant={currentView === 'timeGridWeek' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onViewChange('timeGridWeek')}
      >
        Week
      </Button>
      <Button
        variant={currentView === 'dayGridMonth' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onViewChange('dayGridMonth')}
      >
        Month
      </Button>
      <Calendar className="ml-2 h-4 w-4 text-gray-500" />
    </div>
  );
};

export default CalendarToolbar;
