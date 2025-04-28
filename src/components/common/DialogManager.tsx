
import React from 'react';
import { useDialogs } from '@/context/DialogContext';
import NewAppointmentDialog from '@/components/calendar/appointment/NewAppointmentDialog';
import AppointmentDetailsDialog from '@/components/calendar/appointment/AppointmentDetailsDialog';
import AvailabilitySettingsDialog from '@/components/calendar/availability/AvailabilitySettingsDialog';
import WeeklyAvailabilityDialog from '@/components/calendar/availability/WeeklyAvailabilityDialog';
import SingleAvailabilityDialog from '@/components/calendar/availability/SingleAvailabilityDialog';
import BookAppointmentDialog from '@/components/calendar/appointment/BookAppointmentDialog';
import ViewAvailabilityDialog from '@/components/calendar/availability/ViewAvailabilityDialog';
import AppointmentBookingDialog from '@/components/calendar/appointment/AppointmentBookingDialog';
import DiagnosticDialog from '@/components/calendar/DiagnosticDialog';

/**
 * DialogManager is responsible for rendering all dialogs in the application
 * It uses the DialogContext to determine which dialog to show
 */
const DialogManager: React.FC = () => {
  const { 
    activeDialog,
    dialogProps,
    closeDialog 
  } = useDialogs();
  
  // Early return if no active dialog
  if (!activeDialog) {
    return null;
  }

  const handleCloseDialog = () => {
    closeDialog();
  };
  
  // Common props that all dialogs should have
  const commonProps = {
    open: true,
    onOpenChange: (open: boolean) => {
      if (!open) handleCloseDialog();
    }
  };

  // Render the appropriate dialog based on activeDialog
  switch (activeDialog) {
    case 'availabilitySettings':
      if (!dialogProps?.clinicianId) return null;
      
      return (
        <AvailabilitySettingsDialog
          open={true}
          onOpenChange={(open) => {
            if (!open) handleCloseDialog();
            if (!open && dialogProps?.onSettingsSaved) dialogProps.onSettingsSaved();
          }}
          clinicianId={dialogProps.clinicianId}
          permissionLevel={dialogProps.permissionLevel || 'none'}
        />
      );
      
    case 'weeklyAvailability':
      if (!dialogProps?.clinicianId) return null;
      
      return (
        <WeeklyAvailabilityDialog
          open={true}
          onOpenChange={(open) => {
            if (!open) handleCloseDialog();
            if (!open && dialogProps?.onAvailabilityUpdated) dialogProps.onAvailabilityUpdated();
          }}
          clinicianId={dialogProps.clinicianId}
          permissionLevel={dialogProps.permissionLevel || 'none'}
          selectedDate={dialogProps.selectedDate}
        />
      );
      
    case 'singleAvailability':
      if (!dialogProps?.clinicianId) return null;
      
      return (
        <SingleAvailabilityDialog
          open={true}
          onOpenChange={(open) => {
            if (!open) handleCloseDialog();
            if (!open && dialogProps?.onAvailabilityCreated) dialogProps.onAvailabilityCreated();
          }}
          clinicianId={dialogProps.clinicianId}
          userTimeZone={dialogProps.userTimeZone || 'UTC'}
          permissionLevel={dialogProps.permissionLevel || 'none'}
        />
      );
      
    case 'appointment':
      if (!dialogProps?.clinicianId) return null;
      
      return (
        <NewAppointmentDialog
          isOpen={true}
          onClose={() => {
            handleCloseDialog();
            if (dialogProps?.onAppointmentCreated) dialogProps.onAppointmentCreated();
          }}
          clients={dialogProps.clients || []}
          loadingClients={dialogProps.loadingClients || false}
          clinicianId={dialogProps.clinicianId}
          initialDate={dialogProps.initialDate}
          preselectedClient={dialogProps.preselectedClient}
        />
      );
      
    case 'appointmentDetails':
      if (!dialogProps?.appointment) return null;
      
      return (
        <AppointmentDetailsDialog
          isOpen={true}
          onClose={() => {
            handleCloseDialog();
            if (dialogProps?.onAppointmentUpdated) dialogProps.onAppointmentUpdated();
          }}
          appointment={dialogProps.appointment}
          onAppointmentUpdated={dialogProps.onAppointmentUpdated}
          onDeleteAppointment={dialogProps.onDelete} // Renamed for compatibility
        />
      );
      
    case 'bookAppointment':
      if (!dialogProps?.clinicianId) return null;
      
      return (
        <BookAppointmentDialog
          isOpen={true}
          onClose={() => {
            handleCloseDialog();
            if (dialogProps?.onAppointmentBooked) dialogProps.onAppointmentBooked();
          }}
          availabilitySlot={dialogProps.slot} // Renamed for compatibility
          clinicianId={dialogProps.clinicianId}
          onAppointmentBooked={dialogProps.onAppointmentBooked}
        />
      );
      
    case 'viewAvailability':
      if (!dialogProps?.clinicianId) return null;
      
      return (
        <ViewAvailabilityDialog
          {...commonProps}
          clinicianId={dialogProps.clinicianId}
          clinicianName={dialogProps.clinicianName || 'Clinician'}
          onSlotSelected={dialogProps.onBookSlot} // Renamed for compatibility
        />
      );
      
    case 'appointmentBooking':
      if (!dialogProps?.clinicianId || !dialogProps?.clientId) return null;
      
      return (
        <AppointmentBookingDialog
          {...commonProps}
          clinicianId={dialogProps.clinicianId}
          clinicianName={dialogProps.clinicianName || 'Clinician'}
          clientId={dialogProps.clientId}
          onSuccess={dialogProps.onAppointmentBooked}
          userTimeZone={dialogProps.preferredTimeZone || 'UTC'} // Renamed for compatibility
        />
      );
      
    case 'diagnostic':
      return (
        <DiagnosticDialog
          {...commonProps}
          clinicianId={dialogProps?.selectedClinicianId}
        />
      );
      
    default:
      return null;
  }
};

export default DialogManager;
