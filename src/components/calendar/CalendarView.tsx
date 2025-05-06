
import React, { useEffect } from 'react';
import { useAppointments } from '@/hooks/useAppointments';
import Calendar from './Calendar';
import { TimeZoneService } from '@/utils/timeZoneService';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface CalendarViewProps {
  view: 'week' | 'month';
  showAvailability: boolean;
  clinicianId: string | null;
  currentDate?: Date;
  userTimeZone: string;
  refreshTrigger?: number;
}

const CalendarView: React.FC<CalendarViewProps> = ({
  view,
  showAvailability,
  clinicianId,
  currentDate = new Date(),
  userTimeZone,
  refreshTrigger = 0
}) => {
  // Ensure we have a valid timezone
  const validTimeZone = TimeZoneService.ensureIANATimeZone(userTimeZone);
  
  // Format the clinicianId correctly for Supabase queries
  const formattedClinicianId = clinicianId?.trim() || null;
  
  console.log(`[CalendarView] Initializing with clinicianId: ${formattedClinicianId}, timezone: ${validTimeZone}`);
  
  // Use the appointments hook to fetch appointments for the formatted clinicianId
  const { 
    appointments, 
    isLoading: loadingAppointments, 
    error,
    refetch
  } = useAppointments(formattedClinicianId);
  
  // Trigger a refresh when the refresh trigger changes
  useEffect(() => {
    if (refreshTrigger > 0) {
      console.log(`[CalendarView] Refresh triggered (${refreshTrigger}), refetching appointments`);
      refetch();
    }
  }, [refreshTrigger, refetch]);

  // Log appointments for debugging
  useEffect(() => {
    if (error) {
      console.error(`[CalendarView] Error fetching appointments:`, error);
    } else if (appointments) {
      console.log(`[CalendarView] Received ${appointments.length} appointments for clinician ${formattedClinicianId}`);
      
      // Log all appointments for debugging
      appointments.forEach((appointment, index) => {
        console.log(`[CalendarView] Appointment #${index + 1}:`, {
          id: appointment.id,
          date: appointment.date,
          dateType: typeof appointment.date,
          start_time: appointment.start_time,
          end_time: appointment.end_time,
          client_id: appointment.client_id,
          clinician_id: appointment.clinician_id
        });
      });
    }
  }, [appointments, formattedClinicianId, error]);

  // Show loading state
  if (loadingAppointments) {
    return (
      <Card className="p-4 flex justify-center items-center h-[300px]">
        <Loader2 className="h-6 w-6 animate-spin text-valorwell-500 mr-2" />
        <span>Loading appointments...</span>
      </Card>
    );
  }

  // Show error state
  if (error) {
    return (
      <Card className="p-4 text-center">
        <p className="text-red-500 mb-2">Error loading appointments</p>
        <p className="text-sm text-gray-500">{error.message || 'Unknown error'}</p>
      </Card>
    );
  }

  // If no clinician is selected, show a message
  if (!formattedClinicianId) {
    return (
      <Card className="p-4 text-center">
        <p className="text-gray-500">Please select a clinician to view their appointments</p>
      </Card>
    );
  }
  
  // If no appointments were found, log this but still render the calendar
  if (appointments.length === 0) {
    console.log(`[CalendarView] No appointments found for clinician: ${formattedClinicianId}`);
  }

  return (
    <Calendar 
      view={view}
      showAvailability={showAvailability}
      clinicianId={formattedClinicianId}
      currentDate={currentDate}
      userTimeZone={validTimeZone}
      refreshTrigger={refreshTrigger}
      appointments={appointments}
      isLoading={false} // We're handling loading state above
      error={null} // We're handling error state above
    />
  );
};

export default CalendarView;
