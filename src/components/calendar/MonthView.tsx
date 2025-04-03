
import React from 'react';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import FullCalendarView from './FullCalendarView';
import WeekView from './week-view';
import { TimeBlock } from './week-view/useWeekViewData'; 
import { Appointment } from '@/hooks/useAppointments';

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
  if (weekViewMode) {
    return (
      <WeekView 
        currentDate={currentDate}
        clinicianId={clinicianId}
        refreshTrigger={refreshTrigger}
        appointments={appointments}
        getClientName={getClientName}
        onAppointmentClick={onAppointmentClick}
        onAvailabilityClick={onAvailabilityClick}
        userTimeZone={userTimeZone}
      />
    );
  }

  return (
    <FullCalendarView
      currentDate={currentDate}
      clinicianId={clinicianId}
      refreshTrigger={refreshTrigger}
      appointments={appointments}
      getClientName={getClientName}
      onAppointmentClick={onAppointmentClick}
      onAvailabilityClick={onAvailabilityClick}
      userTimeZone={userTimeZone}
      view="dayGridMonth"
      showAvailability={true}
    />
  );
};

export default MonthView;
