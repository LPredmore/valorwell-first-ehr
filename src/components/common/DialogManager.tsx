import React from 'react';
import { useDialogs } from '@/context/DialogContext';
import { TimeZoneService } from '@/utils/timezone';

// Import all dialogs
import AddClinicianDialog from '@/components/admin/AddClinicianDialog';
import EditClinicianDialog from '@/components/admin/EditClinicianDialog';
import AppointmentDialog from '@/components/calendar/AppointmentDialog';
import TimeOffDialog from '@/components/calendar/TimeOffDialog';
import SingleAvailabilityDialog from '@/components/calendar/SingleAvailabilityDialog';
import WeeklyAvailabilityDialog from '@/components/calendar/WeeklyAvailabilityDialog';
import EventTypeSelector from '@/components/calendar/EventTypeSelector';
import EditAppointmentDialog from '@/components/calendar/EditAppointmentDialog';
import EditTimeOffDialog from '@/components/calendar/EditTimeOffDialog';
import ConfirmationDialog from '@/components/common/ConfirmationDialog';
import PhoneNumberDialog from '@/components/client/PhoneNumberDialog';
import AddClientDialog from '@/components/admin/AddClientDialog';

// Define the allowed dialog types
type DialogType = 
  'addClinician' | 
  'editClinician' | 
  'addClient' | 
  'appointment' | 
  'editAppointment' | 
  'timeOff' | 
  'editTimeOff' | 
  'singleAvailability' | 
  'weeklyAvailability' | 
  'eventTypeSelector' | 
  'confirmation' | 
  'phoneNumber';

/**
 * DialogManager Component
 * 
 * This component manages all dialogs in the application.
 * It uses the DialogContext to determine which dialog to show.
 */
const DialogManager: React.FC = () => {
  const { state, closeDialog } = useDialogs();
  
  if (!state.type) return null;
  
  // Get user's timezone
  const userTimeZone = TimeZoneService.getLocalTimeZone();
  
  // Render different dialog based on the current state.type
  switch (state.type as DialogType) {
    case 'addClinician':
      return (
        <AddClinicianDialog 
          isOpen={true} 
          onClose={closeDialog} 
          onClinicianAdded={state.props?.onClinicianAdded} 
        />
      );
      
    case 'editClinician':
      return (
        <EditClinicianDialog 
          isOpen={true} 
          onClose={closeDialog} 
          clinician={state.props?.clinician} 
          onClinicianUpdated={state.props?.onClinicianUpdated} 
        />
      );
      
    case 'addClient':
      return (
        <AddClientDialog 
          isOpen={true} 
          onClose={closeDialog} 
          onClientAdded={state.props?.onClientAdded} 
        />
      );
      
    case 'appointment':
      if (!state.props) return null;
      return (
        <AppointmentDialog 
          appointment={{
            clinicianId: state.props.clinicianId,
            startTime: state.props.startTime,
            endTime: state.props.endTime,
            allDay: state.props.allDay,
          }}
          onAppointmentCreated={state.props.onAppointmentCreated}
          isOpen={true}
          onClose={closeDialog}
        />
      );
      
    case 'editAppointment':
      return (
        <EditAppointmentDialog 
          appointment={state.props?.appointment}
          onAppointmentUpdated={state.props?.onAppointmentUpdated}
          isOpen={true}
          onClose={closeDialog}
        />
      );
      
    case 'timeOff':
      if (!state.props) return null;
      return (
        <TimeOffDialog 
          timeOff={{
            clinicianId: state.props.clinicianId,
            startTime: state.props.startTime,
            endTime: state.props.endTime,
            allDay: state.props.allDay,
          }}
          onTimeOffCreated={state.props.onTimeOffCreated}
          isOpen={true}
          onClose={closeDialog}
        />
      );
      
    case 'editTimeOff':
      return (
        <EditTimeOffDialog 
          isOpen={true} 
          onClose={closeDialog} 
          timeOff={state.props?.timeOff}
          onTimeOffUpdated={state.props?.onTimeOffUpdated}
        />
      );
      
    case 'singleAvailability':
      return (
        <SingleAvailabilityDialog 
          clinicianId={state.props?.clinicianId}
          date={state.props?.date instanceof Date 
            ? state.props?.date 
            : new Date(state.props?.date || new Date())}
          userTimeZone={userTimeZone}
          isOpen={true}
          onClose={closeDialog}
        />
      );
      
    case 'weeklyAvailability':
      return (
        <WeeklyAvailabilityDialog 
          clinicianId={state.props?.clinicianId}
          isOpen={true}
          onClose={closeDialog}
        />
      );
      
    case 'eventTypeSelector':
      return (
        <EventTypeSelector 
          isOpen={true}
          onClose={closeDialog}
          startTime={state.props?.startTime}
          endTime={state.props?.endTime}
          clinicianId={state.props?.clinicianId}
          allDay={state.props?.allDay}
          onEventCreated={state.props?.onEventCreated}
        />
      );
      
    case 'confirmation':
      return (
        <ConfirmationDialog 
          isOpen={true}
          onClose={closeDialog}
          title={state.props?.title}
          message={state.props?.message}
          confirmLabel={state.props?.confirmLabel}
          cancelLabel={state.props?.cancelLabel}
          onConfirm={state.props?.onConfirm}
          destructive={state.props?.destructive}
        />
      );
      
    case 'phoneNumber':
      return (
        <PhoneNumberDialog 
          isOpen={true}
          onClose={closeDialog}
          onPhoneNumberSaved={state.props?.onPhoneNumberSaved}
        />
      );
      
    default:
      return null;
  }
};

export default DialogManager;
