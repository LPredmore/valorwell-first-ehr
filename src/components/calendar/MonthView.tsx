
import React from 'react';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useMonthViewData } from './useMonthViewData';
import CalendarGrid from './CalendarGrid';

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

interface MonthViewProps {
  currentDate: Date;
  clinicianId: string | null;
  refreshTrigger?: number;
  appointments?: Appointment[];
  getClientName?: (clientId: string) => string;
  onAppointmentClick?: (appointment: Appointment) => void;
  onAvailabilityClick?: (date: Date, availabilityBlock: AvailabilityBlock) => void;
  userTimeZone?: string;
  weekViewMode?: boolean;
}

const MonthView: React.FC<MonthViewProps> = ({ 
  currentDate, 
  clinicianId, 
  refreshTrigger = 0,
  appointments = [],
  getClientName = () => 'Client',
  onAppointmentClick,
  onAvailabilityClick,
  userTimeZone,
  weekViewMode = false
}) => {
  const {
    loading,
    monthStart,
    days,
    dayAvailabilityMap,
    dayAppointmentsMap,
    availabilityByDay
  } = useMonthViewData(currentDate, clinicianId, refreshTrigger, appointments, weekViewMode);

  if (loading) {
    return (
      <Card className="p-4 flex justify-center items-center h-[300px]">
        <Loader2 className="h-6 w-6 animate-spin text-valorwell-500" />
      </Card>
    );
  }

  return (
    <Card className={`p-4 ${weekViewMode ? 'rounded-lg shadow-md' : ''}`}>
      <CalendarGrid
        days={days}
        monthStart={monthStart}
        dayAvailabilityMap={dayAvailabilityMap}
        dayAppointmentsMap={dayAppointmentsMap}
        availabilityByDay={availabilityByDay}
        getClientName={getClientName}
        onAppointmentClick={onAppointmentClick}
        onAvailabilityClick={onAvailabilityClick}
        weekViewMode={weekViewMode}
      />
    </Card>
  );
};

export default MonthView;
