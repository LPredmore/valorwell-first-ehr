
import React, { useState, useEffect } from 'react';
import WeekView from './week-view/WeekView';
import MonthView from './MonthView';
import { useAppointments, Appointment } from '@/hooks/useAppointments';
import ClinicianAvailabilityPanel from './ClinicianAvailabilityPanel';
import AvailabilityPanel from './AvailabilityPanel';
import { TimeZoneService } from '@/utils/timeZoneService';
import { Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface CalendarProps {
  view: 'week' | 'month';
  showAvailability: boolean;
  clinicianId: string | null;
  currentDate: Date;
  userTimeZone: string;
  refreshTrigger: number;
  appointments?: Appointment[];
  isLoading?: boolean;
  error?: any;
}

const Calendar = ({ 
  view, 
  showAvailability, 
  clinicianId, 
  currentDate, 
  userTimeZone,
  refreshTrigger = 0,
  appointments = [],
  isLoading = false,
  error = null
}: CalendarProps) => {
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  
  // Ensure we have a valid IANA timezone
  const validTimeZone = TimeZoneService.ensureIANATimeZone(userTimeZone);
  
  // If clinicianId is empty, display a message
  if (!clinicianId) {
    console.error('No clinician ID provided to Calendar component');
  }
  
  // Log appointments for debugging
  useEffect(() => {
    console.log(`Calendar: Rendering with ${appointments.length} appointments for clinician ${clinicianId}`, appointments);
    if (error) {
      console.error('Error fetching appointments:', error);
    }
  }, [appointments, clinicianId, error]);

  // Function to get client name from an appointment
  const getClientName = (clientId: string): string => {
    const appointment = appointments.find(app => app.client_id === clientId);
    return appointment?.client?.client_preferred_name && appointment?.client?.client_last_name
      ? `${appointment.client.client_preferred_name} ${appointment.client.client_last_name}`
      : 'Client';
  };

  // Handler for appointment clicked in calendar
  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointmentId(appointment.id);
    console.log(`Appointment clicked: ${appointment.id}`);
  };

  // Handler for availability block clicked in calendar
  const handleAvailabilityClick = (date: Date, availabilityBlock: any) => {
    console.log(`Availability clicked for ${date} - Block:`, availabilityBlock);
    // Here you could open a modal to edit the availability
  };

  // Handler for when availability is updated
  const handleAvailabilityUpdated = () => {
    console.log('Availability updated, refreshing calendar...');
  };

  // Show loading indicator if appointments are being fetched
  if (isLoading) {
    return (
      <Card className="p-4 flex justify-center items-center h-[300px]">
        <Loader2 className="h-6 w-6 animate-spin text-valorwell-500" />
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="md:col-span-3">
        {view === 'week' ? (
          <WeekView 
            currentDate={currentDate}
            clinicianId={clinicianId}
            refreshTrigger={refreshTrigger}
            appointments={appointments}
            getClientName={getClientName}
            onAppointmentClick={handleAppointmentClick}
            onAvailabilityClick={handleAvailabilityClick}
            userTimeZone={validTimeZone}
          />
        ) : (
          <MonthView 
            currentDate={currentDate}
            clinicianId={clinicianId}
            refreshTrigger={refreshTrigger}
            appointments={appointments}
            getClientName={getClientName}
            onAppointmentClick={handleAppointmentClick}
            onAvailabilityClick={handleAvailabilityClick}
            userTimeZone={validTimeZone}
          />
        )}
      </div>
      
      {showAvailability && (
        <div className="md:col-span-1">
          <ClinicianAvailabilityPanel 
            clinicianId={clinicianId} 
            onAvailabilityUpdated={handleAvailabilityUpdated}
            userTimeZone={validTimeZone}
          />
        </div>
      )}
    </div>
  );
};

export default Calendar;
