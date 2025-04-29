
import React from 'react';
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Clock, Video, MapPin, CheckCircle, AlertTriangle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { BaseAppointment } from '@/types/appointment';

interface InfoCardAction {
  label: string;
  icon: React.ComponentType<any>;
  onClick: () => void;
  variant: "default" | "destructive" | "outline" | "secondary";
  destructive: boolean;
}

interface AppointmentCardProps {
  appointment: BaseAppointment;
  onStartSession?: (appointment: BaseAppointment) => void;
  onDocumentSession?: (appointment: BaseAppointment) => void;
  onSessionDidNotOccur?: (appointment: BaseAppointment) => void;
  timeZoneDisplay: string;
  userTimeZone: string;
  showStartButton?: boolean;
  showViewAllButton?: boolean;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onStartSession,
  onDocumentSession,
  onSessionDidNotOccur,
  timeZoneDisplay,
  userTimeZone,
  showStartButton = false,
  showViewAllButton = false
}) => {
  const appointmentDate = appointment.date ? new Date(appointment.date) : new Date();
  const formattedDate = format(appointmentDate, 'EEEE, MMMM d, yyyy');

  const formatTime = (timeString: string) => {
    try {
      const [hours, minutes] = timeString.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return format(date, 'h:mm a');
    } catch (error) {
      console.error('Error formatting time:', error);
      return timeString;
    }
  };

  const actions: InfoCardAction[] = [
    {
      label: 'Start Session',
      icon: Video,
      onClick: () => onStartSession && onStartSession(appointment),
      variant: 'default', 
      destructive: false
    },
    {
      label: 'Document Session',
      icon: CheckCircle,
      onClick: () => onDocumentSession && onDocumentSession(appointment),
      variant: 'outline',
      destructive: false
    },
    {
      label: 'Session Did Not Occur',
      icon: AlertTriangle,
      onClick: () => onSessionDidNotOccur && onSessionDidNotOccur(appointment),
      variant: 'destructive',
      destructive: true
    }
  ];

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-4">
          <Avatar>
            <AvatarImage src={`https://avatar.vercel.sh/${appointment.clientName}.png`} />
            <AvatarFallback>{appointment.clientName.substring(0, 2)}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">
              {appointment.clientId ? (
                <Link 
                  to={`/clients/${appointment.clientId}`}
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log(`Navigating to client profile with ID: ${appointment.clientId}`);
                  }}
                >
                  {appointment.clientName}
                </Link>
              ) : (
                <span>{appointment.clientName}</span>
              )}
            </h4>
            <p className="text-xs text-gray-500">
              {formattedDate}
            </p>
          </div>
        </div>
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          {appointment.status || 'Scheduled'}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-gray-600">
          <div className="flex items-center mb-1">
            <Clock className="h-4 w-4 mr-2" />
            {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)} ({timeZoneDisplay})
          </div>
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-2" />
            {appointment.location}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <div>
          {showStartButton && onStartSession && (
            <Button size="sm" onClick={() => onStartSession(appointment)}>
              <Video className="h-4 w-4 mr-2" />
              Start Session
            </Button>
          )}
          {showViewAllButton && (
            <Button size="sm" variant="secondary">
              View All
            </Button>
          )}
        </div>
        {onDocumentSession && onSessionDidNotOccur && (
          <div className="flex space-x-2">
            {actions.map((action, index) => (
              <Button
                key={index}
                size="sm"
                variant={action.variant}
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default AppointmentCard;
