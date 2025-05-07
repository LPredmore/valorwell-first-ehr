
import React, { useEffect, useState } from 'react';
import WeekView from './week-view/WeekView';
import MonthView from './MonthView';
import ClinicianAvailabilityPanel from './ClinicianAvailabilityPanel';
import { TimeZoneService } from '@/utils/timeZoneService';
import { Appointment } from '@/types/appointment';
import { DateTime } from 'luxon';
import { AvailabilityBlock } from '@/types/availability';

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

const CalendarView = ({ 
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
  
  // Enhanced logging for appointments with comprehensive client name information
  useEffect(() => {
    console.log(`[CalendarView] Rendering with ${appointments.length} appointments for clinician ${clinicianId}`);
    console.log(`[CalendarView] Calendar view: ${view}, timezone: ${validTimeZone}`);
    
    if (appointments.length > 0) {
      // Sample appointments for inspection
      const sampleSize = Math.min(3, appointments.length);
      console.log(`[CalendarView] Sample of ${sampleSize} appointments:`);
      appointments.slice(0, sampleSize).forEach((app, idx) => {
        console.log(`[CalendarView] Sample appointment ${idx+1}:`, {
          id: app.id,
          startAt: app.start_at,
          endAt: app.end_at,
          clientId: app.client_id,
          clinicianId: app.clinician_id,
          clientName: app.clientName,
          clientInfo: app.client ? {
            preferredName: app.client.client_preferred_name,
            firstName: app.client.client_first_name,
            lastName: app.client.client_last_name
          } : 'No client data'
        });
      });
    }
    
    if (error) {
      console.error('[CalendarView] Error detected:', error);
    }
  }, [appointments, clinicianId, error, view, validTimeZone]);

  // Function to get client name from an appointment - standardized to match useAppointments
  const getClientName = (clientId: string): string => {
    const appointment = appointments.find(app => app.client_id === clientId);
    
    // Just return the clientName property which is already formatted correctly in useAppointments
    return appointment?.clientName || 'Unknown Client';
  };

  // Handler for appointment clicked in calendar
  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointmentId(appointment.id);
    console.log(`[CalendarView] Appointment clicked:`, {
      id: appointment.id,
      clientName: appointment.clientName,
      clientId: appointment.client_id,
      startAt: appointment.start_at
    });
  };

  // Handler for availability block clicked in calendar
  const handleAvailabilityClick = (date: DateTime | Date, availabilityBlock: AvailabilityBlock) => {
    // Convert Date to DateTime if needed for consistent handling
    const dateTime = date instanceof Date ? 
      TimeZoneService.fromJSDate(date, validTimeZone) : date;
      
    console.log(`[CalendarView] Availability clicked for ${dateTime.toFormat('yyyy-MM-dd')} - Block:`, availabilityBlock);
  };

  // Handler for when availability is updated
  const handleAvailabilityUpdated = () => {
    console.log('[CalendarView] Availability updated, refreshing calendar...');
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

export default CalendarView;
