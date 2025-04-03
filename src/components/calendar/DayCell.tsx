
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
  weekViewMode?: boolean;
}

const DayCell: React.FC<DayCellProps> = ({
  day,
  monthStart,
  availabilityInfo,
  appointments,
  getClientName,
  onAppointmentClick,
  onAvailabilityClick,
  firstAvailability,
  weekViewMode = false
}) => {
  const { hasAvailability, isModified, displayHours } = availabilityInfo;
  
  const handleAvailabilityClick = () => {
    console.log('DayCell availability clicked, forwarding to handler');
    if (onAvailabilityClick && firstAvailability) {
      onAvailabilityClick(day, firstAvailability);
    }
  };

  const isToday = isSameDay(day, new Date());
  const isCurrentMonth = isSameMonth(day, monthStart);
  
  // For week view mode, show a larger cell with more appointment details
  if (weekViewMode) {
    return (
      <div
        className={`
          p-3 min-h-[180px] border rounded-md transition-all
          ${isToday ? 'border-blue-500 border-2' : 'border-gray-200'} 
          ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'}
          hover:border-blue-300 hover:shadow-sm
        `}
      >
        <div className="flex justify-between items-start mb-2">
          <span className={`font-medium ${isToday ? 'text-blue-600' : ''}`}>
            {format(day, 'MMM d')}
          </span>
          {hasAvailability && (
            <div 
              className={`
                ${isModified ? 'bg-teal-100 text-teal-800' : 'bg-green-100 text-green-800'} 
                text-xs px-2 py-1 rounded cursor-pointer hover:bg-opacity-80 transition-colors
              `}
              onClick={handleAvailabilityClick}
            >
              {isModified ? 'Modified' : 'Available'}
              {displayHours && (
                <div className="text-xs mt-0.5">{displayHours}</div>
              )}
            </div>
          )}
        </div>
        
        {appointments.length > 0 ? (
          <div className="mt-2 space-y-2 max-h-[140px] overflow-y-auto pr-1">
            {appointments.map(appointment => (
              <div 
                key={appointment.id} 
                className="bg-blue-50 border border-blue-100 text-blue-800 text-xs p-2 rounded cursor-pointer hover:bg-blue-100 transition-colors"
                onClick={() => onAppointmentClick && onAppointmentClick(appointment)}
              >
                <div className="font-semibold">
                  {formatDateToTime12Hour(parseISO(`2000-01-01T${appointment.start_time}`))} - {formatDateToTime12Hour(parseISO(`2000-01-01T${appointment.end_time}`))}
                </div>
                <div className="truncate">{getClientName(appointment.client_id)}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm">
            No appointments
          </div>
        )}
      </div>
    );
  }

  // Monthly view cell
  return (
    <div
      className={`
        p-2 min-h-[120px] border rounded-md transition-all
        ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'} 
        ${isToday ? 'border-blue-500 border-2' : 'border-gray-200'}
        hover:border-blue-300 hover:shadow-sm
      `}
    >
      <div className="flex justify-between items-start">
        <span className={`text-sm font-medium ${isToday ? 'text-blue-600' : ''}`}>
          {format(day, 'd')}
        </span>
        {hasAvailability && isCurrentMonth && (
          <div 
            className={`
              ${isModified ? 'bg-teal-100 text-teal-800' : 'bg-green-100 text-green-800'} 
              text-xs px-1 py-0.5 rounded cursor-pointer hover:opacity-80 transition-colors
            `}
            onClick={handleAvailabilityClick}
          >
            {isModified ? 'Modified' : 'Available'}
            {displayHours && (
              <div className="text-xs mt-0.5">{displayHours}</div>
            )}
          </div>
        )}
      </div>
      
      {appointments.length > 0 && isCurrentMonth && (
        <div className="mt-1 space-y-1">
          {appointments.slice(0, 3).map(appointment => (
            <div 
              key={appointment.id} 
              className="bg-blue-50 border border-blue-100 text-blue-800 text-xs p-1 rounded truncate cursor-pointer hover:bg-blue-100 transition-colors"
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
