
import { useState, useEffect, useMemo } from "react";
import { format, addMinutes, startOfDay, setHours, setMinutes } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { TimeZoneService } from "@/utils/timeZoneService";
import { Appointment } from "@/types/appointment";
import {
  TimeBlock,
  AppointmentBlock,
  AvailabilityBlock,
  AvailabilityException,
} from "./types";
import { DateTime } from "luxon";

export const useWeekViewData = (
  days: Date[],
  clinicianId: string | null,
  refreshTrigger: number = 0,
  appointments: Appointment[] = [],
  getClientName: (clientId: string) => string = () => "Client",
  userTimeZone: string = "America/Chicago"
) => {
  const [loading, setLoading] = useState(true);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [availabilityBlocks, setAvailabilityBlocks] = useState<
    AvailabilityBlock[]
  >([]);
  const [exceptions, setExceptions] = useState<AvailabilityException[]>([]);
  const [appointmentBlocks, setAppointmentBlocks] = useState<
    AppointmentBlock[]
  >([]);

  // Format days for display and queries
  const dayOfWeek = days.map((day) => format(day, "EEEE"));
  const formattedDates = days.map((day) => format(day, "yyyy-MM-dd"));

  // Fetch availability data from the availability_blocks table
  useEffect(() => {
    const fetchAvailabilityData = async () => {
      setLoading(true);
      if (!clinicianId) {
        setTimeBlocks([]);
        setAvailabilityBlocks([]);
        setLoading(false);
        return;
      }

      try {
        console.log(
          "[useWeekViewData] Fetching availability for clinician:",
          clinicianId
        );

        // Convert days to DateTime objects for timezone-aware date range
        const startDate = TimeZoneService.fromJSDate(
          days[0],
          userTimeZone
        ).startOf("day");
        const endDate = TimeZoneService.fromJSDate(
          days[days.length - 1],
          userTimeZone
        ).endOf("day");

        console.log("[useWeekViewData] Fetching availability between:", {
          startDate: startDate.toISO(),
          endDate: endDate.toISO(),
          timezone: userTimeZone,
        });

        // Query the availability_blocks table for the date range
        const { data: availabilityData, error: availabilityError } =
          await supabase
            .from("availability_blocks")
            .select("*")
            .eq("clinician_id", clinicianId)
            .eq("is_active", true)
            .gte("start_at", startDate.toUTC().toISO())
            .lte("end_at", endDate.toUTC().toISO());

        if (availabilityError) {
          console.error(
            "[useWeekViewData] Error fetching availability_blocks:",
            availabilityError
          );
          setTimeBlocks([]);
          setAvailabilityBlocks([]);
        } else {
          console.log(
            `[useWeekViewData] Fetched ${
              availabilityData?.length || 0
            } availability blocks`
          );
          // Transform the availability blocks into the format needed for display
          if (availabilityData && availabilityData.length > 0) {
            setAvailabilityBlocks(availabilityData);
            processAvailabilityBlocks(availabilityData);
          } else {
            setTimeBlocks([]);
            setAvailabilityBlocks([]);
          }
        }
      } catch (error) {
        console.error("[useWeekViewData] Error:", error);
        setTimeBlocks([]);
        setAvailabilityBlocks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailabilityData();
  }, [days, clinicianId, refreshTrigger, userTimeZone]);

  // Process appointments when they change
  useEffect(() => {
    const blocks = processAppointments();
    setAppointmentBlocks(blocks);
  }, [appointments, days, userTimeZone, getClientName]);

  // Transform availability_blocks data into TimeBlock objects
  const processAvailabilityBlocks = (blocks: any[]) => {
    if (!blocks.length) {
      setTimeBlocks([]);
      return;
    }

    const parsedBlocks: TimeBlock[] = [];

    blocks.forEach((block) => {
      // Convert UTC ISO strings to DateTime objects in the user's timezone
      const start = TimeZoneService.fromUTC(block.start_at, userTimeZone);
      const end = TimeZoneService.fromUTC(block.end_at, userTimeZone);

      // Find which day this block belongs to
      const blockDay = days.find((day) => {
        const dayStart = TimeZoneService.fromJSDate(day, userTimeZone).startOf(
          "day"
        );
        const dayEnd = TimeZoneService.fromJSDate(day, userTimeZone).endOf(
          "day"
        );

        // Check if the block overlaps with this day
        return (
          (start >= dayStart && start < dayEnd) ||
          (end > dayStart && end <= dayEnd) ||
          (start < dayStart && end > dayEnd)
        );
      });

      if (blockDay) {
        const dayDateTime = TimeZoneService.fromJSDate(blockDay, userTimeZone);

        parsedBlocks.push({
          start: start,
          end: end,
          availabilityIds: [block.id],
          day: dayDateTime,
        });
      }
    });

    // Sort blocks by start time
    parsedBlocks.sort((a, b) => a.start.toMillis() - b.start.toMillis());

    // Merge overlapping blocks
    const mergedBlocks: TimeBlock[] = [];

    parsedBlocks.forEach((block) => {
      const lastBlock = mergedBlocks[mergedBlocks.length - 1];

      if (
        lastBlock &&
        block.start <= lastBlock.end &&
        TimeZoneService.isSameDay(block.day!, lastBlock.day!)
      ) {
        // Extend the end time if this block ends later
        if (block.end > lastBlock.end) {
          lastBlock.end = block.end;
        }
        lastBlock.availabilityIds.push(block.availabilityIds[0]);
      } else {
        // Add as a new block
        mergedBlocks.push({
          start: block.start,
          end: block.end,
          availabilityIds: [...block.availabilityIds],
          day: block.day,
        });
      }
    });

    setTimeBlocks(mergedBlocks);
  };

  // Process appointments into blocks with strict day-specific logic
  const processAppointments = () => {
    // Convert days array to DateTime objects for easier comparison
    const daysAsDateTime = days.map((day) =>
      TimeZoneService.fromJSDate(day, userTimeZone)
    );

    console.log(
      `[useWeekViewData] Processing ${appointments.length} appointments for ${daysAsDateTime.length} days`
    );
    console.log(
      "[useWeekViewData] Days in view:",
      daysAsDateTime.map((d) => d.toFormat("yyyy-MM-dd"))
    );

    // Skip processing if there are no appointments
    if (appointments.length === 0) {
      console.log('[useWeekViewData] No appointments to process');
      return [];
    }

    // Process each appointment using Luxon DateTime comparison
    const blocks: AppointmentBlock[] = [];
    
    appointments.forEach((appointment) => {
      // Skip invalid data
      if (!appointment.start_at || !appointment.end_at) {
        console.error(
          "[useWeekViewData] Invalid appointment data:",
          appointment
        );
        return;
      }

      try {
        // Get the DateTime objects in the user's timezone from the UTC timestamp
        const startDateTime = TimeZoneService.fromUTC(
          appointment.start_at,
          userTimeZone
        );
        const endDateTime = TimeZoneService.fromUTC(
          appointment.end_at,
          userTimeZone
        );

        if (!startDateTime.isValid || !endDateTime.isValid) {
          console.error(
            "[useWeekViewData] Invalid DateTime conversion for appointment",
            appointment.id
          );
          return;
        }

        // For each day in the calendar, check if the appointment falls on that day
        // using Luxon's hasSame method for reliable day-level comparison
        for (let i = 0; i < daysAsDateTime.length; i++) {
          const day = daysAsDateTime[i];
          
          // Critical fix: Use proper day comparison with Luxon
          if (startDateTime.hasSame(day, "day")) {
            console.log(
              `[useWeekViewData] ✓ Match: Appointment ${appointment.id} on ${startDateTime.toFormat("yyyy-MM-dd")} matches day ${day.toFormat("yyyy-MM-dd")}`
            );
            
            blocks.push({
              id: appointment.id,
              day: day,
              start: startDateTime,
              end: endDateTime,
              clientId: appointment.client_id,
              type: appointment.type,
              clientName:
                appointment.clientName || getClientName(appointment.client_id),
            });
            
            // Important! Break after finding a match to prevent duplicate appointments
            break;
          }
        }
      } catch (error) {
        console.error(
          `[useWeekViewData] Error processing appointment ${appointment.id}:`,
          error
        );
      }
    });

    console.log(
      `[useWeekViewData] Created ${blocks.length} appointment blocks`
    );
    return blocks;
  };

  // Fixed function with strict day matching for appointments
  const getAppointmentForTimeSlot = (day: Date, timeSlot: Date) => {
    // Convert the input JS Date objects to Luxon DateTime objects in user's timezone
    const slotDay = TimeZoneService.fromJSDate(day, userTimeZone);
    const slotTime = TimeZoneService.fromJSDate(timeSlot, userTimeZone);
    
    // Find appointment block using strict day and time range comparison
    const matchingAppointment = appointmentBlocks.find((block) => {
      // First check if the days match exactly using Luxon's hasSame method
      const isDaySame = block.day.hasSame(slotDay, "day");
      
      if (!isDaySame) {
        return false; // Skip time check entirely if day doesn't match
      }
      
      // Only check time range if day matches - convert slot time to same day as appointment
      const adjustedSlotTime = slotTime.set({
        year: block.day.year,
        month: block.day.month,
        day: block.day.day
      });
      
      // Check if the time slot is within the appointment time range
      return adjustedSlotTime >= block.start && adjustedSlotTime < block.end;
    });

    return matchingAppointment;
  };

  // Utility functions for determining if a time slot is available and finding blocks
  const isTimeSlotAvailable = (day: Date, timeSlot: Date) => {
    return timeBlocks.some((block) => {
      const slotTime = TimeZoneService.fromJSDate(timeSlot, userTimeZone);
      const blockStart = block.start;
      const blockEnd = block.end;
      
      // Make sure we're checking same-day when comparing availability
      const slotDay = TimeZoneService.fromJSDate(day, userTimeZone);
      const isSameDay = block.day?.hasSame(slotDay, 'day');
      
      if (!isSameDay) return false;
      
      // Adjusted slot time to match the exact day of the block
      const adjustedSlotTime = slotTime.set({
        year: block.day?.year || slotDay.year,
        month: block.day?.month || slotDay.month,
        day: block.day?.day || slotDay.day
      });
      
      return adjustedSlotTime >= blockStart && adjustedSlotTime < blockEnd;
    });
  };

  const getBlockForTimeSlot = (day: Date, timeSlot: Date) => {
    return timeBlocks.find((block) => {
      const slotTime = TimeZoneService.fromJSDate(timeSlot, userTimeZone);
      const blockStart = block.start;
      const blockEnd = block.end;
      
      // Make sure we're checking same-day when comparing availability
      const slotDay = TimeZoneService.fromJSDate(day, userTimeZone);
      const isSameDay = block.day?.hasSame(slotDay, 'day');
      
      if (!isSameDay) return false;
      
      // Adjusted slot time to match the exact day of the block
      const adjustedSlotTime = slotTime.set({
        year: block.day?.year || slotDay.year,
        month: block.day?.month || slotDay.month,
        day: block.day?.day || slotDay.day
      });
      
      return adjustedSlotTime >= blockStart && adjustedSlotTime < blockEnd;
    });
  };

  const getAvailabilityForBlock = (blockId: string) => {
    return availabilityBlocks.find((block) => block.id === blockId);
  };

  return {
    loading,
    timeBlocks,
    exceptions,
    availabilityBlocks,
    appointmentBlocks,
    getAvailabilityForBlock,
    isTimeSlotAvailable,
    getBlockForTimeSlot,
    getAppointmentForTimeSlot,
  };
};
