
import React from 'react';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import FullCalendarView from './FullCalendarView';
import WeekView from './week-view';
import { TimeBlock } from './week-view/types/availability-types'; 
import { Appointment as HookAppointment } from '@/hooks/useAppointments';

// Create an interface that extends the imported Appointment type to ensure compatibility
interface Appointment extends Partial<HookAppointment> {
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
  isStandalone?: boolean;
  originalAvailabilityId?: string | null;
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
  // Add video_room_url property to appointments if it doesn't exist
  const enhancedAppointments = appointments.map(appointment => ({
    ...appointment,
    video_room_url: appointment.video_room_url || null
  })) as HookAppointment[];

  // Create adapter function for the onAvailabilityClick callback
  const handleAvailabilityClick = onAvailabilityClick 
    ? (date: Date, block: any) => {
        console.log('MonthView passing availability click:', date, block);
        onAvailabilityClick(date, block);
      }
    : undefined;

  if (weekViewMode) {
    return (
      <WeekView 
        currentDate={currentDate}
        clinicianId={clinicianId}
        refreshTrigger={refreshTrigger}
        appointments={enhancedAppointments}
        getClientName={getClientName}
        onAppointmentClick={onAppointmentClick}
        onAvailabilityClick={handleAvailabilityClick}
        userTimeZone={userTimeZone}
      />
    );
  }

  return (
    <FullCalendarView
      currentDate={currentDate}
      clinicianId={clinicianId}
      refreshTrigger={refreshTrigger}
      appointments={enhancedAppointments}
      getClientName={getClientName}
      onAppointmentClick={onAppointmentClick}
      onAvailabilityClick={handleAvailabilityClick}
      userTimeZone={userTimeZone}
      view="dayGridMonth"
      showAvailability={true}
    />
  );
};

export default MonthView;
