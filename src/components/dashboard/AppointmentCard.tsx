
import React from 'react';
import { Calendar, Clock, UserCircle, Video, FileText, XCircle } from 'lucide-react';
import { formatTime, formatDate } from '@/utils/dateFormatUtils';
import { BaseAppointment } from '@/types/appointment';
import { InfoCard, InfoCardItem } from '@/components/ui/patterns';

export interface AppointmentCardProps {
  appointment: BaseAppointment;
  timeZoneDisplay: string;
  userTimeZone: string;
  showStartButton?: boolean;
  onStartSession?: (appointment: BaseAppointment) => void;
  onDocumentSession?: (appointment: BaseAppointment) => void;
  onSessionDidNotOccur?: (appointment: BaseAppointment) => void;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  timeZoneDisplay,
  userTimeZone,
  showStartButton = false,
  onStartSession,
  onDocumentSession,
  onSessionDidNotOccur
}) => {
  // Format time for display in user's time zone
  const formatTimeDisplay = (timeString: string) => {
    try {
      // Use our standardized formatTime utility
      return formatTime(timeString);
    } catch (error) {
      console.error('Error formatting time:', error);
      return timeString;
    }
  };

  // Format client name
  const clientName = appointment.client 
    ? `${appointment.client.client_first_name} ${appointment.client.client_last_name}`
    : 'Unknown Client';

  // Format appointment time
  const appointmentTime = `${formatTimeDisplay(appointment.start_time)} - ${formatTimeDisplay(appointment.end_time)}`;
  
  // Format appointment date
  const appointmentDate = formatDate(appointment.date, 'EEEE, MMMM d, yyyy');

  if (onDocumentSession) {
    // Documentation view of appointment card
    return (
      <InfoCard
        key={appointment.id}
        title={clientName}
        icon={UserCircle}
        className="mb-3"
        actions={[
          {
            label: 'Document Session',
            icon: FileText,
            onClick: () => onDocumentSession(appointment),
            variant: "default"
          },
          ...(onSessionDidNotOccur ? [
            {
              label: 'Session Did Not Occur',
              icon: XCircle,
              onClick: () => onSessionDidNotOccur(appointment),
              variant: "outline",
              destructive: true
            }
          ] : [])
        ]}
      >
        <div className="space-y-2">
          <InfoCardItem
            label="Date"
            value={appointmentDate}
            icon={Calendar}
          />
          <InfoCardItem
            label="Time"
            value={appointmentTime}
            icon={Clock}
          />
          {appointment.type && (
            <InfoCardItem
              label="Type"
              value={appointment.type}
            />
          )}
        </div>
      </InfoCard>
    );
  }

  // Standard view of appointment card
  return (
    <InfoCard
      key={appointment.id}
      title={`${appointmentTime} ${timeZoneDisplay ? `(${timeZoneDisplay})` : ''}`}
      icon={Clock}
      className="mb-3"
      actions={showStartButton && onStartSession ? [
        {
          label: 'Start Session',
          icon: Video,
          onClick: () => onStartSession(appointment),
          variant: "default"
        }
      ] : []}
    >
      <div className="space-y-2">
        <InfoCardItem
          label="Date"
          value={appointmentDate}
          icon={Calendar}
        />
        <InfoCardItem
          label="Client"
          value={clientName}
          icon={UserCircle}
        />
        {appointment.type && (
          <InfoCardItem
            label="Type"
            value={appointment.type}
          />
        )}
      </div>
    </InfoCard>
  );
};
