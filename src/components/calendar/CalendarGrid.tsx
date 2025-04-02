
import React from 'react';
import DayCell from './DayCell';

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

interface DayAvailabilityData {
  hasAvailability: boolean;
  isModified: boolean;
  displayHours: string;
}

interface CalendarGridProps {
  days: Date[];
  monthStart: Date;
  dayAvailabilityMap: Map<string, DayAvailabilityData>;
  dayAppointmentsMap: Map<string, Appointment[]>;
  availabilityByDay: Map<string, AvailabilityBlock>;
  getClientName: (clientId: string) => string;
  onAppointmentClick?: (appointment: Appointment) => void;
  onAvailabilityClick?: (day: Date, availabilityBlock: AvailabilityBlock) => void;
  weekViewMode?: boolean;
}

const CalendarGrid: React.FC<CalendarGridProps> = ({
  days,
  monthStart,
  dayAvailabilityMap,
  dayAppointmentsMap,
  availabilityByDay,
  getClientName,
  onAppointmentClick,
  onAvailabilityClick,
  weekViewMode = false
}) => {
  const weekDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="grid grid-cols-7 gap-2">
      {weekDayNames.map((day, index) => (
        <div 
          key={day} 
          className="p-2 text-center font-medium border-b border-gray-200 bg-gray-50 rounded-t"
        >
          {weekViewMode ? day : day.slice(0, 3)}
        </div>
      ))}

      {days.map((day) => {
        const dateStr = day.toISOString().split('T')[0];
        const dayAppointments = dayAppointmentsMap.get(dateStr) || [];
        const dayAvailability = dayAvailabilityMap.get(dateStr) || { 
          hasAvailability: false, 
          isModified: false,
          displayHours: ''
        };
        const firstAvailability = availabilityByDay.get(dateStr);
        
        return (
          <DayCell
            key={day.toString()}
            day={day}
            monthStart={monthStart}
            availabilityInfo={dayAvailability}
            appointments={dayAppointments}
            getClientName={getClientName}
            onAppointmentClick={onAppointmentClick}
            onAvailabilityClick={onAvailabilityClick}
            firstAvailability={firstAvailability}
            weekViewMode={weekViewMode}
          />
        );
      })}
    </div>
  );
};

export default CalendarGrid;
