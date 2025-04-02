
import React from 'react';
import AppointmentDetailsDialog from './AppointmentDetailsDialog';
import AvailabilityEditDialog from './AvailabilityEditDialog';
import { Appointment, AvailabilityBlock } from './useCalendarState';

interface CalendarDialogsProps {
  isDetailsDialogOpen: boolean;
  isAvailabilityDialogOpen: boolean;
  selectedAppointment: (Appointment & { clientName?: string }) | null;
  selectedAvailability: AvailabilityBlock | null;
  selectedAvailabilityDate: Date | null;
  clinicianId: string | null;
  userTimeZone: string;
  clientTimeZone: string;
  onAppointmentUpdated: () => void;
  onAvailabilityUpdated: () => void;
  onCloseDetailsDialog: () => void;
  onCloseAvailabilityDialog: () => void;
}

const CalendarDialogs: React.FC<CalendarDialogsProps> = ({
  isDetailsDialogOpen,
  isAvailabilityDialogOpen,
  selectedAppointment,
  selectedAvailability,
  selectedAvailabilityDate,
  clinicianId,
  userTimeZone,
  clientTimeZone,
  onAppointmentUpdated,
  onAvailabilityUpdated,
  onCloseDetailsDialog,
  onCloseAvailabilityDialog
}) => {
  return (
    <>
      <AppointmentDetailsDialog 
        isOpen={isDetailsDialogOpen} 
        onClose={onCloseDetailsDialog} 
        appointment={selectedAppointment} 
        onAppointmentUpdated={onAppointmentUpdated} 
        userTimeZone={userTimeZone} 
        clientTimeZone={clientTimeZone} 
      />

      <AvailabilityEditDialog
        isOpen={isAvailabilityDialogOpen}
        onClose={onCloseAvailabilityDialog}
        availabilityBlock={selectedAvailability}
        specificDate={selectedAvailabilityDate}
        clinicianId={clinicianId}
        onAvailabilityUpdated={onAvailabilityUpdated}
      />
    </>
  );
};

export default CalendarDialogs;
