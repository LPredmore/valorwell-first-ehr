
import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Clock, Calendar as CalendarIcon, Plus } from 'lucide-react';

interface CalendarViewControlsProps {
  view: 'day' | 'week' | 'month';
  showAvailability: boolean;
  onViewChange: (view: 'day' | 'week' | 'month') => void;
  onToggleAvailability: () => void;
  onNewAppointment: () => void;
}

const CalendarViewControls: React.FC<CalendarViewControlsProps> = ({
  view,
  showAvailability,
  onViewChange,
  onToggleAvailability,
  onNewAppointment
}) => {
  return (
    <div className="flex items-center gap-4">
      <Tabs defaultValue="week" value={view} onValueChange={(value) => onViewChange(value as 'day' | 'week' | 'month')}>
        <TabsList>
          <TabsTrigger value="day">
            <CalendarIcon className="h-4 w-4 mr-2" />
            Day
          </TabsTrigger>
          <TabsTrigger value="week">
            <CalendarIcon className="h-4 w-4 mr-2" />
            Week
          </TabsTrigger>
          <TabsTrigger value="month">
            <CalendarIcon className="h-4 w-4 mr-2" />
            Month
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <Button
        variant={showAvailability ? "default" : "outline"}
        onClick={onToggleAvailability}
      >
        <Clock className="mr-2 h-4 w-4" />
        Availability
      </Button>

      <Button onClick={onNewAppointment}>
        <Plus className="h-4 w-4 mr-2" />
        New Appointment
      </Button>
    </div>
  );
};

export default CalendarViewControls;
