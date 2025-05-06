
import React from 'react';
import { format, isSameMonth } from 'date-fns';
import { cn } from '@/lib/utils';

interface Appointment {
  id: string;
  client_id: string;
  date: string;
  start_time: string;
  end_time: string;
  type: string;
  status: string;
}

interface AvailabilityBlock {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  clinician_id?: string;
  is_active?: boolean;
}

interface DayAvailabilityInfo {
  hasAvailability: boolean;
  displayHours: string;
}

interface DayCellProps {
  day: Date;
  monthStart: Date;
  availabilityInfo: DayAvailabilityInfo;
  appointments: Appointment[];
  firstAvailability?: AvailabilityBlock;
  getClientName: (clientId: string) => string;
  onAppointmentClick?: (appointment: Appointment) => void;
  onAvailabilityClick?: (day: Date, availabilityBlock: AvailabilityBlock) => void;
}

const DayCell: React.FC<DayCellProps> = ({
  day,
  monthStart,
  availabilityInfo,
  appointments,
  firstAvailability,
  getClientName,
  onAppointmentClick,
  onAvailabilityClick
}) => {
  const isCurrentMonth = isSameMonth(day, monthStart);
  const dayNum = format(day, 'd');
  const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  const handleAvailabilityClick = () => {
    if (availabilityInfo.hasAvailability && firstAvailability && onAvailabilityClick) {
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
                  {getClientName(appointment.client_id)}
                </div>
                <div>{appointment.start_time.slice(0, 5)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DayCell;
