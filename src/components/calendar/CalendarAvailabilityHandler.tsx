
import React, { useEffect } from 'react';
import { AvailabilityQueryService } from '@/services/AvailabilityQueryService';
import { CalendarEvent } from '@/types/calendar';
import { TimeZoneService } from '@/utils/timezone';
import { useAvailabilityEvents } from '@/hooks/useAvailabilityEvents';
import { WeeklyAvailability as AvailabilityWeeklyAvailability } from '@/types/availability';
import { WeeklyAvailability as AppointmentWeeklyAvailability, AvailabilitySlot } from '@/packages/core/types/appointment';

interface CalendarAvailabilityHandlerProps {
  clinicianId: string;
  userTimeZone: string;
  onEventsChange: (events: CalendarEvent[]) => void;
  onError?: (error: Error) => void;
  showAvailability: boolean;
  weeksToShow?: number;
}

const CalendarAvailabilityHandler: React.FC<CalendarAvailabilityHandlerProps> = ({
  clinicianId,
  userTimeZone,
  onEventsChange,
  onError,
  showAvailability,
  weeksToShow = 8
}) => {
  const validTimeZone = TimeZoneService.ensureIANATimeZone(userTimeZone);
  const { convertAvailabilityToEvents } = useAvailabilityEvents({ 
    userTimeZone: validTimeZone, 
    weeksToShow 
  });

  useEffect(() => {
    const fetchAvailability = async () => {
      if (!showAvailability || !clinicianId) {
        console.log('[CalendarAvailabilityHandler] Skipping availability fetch:', {
          showAvailability,
          clinicianId: clinicianId || 'none'
        });
        onEventsChange([]);
        return;
      }
      
      try {
        console.log('[CalendarAvailabilityHandler] Fetching availability for clinician:', clinicianId);
        
        // Get availability exclusively from calendar_events table
        const weeklyAvailability = await AvailabilityQueryService.getWeeklyAvailability(clinicianId);
        
        // Convert from DayOfWeek-indexed to string-indexed for the hooks/useAvailabilityEvents
        const convertedAvailability: {[key: string]: AvailabilitySlot[]} = {
          Monday: weeklyAvailability.monday || [],
          Tuesday: weeklyAvailability.tuesday || [],
          Wednesday: weeklyAvailability.wednesday || [],
          Thursday: weeklyAvailability.thursday || [],
          Friday: weeklyAvailability.friday || [],
          Saturday: weeklyAvailability.saturday || [],
          Sunday: weeklyAvailability.sunday || []
        };
        
        // Convert to calendar events format
        const events = convertAvailabilityToEvents(convertedAvailability);
        
        console.log(`[CalendarAvailabilityHandler] Retrieved ${events.length} availability events`);
        onEventsChange(events);
      } catch (error) {
        console.error('[CalendarAvailabilityHandler] Error fetching availability:', error);
        if (onError) onError(error as Error);
        onEventsChange([]); // Send empty array so calendar still renders without availability
      }
    };

    fetchAvailability();
  }, [clinicianId, showAvailability, convertAvailabilityToEvents, onEventsChange, onError]);

  return null;
};

export default CalendarAvailabilityHandler;
