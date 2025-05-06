
import React, { useState, useEffect } from 'react';
import WeekView from './week-view/WeekView';
import MonthView from './MonthView';
import ClinicianAvailabilityPanel from './ClinicianAvailabilityPanel';
import { TimeZoneService } from '@/utils/timeZoneService';
import { Appointment } from '@/types/appointment';

interface CalendarProps {
  view: 'week' | 'month';
  showAvailability: boolean;
  clinicianId: string | null;
  currentDate: Date;
  userTimeZone: string;
  refreshTrigger: number;
  appointments: Appointment[];
  isLoading: boolean;
  error: any;
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
  
  // Enhanced logging for appointments
  useEffect(() => {
    console.log(`[Calendar] Rendering with ${appointments.length} appointments for clinician ${clinicianId}`);
    console.log(`[Calendar] Calendar view: ${view}, timezone: ${validTimeZone}`);
    
    if (appointments.length > 0) {
      // Sample appointments for inspection
      const sampleSize = Math.min(3, appointments.length);
      console.log(`[Calendar] Sample of ${sampleSize} appointments:`);
      appointments.slice(0, sampleSize).forEach((app, idx) => {
        console.log(`[Calendar] Sample appointment ${idx+1}:`, {
          id: app.id,
          startAt: app.start_at,
          endAt: app.end_at,
          clientId: app.client_id,
          clinicianId: app.clinician_id
        });
      });
    }
    
    if (error) {
      console.error('[Calendar] Error detected:', error);
    }
  }, [appointments, clinicianId, error, view, validTimeZone]);

  // Function to get client name from an appointment
  const getClientName = (clientId: string): string => {
    const appointment = appointments.find(app => app.client_id === clientId);
    if (!appointment || !appointment.client) return 'Client';
    
    return appointment.client.client_preferred_name && appointment.client.client_last_name
      ? `${appointment.client.client_preferred_name} ${appointment.client.client_last_name}`
      : 'Client';
  };

  // Handler for appointment clicked in calendar
  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointmentId(appointment.id);
    console.log(`[Calendar] Appointment clicked: ${appointment.id}`);
  };

  // Handler for availability block clicked in calendar
  const handleAvailabilityClick = (date: Date, availabilityBlock: any) => {
    console.log(`[Calendar] Availability clicked for ${date} - Block:`, availabilityBlock);
  };

  // Handler for when availability is updated
  const handleAvailabilityUpdated = () => {
    console.log('[Calendar] Availability updated, refreshing calendar...');
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
