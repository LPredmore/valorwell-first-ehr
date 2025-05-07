
import React from 'react';
import { cn } from '@/lib/utils';
import { Appointment } from '@/types/appointment';
import { AvailabilityBlock } from '@/types/availability';
import { DayAvailabilityData } from '@/hooks/useMonthViewData';
import { TimeZoneService } from '@/utils/timeZoneService';
import { DateTime } from 'luxon';

interface DayCellProps {
  day: DateTime;
  monthStart: DateTime;
  availabilityInfo: DayAvailabilityData;
  appointments: Appointment[];
  firstAvailability?: AvailabilityBlock;
  getClientName: (clientId: string) => string;
  onAppointmentClick?: (appointment: Appointment) => void;
  onAvailabilityClick?: (day: DateTime, availabilityBlock: AvailabilityBlock) => void;
  userTimeZone?: string;
}

const DayCell: React.FC<DayCellProps> = ({
  day,
  monthStart,
  availabilityInfo,
  appointments,
  firstAvailability,
  getClientName,
  onAppointmentClick,
  onAvailabilityClick,
  userTimeZone = 'America/Chicago'
}) => {
  const isCurrentMonth = day.hasSame(monthStart, 'month');
  const dayNum = day.day.toString();
  
  // Get today's date in the user's timezone
  const today = DateTime.now().setZone(userTimeZone);
  const isToday = day.hasSame(today, 'day');

  // Format time function for appointment display
  const formatAppointmentTime = (appointment: Appointment): string => {
    if (!appointment.start_at) return 'N/A';
    try {
      const startDateTime = TimeZoneService.fromUTC(appointment.start_at, userTimeZone);
      return TimeZoneService.formatTime(startDateTime);
    } catch (error) {
      console.error('[DayCell] Error formatting appointment time:', error);
      return 'N/A';
    }
  };

  const handleAvailabilityClick = () => {
    if (availabilityInfo.hasAvailability && firstAvailability && onAvailabilityClick) {
      // Log availability block details for debugging
      console.log('[DayCell] Clicking availability block:', {
        id: firstAvailability.id,
        start_at: firstAvailability.start_at,
        end_at: firstAvailability.end_at,
        day: day.toISO(),
        timeZone: userTimeZone
      });
      
      onAvailabilityClick(day, firstAvailability);
    }
  };

  return (
    <div
      className={cn(
        "min-h-[80px] border border-gray-200 p-1",
        !isCurrentMonth ? "bg-gray-50" : "bg-white",
        isToday ? "border-blue-500 border-2" : ""
      )}
    >
      <div className="flex justify-between items-center">
        <span
          className={cn(
            "text-sm font-medium",
            !isCurrentMonth ? "text-gray-400" : "text-gray-900"
          )}
        >
          {dayNum}
        </span>
      </div>

      <div className="mt-1 space-y-1 text-xs">
        {availabilityInfo.hasAvailability && (
          <div
            className="bg-green-100 text-green-800 p-1 rounded cursor-pointer hover:bg-green-200"
            onClick={handleAvailabilityClick}
          >
            <p className="font-medium">Available</p>
            {availabilityInfo.displayHours && (
              <p>{availabilityInfo.displayHours}</p>
            )}
          </div>
        )}

        {appointments.length > 0 && (
          <div className="space-y-1 mt-1">
            {appointments.map((appointment) => (
              <div
                key={appointment.id}
                className="bg-blue-100 text-blue-800 p-1 rounded cursor-pointer hover:bg-blue-200"
                onClick={() => onAppointmentClick && onAppointmentClick(appointment)}
              >
                <div className="font-medium truncate">
                  {appointment.clientName || 'Unknown Client'}
                </div>
                <div>{formatAppointmentTime(appointment)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DayCell;
