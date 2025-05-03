
import React, { useEffect } from 'react';
import { useAvailabilityEvents } from '@/hooks/useAvailabilityEvents';
import { AvailabilityBlock } from '@/types/availability';
import { CalendarEvent } from '@/types/calendar';
import { TimeZoneService } from '@/utils/timezone';

interface CalendarAvailabilityHandlerProps {
  clinicianId: string;
  timeZone: string;
  onAvailabilityEventsChange: (events: CalendarEvent[]) => void;
  onAvailabilityLoading: (isLoading: boolean) => void;
  onAvailabilityError: (error: Error | null) => void;
}

export const CalendarAvailabilityHandler: React.FC<CalendarAvailabilityHandlerProps> = ({
  clinicianId,
  timeZone,
  onAvailabilityEventsChange,
  onAvailabilityLoading,
  onAvailabilityError
}) => {
  const availabilityHook = useAvailabilityEvents({
    clinicianId,
    timeZone,  // Using the correct property name
  });
  
  // Manually handle calendar conversion if convertAvailabilityToEvents not available
  const { events, loading, error, refreshEvents } = availabilityHook;

  useEffect(() => {
    onAvailabilityEventsChange(events);
  }, [events, onAvailabilityEventsChange]);

  useEffect(() => {
    onAvailabilityLoading(loading);
  }, [loading, onAvailabilityLoading]);

  useEffect(() => {
    onAvailabilityError(error);
  }, [error, onAvailabilityError]);

  return null; // This is a logic-only component
};

export default CalendarAvailabilityHandler;
