
import React from 'react';
import { Calendar, Clock, UserCircle, Video, FileText, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { formatTime12Hour, formatTimeInUserTimeZone } from '@/utils/timeZoneUtils';
import { BaseAppointment } from '@/types/appointment';
import { DateTime } from 'luxon';

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
  const formatTimeDisplay = (timeIsoString: string) => {
    try {
      const dt = DateTime.fromISO(timeIsoString).setZone(userTimeZone);
      return dt.toFormat('h:mm a');
    } catch (error) {
      console.error('Error formatting time with time zone:', error);
      return 'Invalid time';
    }
  };
  
  const getFormattedDate = (isoDateString: string) => {
    try {
      const dt = DateTime.fromISO(isoDateString).setZone(userTimeZone);
      return dt.toFormat('EEEE, MMMM d, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  if (onDocumentSession) {
    return (
      <Card key={appointment.id} className="mb-3">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center">
            <UserCircle className="h-4 w-4 mr-2" />
            {appointment.clients?.client_first_name} {appointment.clients?.client_last_name}
          </CardTitle>
          <CardDescription className="flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            {getFormattedDate(appointment.start_at)}
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2" />
            <span className="text-sm">
              {formatTimeDisplay(appointment.start_at)} - {formatTimeDisplay(appointment.end_at)}
            </span>
          </div>
          <div className="text-sm mt-1">{appointment.type}</div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button
            variant="default"
            size="sm"
            className="w-full"
            onClick={() => onDocumentSession(appointment)}
          >
            <FileText className="h-4 w-4 mr-2" />
            Document Session
          </Button>
          
          {onSessionDidNotOccur && (
            <Button
              variant="outline"
              size="sm"
              className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
              onClick={() => onSessionDidNotOccur(appointment)}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Session Did Not Occur
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card key={appointment.id} className="mb-3">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center">
          <Clock className="h-4 w-4 mr-2" />
          {formatTimeDisplay(appointment.start_at)} - {formatTimeDisplay(appointment.end_at)} 
          <span className="text-xs text-gray-500 ml-1">({timeZoneDisplay})</span>
        </CardTitle>
        <CardDescription className="flex items-center">
          <Calendar className="h-4 w-4 mr-2" />
          {getFormattedDate(appointment.start_at)}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex items-center">
          <UserCircle className="h-4 w-4 mr-2" />
          <span className="text-sm">
            {appointment.clients?.client_first_name} {appointment.clients?.client_last_name}
          </span>
        </div>
        <div className="text-sm mt-1">{appointment.type}</div>
      </CardContent>
      {showStartButton && onStartSession && (
        <CardFooter>
          <Button
            variant="default"
            size="sm"
            className="w-full"
            onClick={() => onStartSession(appointment)}
          >
            <Video className="h-4 w-4 mr-2" />
            Start Session
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};
