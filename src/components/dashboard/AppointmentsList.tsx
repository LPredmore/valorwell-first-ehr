
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { AppointmentCard } from './AppointmentCard';
import { BaseAppointment } from '@/types/appointment';

interface AppointmentsListProps {
  title: string;
  icon: React.ReactNode;
  appointments: BaseAppointment[];
  isLoading: boolean;
  error: Error | null;
  emptyMessage: string;
  timeZoneDisplay: string;
  userTimeZone: string;
  showStartButton?: boolean;
  showViewAllButton?: boolean;
  onStartSession?: (appointment: BaseAppointment) => void;
  onDocumentSession?: (appointment: BaseAppointment) => void;
  onSessionDidNotOccur?: (appointment: BaseAppointment) => void;
}

export const AppointmentsList: React.FC<AppointmentsListProps> = ({
  title,
  icon,
  appointments,
  isLoading,
  error,
  emptyMessage,
  timeZoneDisplay,
  userTimeZone,
  showStartButton = false,
  showViewAllButton = false,
  onStartSession,
  onDocumentSession,
  onSessionDidNotOccur
}) => {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        {icon}
        {title}
      </h2>

      {isLoading ? (
        Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[180px] w-full mb-3" />
        ))
      ) : error ? (
        <div className="text-red-500 flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          Error loading appointments
        </div>
      ) : appointments.length === 0 ? (
        <p className="text-gray-500">{emptyMessage}</p>
      ) : (
        <>
          {appointments.slice(0, 5).map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              timeZoneDisplay={timeZoneDisplay}
              userTimeZone={userTimeZone}
              showStartButton={showStartButton}
              onStartSession={onStartSession}
              onDocumentSession={onDocumentSession}
              onSessionDidNotOccur={onSessionDidNotOccur}
            />
          ))}
          
          {showViewAllButton && appointments.length > 5 && (
            <Button variant="link" className="mt-2 p-0">
              View all {appointments.length} upcoming appointments
            </Button>
          )}
        </>
      )}
    </div>
  );
};
