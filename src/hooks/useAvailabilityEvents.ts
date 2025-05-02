
import { useState, useEffect } from 'react';
import { DateTime } from 'luxon';
import { CalendarEvent, DayOfWeek, WeekdayNumbers } from '@/types/calendar';
import { TimeZoneService } from '@/utils/timezone';

interface UseAvailabilityEventsProps {
  clinicianId: string;
  timeZone: string;
  startDate?: Date | null;
  endDate?: Date | null;
  filter?: {
    dayOfWeek?: DayOfWeek | DayOfWeek[];
  };
}

/**
 * Hook for fetching and managing availability events for a clinician
 */
export function useAvailabilityEvents({
  clinicianId,
  timeZone,
  startDate,
  endDate,
  filter
}: UseAvailabilityEventsProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!clinicianId) {
      setEvents([]);
      setLoading(false);
      return;
    }

    const fetchAvailability = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Mock availability for now - replace with API call later
        const mockAvailability = generateMockAvailabilityEvents(
          clinicianId,
          timeZone,
          startDate || new Date(),
          endDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
          filter
        );
        
        setEvents(mockAvailability);
      } catch (err) {
        console.error('Error fetching availability:', err);
        setError(err instanceof Error ? err : new Error('Unknown error fetching availability'));
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, [clinicianId, timeZone, startDate, endDate, filter]);

  return {
    events,
    loading,
    error,
    refreshEvents: () => {
      // Will re-trigger the effect
      setLoading(true);
    }
  };
}

/**
 * Generate mock availability events for testing
 */
function generateMockAvailabilityEvents(
  clinicianId: string,
  timeZone: string,
  start: Date, 
  end: Date,
  filter?: {
    dayOfWeek?: DayOfWeek | DayOfWeek[];
  }
): CalendarEvent[] {
  const validTimeZone = TimeZoneService.ensureIANATimeZone(timeZone);
  const startDate = DateTime.fromJSDate(start).setZone(validTimeZone).startOf('day');
  const endDate = DateTime.fromJSDate(end).setZone(validTimeZone).endOf('day');
  
  // Default availability pattern: Monday to Friday, 9am-12pm and 1pm-5pm
  const availabilitySlots = [
    { day: 1, start: '09:00', end: '12:00' }, // Monday morning
    { day: 1, start: '13:00', end: '17:00' }, // Monday afternoon
    { day: 2, start: '09:00', end: '12:00' }, // Tuesday morning
    { day: 2, start: '13:00', end: '17:00' }, // Tuesday afternoon
    { day: 3, start: '09:00', end: '12:00' }, // Wednesday morning
    { day: 3, start: '13:00', end: '17:00' }, // Wednesday afternoon
    { day: 4, start: '09:00', end: '12:00' }, // Thursday morning
    { day: 4, start: '13:00', end: '17:00' }, // Thursday afternoon
    { day: 5, start: '09:00', end: '12:00' }, // Friday morning
    { day: 5, start: '13:00', end: '17:00' }, // Friday afternoon
  ];
  
  // Filter by day of week if specified
  let filteredSlots = availabilitySlots;
  if (filter?.dayOfWeek) {
    const dayFilter: DayOfWeek[] = Array.isArray(filter.dayOfWeek) 
      ? filter.dayOfWeek 
      : [filter.dayOfWeek];
      
    // Convert day names to numbers (0-6)
    const dayNumbers: WeekdayNumbers[] = dayFilter.map(dayName => {
      const days: Record<DayOfWeek, WeekdayNumbers> = {
        sunday: 0,
        monday: 1,
        tuesday: 2,
        wednesday: 3,
        thursday: 4,
        friday: 5,
        saturday: 6
      };
      return days[dayName];
    });
    
    filteredSlots = availabilitySlots.filter(slot => dayNumbers.includes(slot.day as WeekdayNumbers));
  }

  // Generate events for each day in the date range
  const events: CalendarEvent[] = [];
  let currentDate = startDate;
  
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.weekday; // 1-7, where 1 is Monday
    const matchingSlots = filteredSlots.filter(slot => slot.day === dayOfWeek % 7);
    
    for (const slot of matchingSlots) {
      const [startHour, startMinute] = slot.start.split(':').map(Number);
      const [endHour, endMinute] = slot.end.split(':').map(Number);
      
      const eventStart = currentDate.set({ hour: startHour, minute: startMinute });
      const eventEnd = currentDate.set({ hour: endHour, minute: endMinute });
      
      const event: CalendarEvent = {
        id: `avail-${clinicianId}-${eventStart.toFormat('yyyyMMdd-HHmm')}`,
        title: 'Available',
        start: eventStart.toJSDate(),
        end: eventEnd.toJSDate(),
        allDay: false,
        backgroundColor: '#10b981', // Green
        borderColor: '#059669',
        textColor: '#ffffff',
        extendedProps: {
          eventType: 'availability',
          clinicianId: clinicianId,
          isAvailability: true,
          sourceTimeZone: validTimeZone,
          displayStart: eventStart.toFormat('h:mm a'),
          displayEnd: eventEnd.toFormat('h:mm a'),
          displayDate: eventStart.toFormat('MMM d, yyyy'),
          displayDay: eventStart.toFormat('cccc')
        }
      };
      
      events.push(event);
    }
    
    currentDate = currentDate.plus({ days: 1 });
  }
  
  return events;
}
