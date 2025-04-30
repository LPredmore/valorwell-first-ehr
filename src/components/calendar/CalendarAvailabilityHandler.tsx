
import React, { useEffect } from 'react';
import { AvailabilityQueryService } from '@/services/AvailabilityQueryService';
import { CalendarEvent } from '@/types/calendar';
import { TimeZoneService } from '@/utils/timezone';
import { useAvailabilityEvents } from '@/hooks/useAvailabilityEvents';
import { WeeklyAvailability as AvailabilityWeeklyAvailability } from '@/types/availability';
import { WeeklyAvailability as AppointmentWeeklyAvailability, AvailabilitySlot } from '@/types/appointment';
import { formatAsUUID } from '@/utils/validation/uuidUtils';
import { queryMonitor } from '@/utils/performance/queryMonitor';

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
      
      // Start performance monitoring
      const endTimer = queryMonitor.startTimer('fetchAvailability', { 
        source: 'CalendarAvailabilityHandler', 
        params: { clinicianId } 
      });
      
      try {
        // Format clinician ID to ensure consistent UUID format
        const formattedClinicianId = formatAsUUID(clinicianId, {
          strictMode: true,
          logLevel: 'warn'
        });
        
        console.log('[CalendarAvailabilityHandler] Fetching availability for clinician:', formattedClinicianId);
        
        // Get availability exclusively from calendar_events table
        const weeklyAvailability = await AvailabilityQueryService.getWeeklyAvailability(formattedClinicianId);
        
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
        endTimer({ fromCache: false }); // End timer with success result
      } catch (error) {
        // Detailed error logging for diagnosis
        console.error('[CalendarAvailabilityHandler] Error fetching availability:', error);
        console.error('Error details:', {
          clinicianId,
          formattedId: formatAsUUID(clinicianId, { strictMode: false, logLevel: 'error' }),
          userTimeZone: validTimeZone,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          errorStack: error instanceof Error ? error.stack : undefined
        });
        
        endTimer(); // End timer on error
        
        if (onError) onError(error as Error);
        onEventsChange([]); // Send empty array so calendar still renders without availability
      }
    };

    fetchAvailability();
  }, [clinicianId, showAvailability, convertAvailabilityToEvents, onEventsChange, onError, validTimeZone]);

  return null;
};

export default CalendarAvailabilityHandler;
