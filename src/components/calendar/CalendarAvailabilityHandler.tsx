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
    
    // Create now in user timezone to ensure correct day boundaries
    const now = DateTime.now().setZone(userTimeZone);
    // Get start of week in user timezone
    const currentWeekStart = now.startOf('week');
    
    console.log('[CalendarAvailabilityHandler] Converting availability to events:', {
      weeksToShow,
      userTimeZone,
      now: now.toISO(),
      currentWeekStart: currentWeekStart.toISO()
    });

    // Map day names to ISO weekday numbers (1-7, Monday=1, Sunday=7)
    const dayToIsoWeekday: Record<string, number> = {
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
      sunday: 7
    };

    // Add recurring events
    Object.entries(weeklyAvailability).forEach(([day, slots]) => {
      const dayNumber = dayToIsoWeekday[day];
      if (!dayNumber) {
        console.warn(`[CalendarAvailabilityHandler] Unknown day: ${day}`);
        return;
      }

      const availabilitySlots = slots.filter(slot => !slot.isAppointment);
      console.log(`[CalendarAvailabilityHandler] Processing ${availabilitySlots.length} slots for ${day}`);

      if (availabilitySlots.length === 0) return;

      for (let week = 0; week < weeksToShow; week++) {
        const weekOffset = week * 7;
        
        // Create day date in user timezone explicitly
        const dayDate = currentWeekStart
          .plus({ days: (dayNumber - 1) + weekOffset })
          .setZone(userTimeZone);

        // Skip past dates
        if (dayDate < now.startOf('day')) {
          console.log(`[CalendarAvailabilityHandler] Skipping past date: ${dayDate.toISO()}`);
          continue;
        }

        availabilitySlots.forEach(slot => {
          try {
            const [startHour, startMinute] = slot.startTime.split(':').map(Number);
            const [endHour, endMinute] = slot.endTime.split(':').map(Number);

            // Create the full datetime while maintaining timezone
            const startDateTime = dayDate.set({
              hour: startHour,
              minute: startMinute,
              second: 0,
              millisecond: 0
            });

            const endDateTime = dayDate.set({
              hour: endHour,
              minute: endMinute,
              second: 0,
              millisecond: 0
            });

            // Verify times are valid before adding event
            if (!startDateTime.isValid || !endDateTime.isValid) {
              console.error(`[CalendarAvailabilityHandler] Invalid datetime created:`, {
                start: startDateTime.invalidReason,
                end: endDateTime.invalidReason
              });
              return;
            }

            console.log(`[CalendarAvailabilityHandler] Creating event:`, {
              day,
              week,
              slotTime: `${slot.startTime}-${slot.endTime}`,
              startISO: startDateTime.toISO(),
              endISO: endDateTime.toISO(),
              userTimeZone,
              startLocal: startDateTime.toLocal().toISO(),
              endLocal: endDateTime.toLocal().toISO()
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
                week,
                timezone: userTimeZone,
                is_active: true
              }
            });
          } catch (error) {
            console.error(`[CalendarAvailabilityHandler] Error processing slot ${slot.id} for ${day}:`, error);
          }
        });
      }
    });

    // Add single occurrence events
    Object.entries(weeklyAvailability).forEach(([day, slots]) => {
      slots.forEach(slot => {
        if (!slot.isRecurring) {
          try {
            const [startHour, startMinute] = slot.startTime.split(':').map(Number);
            const [endHour, endMinute] = slot.endTime.split(':').map(Number);
            
            const slotDate = DateTime.fromFormat(slot.date || '', 'yyyy-MM-dd', { zone: userTimeZone });
            
            if (!slotDate.isValid) {
              console.error('[CalendarAvailabilityHandler] Invalid date for single slot:', slot);
              return;
            }

            const startDateTime = slotDate.set({
              hour: startHour,
              minute: startMinute,
              second: 0,
              millisecond: 0
            });

            const endDateTime = slotDate.set({
              hour: endHour,
              minute: endMinute,
              second: 0,
              millisecond: 0
            });

            events.push({
              id: slot.id,
              title: 'Available',
              start: startDateTime.toJSDate(),
              end: endDateTime.toJSDate(),
              backgroundColor: '#3b82f6',
              borderColor: '#2563eb',
              textColor: '#ffffff',
              editable: false,
              extendedProps: {
                isAvailability: true,
                isRecurring: false,
                originalSlotId: slot.id,
                dayOfWeek: day,
                eventType: 'availability',
                timezone: userTimeZone,
                is_active: true
              }
            });
          } catch (error) {
            console.error(`[CalendarAvailabilityHandler] Error processing single slot ${slot.id}:`, error);
          }
        }
      });
    });

    console.log(`[CalendarAvailabilityHandler] Total events created: ${events.length}`);
    return events;
  }, [weeklyAvailability, showAvailability, weeksToShow, userTimeZone]);

  // Generate availability events when data changes
  useEffect(() => {
    const events = convertAvailabilityToEvents();
    console.log('[CalendarAvailabilityHandler] Setting availability events:', events.length);
    setAvailabilityEvents(events);
  }, [convertAvailabilityToEvents]);

  // Update provided events when our internal state changes
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
