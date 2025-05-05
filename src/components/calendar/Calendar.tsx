
import React, { useState, useEffect } from 'react';
import WeekView from './week-view/WeekView';
import MonthView from './MonthView';
import { useAppointments, Appointment } from '@/hooks/useAppointments';
import ClinicianAvailabilityPanel from './ClinicianAvailabilityPanel';
import AvailabilityPanel from './AvailabilityPanel';

interface CalendarProps {
  view: 'week' | 'month';
  showAvailability: boolean;
  clinicianId: string | null;
  currentDate: Date;
  userTimeZone: string;
  refreshTrigger: number;
}

const Calendar = ({ 
  view, 
  showAvailability, 
  clinicianId, 
  currentDate, 
  userTimeZone,
  refreshTrigger = 0 
}: CalendarProps) => {
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  
  // Fetch appointments
  const { 
    appointments, 
    isLoading: loadingAppointments, 
    error, 
    refetch 
  } = useAppointments(clinicianId);

  // Function to get client name from an appointment
  const getClientName = (clientId: string): string => {
    const appointment = appointments.find(app => app.client_id === clientId);
    return appointment?.client?.client_first_name && appointment?.client?.client_last_name
      ? `${appointment.client.client_first_name} ${appointment.client.client_last_name}`
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
    refetch();
  };

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
          />
        ) : (
          <MonthView 
            currentDate={currentDate}
            clinicianId={clinicianId}
            refreshTrigger={refreshTrigger}
            appointments={appointments}
          />
        )}
      </div>
      
      {showAvailability && (
        <div className="md:col-span-1">
          <ClinicianAvailabilityPanel 
            clinicianId={clinicianId} 
            onAvailabilityUpdated={handleAvailabilityUpdated}
            userTimeZone={userTimeZone}
          />
        </div>
      )}
    </div>
  );
};

export default Calendar;
