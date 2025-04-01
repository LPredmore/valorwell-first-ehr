
import React from 'react';
import { format, parseISO } from 'date-fns';
import { Calendar, Clock, UserCircle, Video, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { formatTime12Hour, formatTimeZoneDisplay } from '@/utils/timeZoneUtils';

export interface AppointmentCardProps {
  appointment: {
    id: string;
    client_id: string;
    date: string;
    start_time: string;
    end_time: string;
    type: string;
    status: string;
    video_room_url: string | null;
    client?: {
      client_first_name: string;
      client_last_name: string;
    };
  };
  timeZoneDisplay: string;
  showStartButton?: boolean;
  onStartSession?: (appointment: AppointmentCardProps['appointment']) => void;
  onDocumentSession?: (appointment: AppointmentCardProps['appointment']) => void;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  timeZoneDisplay,
  showStartButton = false,
  onStartSession,
  onDocumentSession
}) => {
  const formatTime = (timeString: string) => {
    return formatTime12Hour(timeString);
  };

  if (onDocumentSession) {
    return (
      <Card key={appointment.id} className="mb-3">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center">
            <UserCircle className="h-4 w-4 mr-2" />
            {appointment.client?.client_first_name} {appointment.client?.client_last_name}
          </CardTitle>
          <CardDescription className="flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            {format(parseISO(appointment.date), 'EEEE, MMMM do, yyyy')}
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2" />
            <span className="text-sm">
              {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
            </span>
          </div>
          <div className="text-sm mt-1">{appointment.type}</div>
        </CardContent>
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
      </Card>
    );
  }

  return (
    <Card key={appointment.id} className="mb-3">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center">
          <Clock className="h-4 w-4 mr-2" />
          {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)} 
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
