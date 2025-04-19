
import React from 'react';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useMonthViewData } from './useMonthViewData';
import { TimeBlock, AvailabilityBlock } from './week-view/types';
import { ensureIANATimeZone } from '@/utils/timeZoneUtils';
import { Appointment } from '@/types/appointment';
import FullCalendarWrapper from './FullCalendarWrapper';

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

  // Convert availability to TimeBlock array for FullCalendarWrapper
  const availabilityBlocks: TimeBlock[] = [];
  Object.values(availabilityByDay).forEach(dayBlocks => {
    dayBlocks.forEach(block => {
      availabilityBlocks.push({
        id: block.id,
        day: new Date(block.day),
        start: new Date(block.start),
        end: new Date(block.end),
        availabilityIds: [block.id],
        type: 'block'
      });
    });
  });

  // Determine which FullCalendar view to use
  const view = weekViewMode ? 'timeGridWeek' : 'dayGridMonth';

  return (
    <Card className="p-4 rounded-lg shadow-md">
      <FullCalendarWrapper
        currentDate={currentDate}
        clinicianId={clinicianId}
        appointments={appointments}
        availabilityBlocks={availabilityBlocks}
        userTimeZone={validTimeZone}
        view={view}
        onAppointmentClick={onAppointmentClick}
        onAvailabilityClick={onAvailabilityClick}
        height={650}
      />
    </Card>
  );
};

export default MonthView;
