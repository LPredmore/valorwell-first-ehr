
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AppointmentCard from './AppointmentCard';
import { Appointment } from '@/hooks/useAppointments';

interface AppointmentsListProps {
  title: React.ReactNode;
  appointments: Appointment[];
  isLoading: boolean;
  error: unknown;
  emptyMessage: string;
  showStartButton?: boolean;
  onStartSession?: (appointment: Appointment) => void;
  onDocumentSession?: (appointment: Appointment) => void;
  showViewMore?: boolean;
  onViewMore?: () => void;
  viewMoreCount?: number;
  limit?: number;
}

const AppointmentsList: React.FC<AppointmentsListProps> = ({
  title,
  appointments,
  isLoading,
  error,
  emptyMessage,
  showStartButton = false,
  onStartSession,
  onDocumentSession,
  showViewMore = false,
  onViewMore,
  viewMoreCount = 0,
  limit = 5
}) => {
  const displayAppointments = limit ? appointments.slice(0, limit) : appointments;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        {title}
      </h2>
      
      {isLoading ? (
        Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="mb-3">
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48 mt-1" />
            </CardHeader>
            <CardContent className="pb-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-24 mt-2" />
            </CardContent>
            {(showStartButton || onDocumentSession) && (
              <CardFooter>
                <Skeleton className="h-9 w-full" />
              </CardFooter>
            )}
          </Card>
        ))
      ) : error ? (
        <div className="text-red-500 flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          Error loading appointments
        </div>
      ) : displayAppointments.length === 0 ? (
        <p className="text-gray-500">{emptyMessage}</p>
      ) : (
        <>
          {displayAppointments.map(appointment => (
            <AppointmentCard 
              key={appointment.id}
              appointment={appointment}
              showStartButton={showStartButton}
              onStartSession={onStartSession}
              onDocumentSession={onDocumentSession}
            />
          ))}
          
          {showViewMore && appointments.length > limit && (
            <Button variant="link" className="mt-2 p-0" onClick={onViewMore}>
              View all {viewMoreCount} upcoming appointments
            </Button>
          )}
        </>
      )}
    </div>
  );
};

export default AppointmentsList;
