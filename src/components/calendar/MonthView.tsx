
import React from 'react';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useMonthViewData } from './useMonthViewData';
import CalendarGrid from './CalendarGrid';
import WeekView from './week-view';
import { TimeBlock, Appointment } from './week-view/useWeekViewData'; 
import { fromUTCTimestamp, ensureIANATimeZone } from '@/utils/timeZoneUtils';

interface MonthViewProps {
  currentDate: Date;
  clinicianId: string | null;
  refreshTrigger?: number;
  appointments?: Appointment[];
  getClientName?: (clientId: string) => string;
  onAppointmentClick?: (appointment: Appointment) => void;
  onAvailabilityClick?: (date: Date, availabilityBlock: AvailabilityBlock | TimeBlock) => void;
  userTimeZone?: string;
  weekViewMode?: boolean;
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
  // Ensure we have a valid timezone
  const validTimeZone = ensureIANATimeZone(userTimeZone || 'America/Chicago');
  
  console.log(`[MonthView] Rendering with timezone: ${validTimeZone}`, {
    appointmentsCount: appointments.length,
    weekViewMode,
    currentDate: currentDate.toISOString()
  });
  
  // Log the appointments with timestamps for debugging
  if (appointments.length > 0) {
    console.log(`[MonthView] First 3 appointments:`, appointments.slice(0, 3).map(apt => ({
      id: apt.id,
      timestamp: apt.appointment_datetime,
      endTimestamp: apt.appointment_end_datetime
    })));
  }
  
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

  if (weekViewMode) {
    return (
      <WeekView 
        currentDate={currentDate}
        clinicianId={clinicianId}
        refreshTrigger={refreshTrigger}
        appointments={appointments}
        getClientName={getClientName}
        onAppointmentClick={onAppointmentClick}
        onAvailabilityClick={onAvailabilityClick as (day: Date, block: TimeBlock) => void}
        userTimeZone={validTimeZone}
      />
    );
  }

  return (
    <Card className="p-4 rounded-lg shadow-md">
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
        userTimeZone={validTimeZone}
      />
    </Card>
  );
};

export default MonthView;
