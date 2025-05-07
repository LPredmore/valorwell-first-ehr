import React, { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useMonthViewData, DayAvailabilityData } from '@/hooks/useMonthViewData';
import CalendarGrid from './CalendarGrid';
import { Appointment } from '@/types/appointment';
import { AvailabilityBlock } from '@/types/availability';
import { DateTime } from 'luxon';

interface MonthViewProps {
  currentDate: Date;
  clinicianId: string | null;
  refreshTrigger?: number;
  appointments?: Appointment[];
  getClientName?: (clientId: string) => string;
  onAppointmentClick?: (appointment: Appointment) => void;
  onAvailabilityClick?: (date: DateTime, availabilityBlock: AvailabilityBlock) => void;
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
    console.log(`[MonthView] Rendering with ${appointments.length} appointments for clinician ${clinicianId}`, {
      timeZone: userTimeZone,
      currentDate: currentDate.toISOString()
    });
    
    if (appointments && appointments.length > 0) {
      // Log the first few appointments for debugging
      const samplesToLog = Math.min(appointments.length, 3);
      for (let i = 0; i < samplesToLog; i++) {
        const app = appointments[i];
        console.log(`[MonthView] Sample appointment ${i+1}/${samplesToLog}:`, {
          id: app.id,
          startAt: app.start_at,
          endAt: app.end_at,
          formattedDate: app.formattedDate,
          formattedStartTime: app.formattedStartTime,
          formattedEndTime: app.formattedEndTime,
          clientName: app.clientName,
          timeZone: userTimeZone
        });
      }
    }
  }, [appointments, clinicianId, userTimeZone, currentDate]);

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
    
    console.log(`[MonthView] Total appointments displayed in calendar: ${appointmentCount}`, {
      totalAppointments: appointments.length,
      mappedAppointments: appointmentCount,
      timeZone: userTimeZone
    });
    
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
      const appDates = appointments.slice(0, 5).map(a => ({
        formattedDate: a.formattedDate,
        startAt: a.start_at,
        localStartInTimeZone: a.start_at ? new Date(a.start_at).toLocaleString('en-US', {timeZone: userTimeZone}) : 'N/A'
      }));
      console.log('[MonthView] Sample appointment dates:', appDates);
      
      // Check for timezone-related edge cases
      console.log('[MonthView] Checking for appointments spanning midnight in UTC vs local time');
      const midnightEdgeCases = appointments.filter(a => {
        if (!a.start_at || !a.end_at) return false;
        const startDate = new Date(a.start_at);
        const endDate = new Date(a.end_at);
        const startDay = new Date(startDate).setHours(0,0,0,0);
        const endDay = new Date(endDate).setHours(0,0,0,0);
        return startDay !== endDay;
      });
      console.log(`[MonthView] Found ${midnightEdgeCases.length} appointments spanning midnight`);
    }
  }, [dayAppointmentsMap, appointments, userTimeZone]);

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
        userTimeZone={userTimeZone}
      />
    </Card>
  );
};

export default MonthView;
