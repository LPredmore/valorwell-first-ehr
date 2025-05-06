
import React, { useEffect } from 'react';
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
  clinician_id?: string;
}

interface AvailabilityBlock {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  clinician_id?: string;
  is_active?: boolean;
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
}

const MonthView: React.FC<MonthViewProps> = ({ 
  currentDate, 
  clinicianId, 
  refreshTrigger = 0,
  appointments = [],
  getClientName = () => 'Client',
  onAppointmentClick,
  onAvailabilityClick,
  userTimeZone = 'America/Chicago'
}) => {
  // Log appointments for debugging
  useEffect(() => {
    console.log(`[MonthView] Rendering with ${appointments.length} appointments for clinician ${clinicianId}`);
    
    if (appointments && appointments.length > 0) {
      console.log(`[MonthView] Sample appointment:`, {
        id: appointments[0].id,
        date: appointments[0].date,
        dateType: typeof appointments[0].date,
        start_time: appointments[0].start_time,
        end_time: appointments[0].end_time,
        clinician_id: appointments[0].clinician_id || 'Not specified'
      });
    }
  }, [appointments, clinicianId]);

  const {
    loading,
    monthStart,
    days,
    dayAvailabilityMap,
    dayAppointmentsMap,
    availabilityByDay
  } = useMonthViewData(currentDate, clinicianId, refreshTrigger, appointments, userTimeZone);

  // Check if the appointments are being correctly processed in the monthView data
  useEffect(() => {
    const appointmentCount = Object.values(dayAppointmentsMap).reduce(
      (sum, dayApps) => sum + dayApps.length, 0
    );
    
    console.log(`[MonthView] Processed appointments in useMonthViewData: ${appointmentCount} appointments distributed across calendar`);
    
    // Log a few example days with appointments
    const daysWithAppointments = Object.entries(dayAppointmentsMap)
      .filter(([_, apps]) => apps.length > 0)
      .slice(0, 3);
      
    if (daysWithAppointments.length > 0) {
      daysWithAppointments.forEach(([day, apps]) => {
        console.log(`[MonthView] Day ${day} has ${apps.length} appointments:`, 
          apps.map(app => ({ id: app.id, start: app.start_time, end: app.end_time }))
        );
      });
    } else {
      console.log('[MonthView] No days with appointments found in the processed data');
    }
  }, [dayAppointmentsMap]);

  if (loading) {
    return (
      <Card className="p-4 flex justify-center items-center h-[300px]">
        <Loader2 className="h-6 w-6 animate-spin text-valorwell-500 mr-2" />
        <span>Loading calendar...</span>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <CalendarGrid
        days={days}
        monthStart={monthStart}
        dayAvailabilityMap={dayAvailabilityMap}
        dayAppointmentsMap={dayAppointmentsMap}
        availabilityByDay={availabilityByDay}
        getClientName={getClientName}
        onAppointmentClick={onAppointmentClick}
        onAvailabilityClick={onAvailabilityClick}
      />
    </Card>
  );
};

export default MonthView;
