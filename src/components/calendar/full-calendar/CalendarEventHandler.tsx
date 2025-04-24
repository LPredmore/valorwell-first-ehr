
import React from 'react';
import { EventClickArg, DateSelectArg, EventDropArg } from '@fullcalendar/core';
import { useToast } from '@/hooks/use-toast';

interface CalendarEventHandlerProps {
  onEventClick?: (appointment: any) => void;
  onAvailabilityClick?: (event: any) => void;
  onDateSelect?: (info: DateSelectArg) => void;
  onEventDrop?: (info: EventDropArg) => void;
  onEventResize?: (info: any) => void;
}

const CalendarEventHandler: React.FC<CalendarEventHandlerProps> = ({
  onEventClick,
  onAvailabilityClick,
  onDateSelect,
  onEventDrop,
  onEventResize,
}) => {
  const { toast } = useToast();

  const handleEventClick = (info: EventClickArg) => {
    const eventType = info.event.extendedProps?.eventType;
    
    if (eventType === 'availability' && onAvailabilityClick) {
      onAvailabilityClick(info.event);
    } else if (onEventClick) {
      const appointment = info.event.extendedProps?.appointment;
      if (appointment) {
        onEventClick(appointment);
      } else {
        console.warn('Event clicked but no appointment data found:', info.event);
      }
    }
  };

  const handleEventDrop = (info: EventDropArg) => {
    if (onEventDrop) {
      onEventDrop(info);
    } else {
      toast({
        title: 'Appointment moved',
        description: 'Please note that changes are not saved automatically.',
        variant: 'default'
      });
    }
  };

  const handleEventResize = (info: any) => {
    if (onEventResize) {
      onEventResize(info);
    } else {
      toast({
        title: 'Appointment resized',
        description: 'Please note that changes are not saved automatically.',
        variant: 'default'
      });
    }
  };

  return null; // This is a logic-only component
};

export default CalendarEventHandler;
