import React, { useState, useEffect } from 'react';
import MonthView from './MonthView';
import { WeekView } from './week-view';
import { format, isEqual } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import EditAppointmentDialog from './EditAppointmentDialog';
import AvailabilityEditDialog from './AvailabilityEditDialog';
import AvailabilityDialogWrapper from './availability-edit/AvailabilityDialogWrapper';

interface CalendarViewProps {
  view: 'month' | 'week';
  currentDate: Date;
  showAvailability?: boolean;
  clinicianId?: string | null;
  userTimeZone?: string;
  refreshTrigger?: number;
  monthViewMode?: 'month' | 'week';
}

const CalendarView: React.FC<CalendarViewProps> = ({
  view = 'month',
  currentDate,
  showAvailability = false,
  clinicianId,
  userTimeZone,
  refreshTrigger = 0,
  monthViewMode = 'month'
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedAvailability, setSelectedAvailability] = useState<any | null>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [availability, setAvailability] = useState<any[]>([]);
  const [timeOffBlocks, setTimeOffBlocks] = useState<any[]>([]);
  const [exceptions, setExceptions] = useState<any[]>([]);
  const [isAvailabilityDialogOpen, setIsAvailabilityDialogOpen] = useState(false);
  const [isAppointmentDialogOpen, setIsAppointmentDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  // Log availability dialog state for debugging
  useEffect(() => {
    if (isAvailabilityDialogOpen) {
      console.log('Availability dialog opened with:', {
        selectedDate,
        selectedAvailability,
        clinicianId
      });
    }
  }, [isAvailabilityDialogOpen, selectedDate, selectedAvailability, clinicianId]);

  const fetchData = async () => {
    if (!clinicianId) {
      console.warn('No clinician ID provided. Skipping data fetch.');
      return;
    }

    const formattedDate = format(currentDate, 'yyyy-MM-dd');

    try {
      // Fetch appointments
      const { data: appointmentData, error: appointmentError } = await supabase
        .from('appointments')
        .select('*')
        .eq('clinician_id', clinicianId)
        .gte('date', formattedDate);

      if (appointmentError) {
        console.error('Error fetching appointments:', appointmentError);
      } else {
        setAppointments(appointmentData || []);
      }

      // Fetch availability
      const { data: availabilityData, error: availabilityError } = await supabase
        .from('availability')
        .select('*')
        .eq('clinician_id', clinicianId);

      if (availabilityError) {
        console.error('Error fetching availability:', availabilityError);
      } else {
        setAvailability(availabilityData || []);
      }

      // Fetch time off blocks
      const { data: timeOffData, error: timeOffError } = await supabase
        .from('time_off_blocks')
        .select('*')
        .eq('clinician_id', clinicianId);

      if (timeOffError) {
        console.error('Error fetching time off blocks:', timeOffError);
      } else {
        setTimeOffBlocks(timeOffData || []);
      }

      // Fetch exceptions
      const { data: exceptionData, error: exceptionError } = await supabase
        .from('availability_exceptions')
        .select('*')
        .eq('clinician_id', clinicianId);

      if (exceptionError) {
        console.error('Error fetching exceptions:', exceptionError);
      } else {
        setExceptions(exceptionData || []);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [clinicianId, currentDate, refreshTrigger]);

  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter(appointment => isEqual(new Date(appointment.date), date));
  };

  const getAvailabilityForDate = (date: Date) => {
    const dayOfWeek = format(date, 'EEEE');
    return availability.filter(item => item.day_of_week === dayOfWeek);
  };

  const getTimeOffBlocksForDate = (date: Date) => {
    return timeOffBlocks.filter(block => {
      const blockStartDate = new Date(block.start_date);
      const blockEndDate = new Date(block.end_date);
      return date >= blockStartDate && date <= blockEndDate;
    });
  };

  const getExceptionsForDate = (date: Date) => {
    const formattedDate = format(date, 'yyyy-MM-dd');
    return exceptions.filter(exception => exception.specific_date === formattedDate);
  };

  const handleAvailabilityClick = (availabilityData: any, date: Date) => {
    console.log('Availability clicked:', availabilityData);
    console.log('For date:', date);
    setSelectedDate(date);
    setSelectedAvailability(availabilityData);
    setIsAvailabilityDialogOpen(true);
  };

  const handleAvailabilityUpdated = () => {
    console.log('Availability updated, refreshing data...');
    fetchData();
  };

  const handleAppointmentClick = (appointment: any) => {
    console.log('Appointment clicked:', appointment);
    setSelectedAppointment(appointment);
    setIsDetailsDialogOpen(true);
  };

  const handleAppointmentUpdated = () => {
    console.log('Appointment updated, refreshing data...');
    fetchData();
  };

  const handleCloseAppointmentDialog = () => {
    setIsAppointmentDialogOpen(false);
    setSelectedAppointment(null);
  };

  const handleCloseDetailsDialog = () => {
    setIsDetailsDialogOpen(false);
    setSelectedAppointment(null);
  };

  return (
    <div className="w-full">
      {view === 'month' && (
        <MonthView
          currentDate={currentDate}
          appointments={getAppointmentsForDate(currentDate)}
          availability={getAvailabilityForDate(currentDate)}
          timeOffBlocks={getTimeOffBlocksForDate(currentDate)}
          exceptions={getExceptionsForDate(currentDate)}
          showAvailability={showAvailability}
          onAvailabilityClick={handleAvailabilityClick}
          onAppointmentClick={handleAppointmentClick}
          userTimeZone={userTimeZone}
          monthViewMode={monthViewMode}
        />
      )}
      
      {view === 'week' && (
        <WeekView
          currentDate={currentDate}
          appointments={getAppointmentsForDate(currentDate)}
          availability={getAvailabilityForDate(currentDate)}
          timeOffBlocks={getTimeOffBlocksForDate(currentDate)}
          exceptions={getExceptionsForDate(currentDate)}
          showAvailability={showAvailability}
          onAvailabilityClick={handleAvailabilityClick}
          onAppointmentClick={handleAppointmentClick}
          userTimeZone={userTimeZone}
        />
      )}

      {/* Use the wrapper component instead of directly using AvailabilityEditDialog */}
      <AvailabilityDialogWrapper
        isOpen={isAvailabilityDialogOpen}
        onClose={() => setIsAvailabilityDialogOpen(false)}
        availabilityBlock={selectedAvailability}
        specificDate={selectedDate || undefined}
        clinicianId={clinicianId}
        onAvailabilityUpdated={handleAvailabilityUpdated}
      />

      {selectedAppointment && (
        <EditAppointmentDialog
          isOpen={isAppointmentDialogOpen}
          onClose={() => setIsAppointmentDialogOpen(false)}
          appointment={selectedAppointment}
          onAppointmentUpdated={handleAppointmentUpdated}
        />
      )}

      {selectedAppointment && (
        <AppointmentDetailsDialog
          isOpen={isDetailsDialogOpen}
          onClose={() => setIsDetailsDialogOpen(false)}
          appointment={selectedAppointment}
          onEditClick={() => {
            setIsDetailsDialogOpen(false);
            setIsAppointmentDialogOpen(true);
          }}
        />
      )}
    </div>
  );
};

export default CalendarView;
