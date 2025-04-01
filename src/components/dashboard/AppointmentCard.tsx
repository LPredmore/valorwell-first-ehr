
import React from 'react';
import { format, parseISO } from 'date-fns';
import { Clock, Calendar, UserCircle, Video, FileText } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatTime12Hour, formatTimeZoneDisplay, getUserTimeZone } from '@/utils/timeZoneUtils';
import { Appointment } from '@/hooks/useAppointments';

interface AppointmentCardProps {
  appointment: Appointment;
  showStartButton?: boolean;
  onStartSession?: (appointment: Appointment) => void;
  onDocumentSession?: (appointment: Appointment) => void;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({ 
  appointment, 
  showStartButton = false,
  onStartSession,
  onDocumentSession
}) => {
  const clinicianTimeZone = getUserTimeZone();
  const timeZoneDisplay = formatTimeZoneDisplay(clinicianTimeZone);

  return (
    <Card className="mb-3">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center">
          <Clock className="h-4 w-4 mr-2" />
          {formatTime12Hour(appointment.start_time)} - {formatTime12Hour(appointment.end_time)} 
          <span className="text-xs text-gray-500 ml-1">({timeZoneDisplay})</span>
        </CardTitle>
        <CardDescription className="flex items-center">
          <Calendar className="h-4 w-4 mr-2" />
          {format(parseISO(appointment.date), 'EEEE, MMMM do, yyyy')}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex items-center">
          <UserCircle className="h-4 w-4 mr-2" />
          <span className="text-sm">
            {appointment.client?.client_first_name} {appointment.client?.client_last_name}
          </span>
        </div>
        <div className="text-sm mt-1">{appointment.type}</div>
      </CardContent>
      {showStartButton && (
        <CardFooter>
          <Button
            variant="default"
            size="sm"
            className="w-full"
            onClick={() => onStartSession && onStartSession(appointment)}
          >
            <Video className="h-4 w-4 mr-2" />
            Start Session
          </Button>
        </CardFooter>
      )}
      {onDocumentSession && (
        <CardFooter>
          <Button
            variant="default"
            size="sm"
            className="w-full"
            onClick={() => onDocumentSession(appointment)}
          >
            <FileText className="h-4 w-4 mr-2" />
            Document Session
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default AppointmentCard;
