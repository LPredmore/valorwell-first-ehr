
import React from 'react';
import { useDialogs, DialogType } from '@/context/DialogContext';
import { PermissionLevel } from '@/services/PermissionService';

// Import all dialog components
import AppointmentDialog from '@/components/calendar/AppointmentDialog';
import AvailabilitySettingsDialog from '@/components/calendar/AvailabilitySettingsDialog';
import WeeklyAvailabilityDialog from '@/components/calendar/WeeklyAvailabilityDialog';
import SingleAvailabilityDialog from '@/components/calendar/SingleAvailabilityDialog';
import CalendarDiagnosticDialog from '@/components/calendar/CalendarDiagnosticDialog';
import AppointmentDetailsDialog from '@/components/calendar/AppointmentDetailsDialog';
import EditAppointmentDialog from '@/components/calendar/EditAppointmentDialog';
import BookAppointmentDialog from '@/components/calendar/BookAppointmentDialog';
import TimeOffDialog from '@/components/calendar/TimeOffDialog';
import EventTypeSelector from '@/components/calendar/EventTypeSelector';
import { SessionDidNotOccurDialog } from '@/components/dashboard/SessionDidNotOccurDialog';
import { DocumentationDialog } from '@/components/dashboard/DocumentationDialog';
import ViewAvailabilityDialog from '@/components/patient/ViewAvailabilityDialog';
import AppointmentBookingDialog from '@/components/patient/AppointmentBookingDialog';
import { TimeZoneService } from '@/utils/timezone';

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
  
  const userTimeZone = props.timeZone || TimeZoneService.getUserTimeZone();

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
            permissionLevel={mapPermissionLevel(props.permissionLevel) as any}
          />
        );
      
      case 'weeklyAvailability':
        return (
          <WeeklyAvailabilityDialog
            clinicianId={props.clinicianId || ''}
            onAvailabilityUpdated={props.onAvailabilityUpdated || (() => {})}
            permissionLevel={mapPermissionLevel(props.permissionLevel) as any}
          />
        );
      
      case 'singleAvailability':
        return (
          <SingleAvailabilityDialog
            clinicianId={props.clinicianId || ''}
            onAvailabilityCreated={props.onAvailabilityCreated || (() => {})}
            permissionLevel={mapPermissionLevel(props.permissionLevel) as any}
            userTimeZone={userTimeZone}
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
            userTimeZone={userTimeZone}
            clientTimeZone={props.clientTimeZone || userTimeZone}
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
            appointmentData={props.appointmentData || props.slot || {}}
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
            timeZone={props.timeZone}
          />
        );
      
      case 'timeOff':
        return (
          <TimeOffDialog
            isOpen={true}
            onClose={closeDialog}
            timeOffId={props.timeOffId}
            clinicianId={props.clinicianId || ''}
            startTime={props.startTime ? new Date(props.startTime) : undefined}
            endTime={props.endTime ? new Date(props.endTime) : undefined}
            userTimeZone={userTimeZone}
            onTimeOffCreated={props.onTimeOffCreated || (() => {})}
            onTimeOffUpdated={props.onTimeOffUpdated || (() => {})}
            onTimeOffDeleted={props.onTimeOffDeleted || (() => {})}
          />
        );
      
      case 'eventTypeSelector':
        return (
          <EventTypeSelector
            isOpen={true}
            onClose={closeDialog}
            startTime={props.startTime ? new Date(props.startTime) : new Date()}
            endTime={props.endTime ? new Date(props.endTime) : new Date()}
            clinicianId={props.clinicianId || ''}
            allDay={props.allDay || false}
            onEventCreated={props.onEventCreated || (() => {})}
          />
        );
      
      default:
        return null;
    }
  };

  return renderDialog();
};

/**
 * Maps the old permission level format to the new PermissionLevel type
 * @param oldPermissionLevel The old permission level ('full', 'limited', 'none')
 * @returns The new permission level ('admin', 'write', 'read', 'none')
 */
const mapPermissionLevel = (oldPermissionLevel?: string): PermissionLevel => {
  if (!oldPermissionLevel) return 'admin';
  
  switch (oldPermissionLevel) {
    case 'full':
      return 'admin';
    case 'limited':
      return 'write';
    case 'none':
      return 'none';
    default:
      // If it's already a valid PermissionLevel, return it
      if (['admin', 'write', 'read', 'none'].includes(oldPermissionLevel)) {
        return oldPermissionLevel as PermissionLevel;
      }
      return 'admin'; // Default to admin if unknown
  }
};

export default DialogManager;
