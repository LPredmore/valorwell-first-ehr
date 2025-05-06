
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
  // Enhanced debugging for appointments
  useEffect(() => {
    console.log(`[MonthView] Rendering with ${appointments.length} appointments for clinician ${clinicianId}`);
    
    if (appointments && appointments.length > 0) {
      // Log the first few appointments for debugging
      const samplesToLog = Math.min(appointments.length, 3);
      for (let i = 0; i < samplesToLog; i++) {
        const app = appointments[i];
        console.log(`[MonthView] Sample appointment ${i+1}/${samplesToLog}:`, {
          id: app.id,
          date: app.date,
          startTime: app.start_time,
          endTime: app.end_time,
          clinicianId: app.clinician_id || 'Not specified'
        });
      }
    }
    
    // Check for any potential date format issues
    if (appointments && appointments.length > 0) {
      const differentFormats = new Set(
        appointments.map(app => 
          typeof app.date === 'string' && app.date.includes('T') ? 'ISO' : 'Simple'
        )
      );
      if (differentFormats.size > 1) {
        console.warn('[MonthView] WARNING: Mixed date formats detected in appointments array');
      }
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

  // Additional debug - check if appointments are being processed correctly
  useEffect(() => {
    const appointmentCount = Array.from(dayAppointmentsMap.values())
      .reduce((sum, dayApps) => sum + dayApps.length, 0);
    
    console.log(`[MonthView] Total appointments displayed in calendar: ${appointmentCount}`);
    
    // If there are appointments but none are being displayed, this is an issue
    if (appointments.length > 0 && appointmentCount === 0) {
      console.error('[MonthView] CRITICAL: Appointments exist but none are displayed in calendar');
      console.log('[MonthView] This could be due to date format mismatches. Check:');
      console.log('1. Format of appointments.date vs. the keys in dayAppointmentsMap');
      console.log('2. Timezone conversions affecting date comparisons');
      
      // Print sample of dayAppointmentsMap keys
      const mapKeys = Array.from(dayAppointmentsMap.keys()).slice(0, 5);
      console.log('[MonthView] Sample days in calendar:', mapKeys);
      
      // Print sample of appointment dates
      const appDates = appointments.slice(0, 5).map(a => a.date);
      console.log('[MonthView] Sample appointment dates:', appDates);
    }
  }, [dayAppointmentsMap, appointments]);

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
