
import React, { useMemo } from "react";
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMinutes,
  startOfDay,
  setHours,
  setMinutes,
} from "date-fns";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useWeekViewData } from "./useWeekViewData";
import TimeSlot from "./TimeSlot";
import { isStartOfBlock, isEndOfBlock, isStartOfAppointment } from "./utils";
import { Appointment } from "@/types/appointment";
import { TimeZoneService } from "@/utils/timeZoneService";

export interface WeekViewProps {
  currentDate: Date;
  clinicianId: string | null;
  refreshTrigger?: number;
  appointments?: Appointment[];
  getClientName?: (clientId: string) => string;
  onAppointmentClick?: (appointment: Appointment) => void;
  onAvailabilityClick?: (date: Date, availabilityBlock: any) => void;
  userTimeZone?: string;
}

const WeekView: React.FC<WeekViewProps> = ({
  currentDate,
  clinicianId,
  refreshTrigger = 0,
  appointments = [],
  getClientName = () => "Unknown Client",
  onAppointmentClick,
  onAvailabilityClick,
  userTimeZone = "America/Chicago",
}) => {
  // Create array of days for the week and time slots for each day
  const { days, timeSlots } = useMemo(() => {
    // Log the input currentDate in multiple formats for debugging
    console.log("[WeekView] Generating days with currentDate:", {
      jsDate: currentDate.toISOString(),
      luxonDate: TimeZoneService.fromJSDate(currentDate, userTimeZone).toISO(),
    });

    // Generate days for the week using date-fns (will be converted to Luxon in the hook)
    const start = startOfWeek(currentDate, { weekStartsOn: 0 }); // 0 = Sunday
    const end = endOfWeek(currentDate, { weekStartsOn: 0 });
    const daysInWeek = eachDayOfInterval({ start, end });

    console.log(
      "[WeekView] Generated days for week:",
      daysInWeek.map((d) => format(d, "yyyy-MM-dd"))
    );

    // Generate time slots from 8 AM to 6 PM in 30-minute increments
    const slots = Array.from({ length: 21 }, (_, i) => {
      const minutes = i * 30;
      const baseTime = setHours(setMinutes(startOfDay(new Date()), 0), 8); // 8:00 AM
      return addMinutes(baseTime, minutes);
    });

    return { days: daysInWeek, timeSlots: slots };
  }, [currentDate, userTimeZone]);

  // Use the custom hook to get all the data and utility functions
  const {
    loading,
    timeBlocks,
    exceptions,
    availabilityBlocks,
    appointmentBlocks,
    getAvailabilityForBlock,
    isTimeSlotAvailable,
    getBlockForTimeSlot,
    getAppointmentForTimeSlot,
  } = useWeekViewData(
    days,
    clinicianId,
    refreshTrigger,
    appointments,
    getClientName,
    userTimeZone
  );

  // Detailed logging for week view appointments
  React.useEffect(() => {
    console.log(
      `[WeekView] Rendered with ${appointments.length} appointments and ${appointmentBlocks.length} blocks`
    );

    // Log sample client names for verification
    if (appointments.length > 0) {
      console.log(
        "[WeekView] All appointments:",
        appointments.map((app) => ({
          id: app.id,
          start_at: app.start_at,
          dateFormatted: app.start_at
            ? TimeZoneService.fromUTC(app.start_at, userTimeZone).toFormat(
                "yyyy-MM-dd"
              )
            : "Invalid",
          clientName: app.clientName || getClientName(app.client_id),
        }))
      );
    }

    if (appointmentBlocks.length > 0) {
      console.log(
        "[WeekView] Appointment blocks:",
        appointmentBlocks.map((block) => ({
          clientName: block.clientName,
          clientId: block.clientId,
          day: block.day.toFormat("yyyy-MM-dd"),
          time: `${block.start.toFormat("HH:mm")}-${block.end.toFormat(
            "HH:mm"
          )}`,
        }))
      );
    } else if (appointments.length > 0) {
      console.warn(
        "[WeekView] WARNING: There are appointments but no appointment blocks were created"
      );
    }

    // Log all days in the view for debugging
    console.log(
      "[WeekView] Days in view:",
      days.map((d) => format(d, "yyyy-MM-dd"))
    );
  }, [appointments, appointmentBlocks, getClientName, days, userTimeZone]);

  // Handle click on availability block
  const handleAvailabilityBlockClick = (day: Date, block: any) => {
    if (!onAvailabilityClick || !block.availabilityIds.length) return;

    const availabilityId = block.availabilityIds[0];

    if (block.isStandalone) {
      const exception = exceptions.find((exc) => exc.id === availabilityId);
      if (exception) {
        const availabilityBlock = {
          id: exception.id,
          day_of_week: format(day, "EEEE"),
          start_time: exception.start_time || "",
          end_time: exception.end_time || "",
          clinician_id: exception.clinician_id,
          is_active: true,
          isException: true,
          isStandalone: true,
        };
        onAvailabilityClick(day, availabilityBlock);
      }
      return;
    }

    const availabilityBlock = getAvailabilityForBlock(availabilityId);

    if (availabilityBlock) {
      onAvailabilityClick(day, availabilityBlock);
    }
  };

  if (loading) {
    return (
      <Card className="p-4 flex justify-center items-center h-[300px]">
        <Loader2 className="h-6 w-6 animate-spin text-valorwell-500" />
      </Card>
    );
  }

  return (
    <Card className="p-4">
      {/* Grid container with reduced gap to minimize visual breaks */}
      <div className="grid grid-cols-8 gap-0">
        {/* Header row */}
        <div className="col-span-1"></div>
        {days.map((day) => (
          <div
            key={day.toString()}
            className="col-span-1 p-2 text-center font-medium border-b-2 border-gray-200"
          >
            <div className="text-sm text-gray-400">{format(day, "EEE")}</div>
            <div
              className={`text-lg ${
                format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")
                  ? "bg-valorwell-500 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto"
                  : ""
              }`}
            >
              {format(day, "d")}
            </div>
          </div>
        ))}

        {/* Time slots and day cells */}
        {timeSlots.map((timeSlot) => {
          const timeLabel = format(timeSlot, "h:mm a");

          return (
            <React.Fragment key={timeSlot.toString()}>
              {/* Time label column */}
              <div className="col-span-1 p-2 text-xs text-gray-500 text-right pr-4 border-t border-gray-100">
                {timeLabel}
              </div>

              {/* Day columns for this time slot */}
              {days.map((day) => {
                const isAvailable = isTimeSlotAvailable(day, timeSlot);
                const currentBlock = getBlockForTimeSlot(day, timeSlot);
                const appointment = getAppointmentForTimeSlot(day, timeSlot);

                const slotStartTime = setMinutes(
                  setHours(startOfDay(day), timeSlot.getHours()),
                  timeSlot.getMinutes()
                );

                const blockStartCheck = isStartOfBlock(
                  slotStartTime,
                  currentBlock
                );
                const blockEndCheck = isEndOfBlock(slotStartTime, currentBlock);
                const appointmentStartCheck = isStartOfAppointment(
                  slotStartTime,
                  appointment
                );

                const cellKey = `${day.toString()}-${timeSlot.toString()}`;

                return (
                  <div
                    key={cellKey}
                    className="col-span-1 min-h-[40px] border-t border-gray-50 p-0 group hover:bg-gray-50"
                  >
                    <TimeSlot
                      day={day}
                      timeSlot={timeSlot}
                      isAvailable={isAvailable}
                      currentBlock={currentBlock}
                      appointment={appointment}
                      isStartOfBlock={blockStartCheck}
                      isEndOfBlock={blockEndCheck}
                      isStartOfAppointment={appointmentStartCheck}
                      handleAvailabilityBlockClick={
                        handleAvailabilityBlockClick
                      }
                      onAppointmentClick={onAppointmentClick}
                      originalAppointments={appointments}
                    />
                  </div>
                );
              })}
            </React.Fragment>
          );
        })}
      </div>
    </Card>
  );
};

export default WeekView;
