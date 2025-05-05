
import React, { useState, useEffect } from 'react';
import WeekView from './week-view/WeekView';
import MonthView from './month-view/MonthView';
import { useAppointments } from './useAppointments';
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
    loading: loadingAppointments, 
    error, 
    getClientName,
    refetch 
  } = useAppointments(clinicianId, refreshTrigger);

  // Handler for appointment clicked in calendar
  const handleAppointmentClick = (appointmentId: string) => {
    setSelectedAppointmentId(appointmentId);
    console.log(`Appointment clicked: ${appointmentId}`);
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
