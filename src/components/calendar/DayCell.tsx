
import React from 'react';
import { format, isSameDay, isSameMonth, parseISO } from 'date-fns';
import { formatDateToTime12Hour } from '@/utils/timeZoneUtils';

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
  isException?: boolean;
}

interface DayCellProps {
  day: Date;
  monthStart: Date;
  availabilityInfo: {
    hasAvailability: boolean;
    isModified: boolean;
    displayHours: string;
  };
  appointments: Appointment[];
  getClientName: (clientId: string) => string;
  onAppointmentClick?: (appointment: Appointment) => void;
  onAvailabilityClick?: (day: Date, availabilityBlock: AvailabilityBlock) => void;
  firstAvailability?: AvailabilityBlock;
}

const DayCell: React.FC<DayCellProps> = ({
  day,
  monthStart,
  availabilityInfo,
  appointments,
  getClientName,
  onAppointmentClick,
  onAvailabilityClick,
  firstAvailability
}) => {
  const { hasAvailability, isModified, displayHours } = availabilityInfo;
  
  const handleAvailabilityClick = () => {
    if (onAvailabilityClick && firstAvailability) {
      onAvailabilityClick(day, firstAvailability);
    }
  };

  return (
    <div
      className={`p-2 min-h-[100px] border border-gray-100 ${!isSameMonth(day, monthStart) ? 'bg-gray-50 text-gray-400' : ''} ${isSameDay(day, new Date()) ? 'border-valorwell-500 border-2' : ''}`}
    >
      <div className="flex justify-between items-start">
        <span className={`text-sm font-medium ${isSameDay(day, new Date()) ? 'text-valorwell-500' : ''}`}>
          {format(day, 'd')}
        </span>
        {hasAvailability && isSameMonth(day, monthStart) && (
          <div 
            className={`${isModified ? 'bg-teal-100 text-teal-800' : 'bg-green-100 text-green-800'} text-xs px-1 py-0.5 rounded cursor-pointer hover:opacity-80 transition-colors`}
            onClick={handleAvailabilityClick}
          >
            {isModified ? 'Modified' : 'Available'}
            {displayHours && (
              <div className="text-xs mt-0.5">{displayHours}</div>
            )}
          </div>
        )}
      </div>
      
      {appointments.length > 0 && isSameMonth(day, monthStart) && (
        <div className="mt-1 space-y-1">
          {appointments.slice(0, 3).map(appointment => (
            <div 
              key={appointment.id} 
              className="bg-blue-100 text-blue-800 text-xs p-1 rounded truncate cursor-pointer hover:bg-blue-200 transition-colors"
              onClick={() => onAppointmentClick && onAppointmentClick(appointment)}
            >
              {formatDateToTime12Hour(parseISO(`2000-01-01T${appointment.start_time}`))} - {getClientName(appointment.client_id)}
            </div>
          ))}
          {appointments.length > 3 && (
            <div className="text-xs text-gray-500 pl-1">
              +{appointments.length - 3} more
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DayCell;
