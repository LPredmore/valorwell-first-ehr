import { useEffect, useCallback, useState } from 'react';
import { CalendarEvent } from '@/types/calendar';
import { useAvailability } from '@/hooks/useAvailability';
import { TimeZoneService } from '@/utils/timeZoneService';
import { DateTime } from 'luxon';

interface CalendarAvailabilityHandlerProps {
  clinicianId: string;
  userTimeZone: string;
  onEventsChange: (events: CalendarEvent[]) => void;
  showAvailability: boolean;
  weeksToShow?: number;
}

const CalendarAvailabilityHandler: React.FC<CalendarAvailabilityHandlerProps> = ({
  clinicianId,
  userTimeZone,
  onEventsChange,
  showAvailability,
  weeksToShow = 8
}) => {
  const [availabilityEvents, setAvailabilityEvents] = useState<CalendarEvent[]>([]);
  
  const {
    weeklyAvailability,
    isLoading,
    refreshAvailability
  } = useAvailability(clinicianId);

  const convertAvailabilityToEvents = useCallback(() => {
    if (!weeklyAvailability || !showAvailability) {
      console.log('[CalendarAvailabilityHandler] No availability data or showAvailability is false');
      return [];
    }

    const events: CalendarEvent[] = [];
    const now = DateTime.now().setZone(userTimeZone);
    const currentWeekStart = now.startOf('week');
    
    console.log('[CalendarAvailabilityHandler] Converting availability to events:', {
      weeksToShow,
      userTimeZone,
      currentWeekStart: currentWeekStart.toISO()
    });
    
    const dayToIsoWeekday: Record<string, number> = {
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
      sunday: 7
    };

    Object.entries(weeklyAvailability).forEach(([day, slots]) => {
      const dayNumber = dayToIsoWeekday[day];
      if (!dayNumber) {
        console.warn(`[CalendarAvailabilityHandler] Unknown day: ${day}`);
        return;
      }

      const availabilitySlots = slots.filter(slot => !slot.isAppointment);
      
      if (availabilitySlots.length === 0) return;
      
      for (let week = 0; week < weeksToShow; week++) {
        const weekOffset = week * 7;
        const dayDate = currentWeekStart.plus({ days: (dayNumber - 1) + weekOffset });
        
        if (dayDate < now.startOf('day')) continue;
        
        availabilitySlots.forEach(slot => {
          try {
            const [startHour, startMinute] = slot.startTime.split(':').map(Number);
            const [endHour, endMinute] = slot.endTime.split(':').map(Number);
            
            const startDateTime = dayDate.setZone(userTimeZone).set({
              hour: startHour,
              minute: startMinute,
              second: 0,
              millisecond: 0
            });

            const endDateTime = dayDate.setZone(userTimeZone).set({
              hour: endHour,
              minute: endMinute,
              second: 0,
              millisecond: 0
            });

            console.log(`[CalendarAvailabilityHandler] Creating event:`, {
              day,
              week,
              slot: slot.id,
              start: startDateTime.toISO(),
              end: endDateTime.toISO(),
              timeZone: userTimeZone
            });

            events.push({
              id: `${slot.id}-week-${week}`,
              title: 'Available',
              start: startDateTime.toJSDate(),
              end: endDateTime.toJSDate(),
              backgroundColor: '#22c55e',
              borderColor: '#16a34a',
              textColor: '#ffffff',
              editable: false,
              extendedProps: {
                isAvailability: true,
                isRecurring: !!slot.isRecurring,
                originalSlotId: slot.id,
                dayOfWeek: day,
                eventType: 'availability',
                week
              }
            });
          } catch (error) {
            console.error(`[CalendarAvailabilityHandler] Error processing slot ${slot.id} for ${day}:`, error);
          }
        });
      }
    });

    console.log(`[CalendarAvailabilityHandler] Total availability events created: ${events.length}`);
    return events;
  }, [weeklyAvailability, showAvailability, weeksToShow, userTimeZone]);

  useEffect(() => {
    setAvailabilityEvents(convertAvailabilityToEvents());
  }, [convertAvailabilityToEvents]);

  useEffect(() => {
    if (availabilityEvents.length > 0) {
      console.log('[CalendarAvailabilityHandler] Sending availability events to parent:', availabilityEvents.length);
      onEventsChange(availabilityEvents);
    } else if (!isLoading && showAvailability) {
      console.log('[CalendarAvailabilityHandler] No availability events to send');
      onEventsChange([]);
    }
  }, [availabilityEvents, onEventsChange, isLoading, showAvailability]);

  useEffect(() => {
    if (clinicianId && showAvailability) {
      console.log(`[CalendarAvailabilityHandler] Refreshing availability for clinician: ${clinicianId}`);
      refreshAvailability();
    }
  }, [clinicianId, refreshAvailability, showAvailability]);

  return null;
};

export default CalendarAvailabilityHandler;
