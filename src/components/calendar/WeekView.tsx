
import React from 'react';
import { Appointment, AvailabilityBlock } from './useCalendarState';

interface WeekViewProps {
  currentDate: Date;
  clinicianId: string | null;
  refreshTrigger: number;
  appointments: Appointment[];
  getClientName: (clientId: string) => string;
  onAppointmentClick: (appointment: Appointment) => void;
  onAvailabilityClick: (date: Date, availabilityBlock: AvailabilityBlock) => void;
  userTimeZone: string;
}

const WeekView: React.FC<WeekViewProps> = ({
  currentDate,
  clinicianId,
  refreshTrigger,
  appointments,
  getClientName,
  onAppointmentClick,
  onAvailabilityClick,
  userTimeZone
}) => {
  return (
    <div className="bg-white p-4 rounded-md shadow-sm">
      <div className="text-center mb-4">
        <h2 className="text-lg font-semibold">Week View</h2>
        <p className="text-sm text-gray-500">This component is currently in development</p>
      </div>
      <div className="h-[600px] flex items-center justify-center border border-dashed border-gray-300 rounded-md">
        <p className="text-gray-500">Week view calendar will be implemented here</p>
      </div>
    </div>
  );
};

export default WeekView;
