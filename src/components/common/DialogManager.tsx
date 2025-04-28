
import React from 'react';
import { useDialogs, DialogType } from '@/context/DialogContext';

// Import all dialog components
import AppointmentDialog from '@/components/calendar/AppointmentDialog';
import AvailabilitySettingsDialog from '@/components/calendar/AvailabilitySettingsDialog';
import WeeklyAvailabilityDialog from '@/components/calendar/WeeklyAvailabilityDialog';
import SingleAvailabilityDialog from '@/components/calendar/SingleAvailabilityDialog';
import CalendarDiagnosticDialog from '@/components/calendar/CalendarDiagnosticDialog';
import AppointmentDetailsDialog from '@/components/calendar/AppointmentDetailsDialog';
import EditAppointmentDialog from '@/components/calendar/EditAppointmentDialog';
import BookAppointmentDialog from '@/components/calendar/BookAppointmentDialog';
import { SessionDidNotOccurDialog } from '@/components/dashboard/SessionDidNotOccurDialog';
import { DocumentationDialog } from '@/components/dashboard/DocumentationDialog';
import ViewAvailabilityDialog from '@/components/patient/ViewAvailabilityDialog';
import AppointmentBookingDialog from '@/components/patient/AppointmentBookingDialog';

/**
 * DialogManager component
 * 
 * This component is responsible for rendering the appropriate dialog based on the current
 * dialog state in the DialogContext. It centralizes all dialog rendering logic in one place,
 * making it easier to manage and update dialogs across the application.
 */
const DialogManager: React.FC = () => {
  const { state, closeDialog } = useDialogs();
  const { type, isOpen, props } = state;

  // If no dialog is open, don't render anything
  if (!isOpen || !type) {
    return null;
  }

  // Render the appropriate dialog based on the dialog type
  const renderDialog = () => {
    switch (type) {
      case 'appointment':
        return (
          <AppointmentDialog
            clients={props.clients || []}
            loadingClients={props.loadingClients || false}
            selectedClinicianId={props.selectedClinicianId || null}
            onAppointmentCreated={props.onAppointmentCreated || (() => {})}
          />
        );
      
      case 'availabilitySettings':
        return (
          <AvailabilitySettingsDialog
            clinicianId={props.clinicianId || ''}
            onSettingsSaved={props.onSettingsSaved || (() => {})}
            permissionLevel={props.permissionLevel || 'full'}
          />
        );
      
      case 'weeklyAvailability':
        return (
          <WeeklyAvailabilityDialog
            clinicianId={props.clinicianId || ''}
            onAvailabilityUpdated={props.onAvailabilityUpdated || (() => {})}
            permissionLevel={props.permissionLevel || 'full'}
          />
        );
      
      case 'singleAvailability':
        return (
          <SingleAvailabilityDialog
            clinicianId={props.clinicianId || ''}
            onAvailabilityCreated={props.onAvailabilityCreated || (() => {})}
            permissionLevel={props.permissionLevel || 'full'}
            userTimeZone={props.userTimeZone || 'America/Chicago'}
          />
        );
      
      case 'diagnostic':
        return (
          <CalendarDiagnosticDialog
            selectedClinicianId={props.selectedClinicianId || null}
          />
        );
      
      case 'appointmentDetails':
        return (
          <AppointmentDetailsDialog
            isOpen={true}
            onClose={closeDialog}
            appointment={props.appointment || null}
            onAppointmentUpdated={props.onAppointmentUpdated || (() => {})}
            userTimeZone={props.userTimeZone || 'America/Chicago'}
            clientTimeZone={props.clientTimeZone || 'America/Chicago'}
          />
        );
      
      case 'editAppointment':
        return (
          <EditAppointmentDialog
            isOpen={true}
            onClose={closeDialog}
            appointment={props.appointment || null}
            onAppointmentUpdated={props.onAppointmentUpdated || (() => {})}
          />
        );
      
      case 'bookAppointment':
        return (
          <BookAppointmentDialog
            isOpen={true}
            onClose={closeDialog}
            clinicianId={props.clinicianId || ''}
            clientId={props.clientId || ''}
            onAppointmentBooked={props.onAppointmentBooked || (() => {})}
          />
        );
      
      case 'sessionDidNotOccur':
        return (
          <SessionDidNotOccurDialog
            isOpen={true}
            onClose={closeDialog}
            appointmentId={props.appointmentId || ''}
            onStatusUpdate={props.onStatusUpdate || (() => {})}
          />
        );
      
      case 'documentation':
        return (
          <DocumentationDialog
            isOpen={true}
            onOpenChange={(open) => !open && closeDialog()}
            selectedStatus={props.selectedStatus}
            onStatusChange={props.onStatusChange || (() => {})}
            onProvideDocumentation={props.onProvideDocumentation || (async () => {})}
          />
        );
      
      case 'viewAvailability':
        return (
          <ViewAvailabilityDialog
            open={true}
            onOpenChange={(open) => !open && closeDialog()}
            clinicianId={props.clinicianId || ''}
            clinicianName={props.clinicianName || ''}
            timeZone={props.timeZone}
          />
        );
      
      case 'appointmentBooking':
        return (
          <AppointmentBookingDialog
            open={true}
            onOpenChange={(open) => !open && closeDialog()}
            clinicianId={props.clinicianId || ''}
            clinicianName={props.clinicianName || ''}
            clientId={props.clientId || ''}
            onAppointmentBooked={props.onAppointmentBooked || (() => {})}
          />
        );
      
      default:
        return null;
    }
  };

  return renderDialog();
};

export default DialogManager;
