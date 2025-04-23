
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, CalendarIcon } from 'lucide-react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { formatTimeZoneDisplay } from '@/utils/timeZoneUtils';

interface TodayAppointmentsProps {
  appointments: any[];
  timeZoneDisplay: string;
  showBookingButtons: boolean;
  hasAssignedDocuments: boolean;
  isLoadingVideoSession: boolean;
  onStartSession: (appointmentId: number) => void;
  onBookAppointment: () => void;
}

const TodayAppointments: React.FC<TodayAppointmentsProps> = ({
  appointments,
  timeZoneDisplay,
  showBookingButtons,
  hasAssignedDocuments,
  isLoadingVideoSession,
  onStartSession,
  onBookAppointment,
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Today's Appointments</CardTitle>
          <CardDescription>Sessions scheduled for today</CardDescription>
        </div>
        {showBookingButtons && (
          <Button variant="outline" size="sm" onClick={onBookAppointment}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            Book New Appointment
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {!showBookingButtons && hasAssignedDocuments && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You still need to complete the Assigned Documents before you can schedule your appointment.
            </AlertDescription>
          </Alert>
        )}
        
        {appointments.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Time <span className="text-xs text-gray-500">({timeZoneDisplay})</span></TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Therapist</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.map(appointment => (
                <TableRow key={appointment.id}>
                  <TableCell>{appointment.date}</TableCell>
                  <TableCell>{appointment.time}</TableCell>
                  <TableCell>{appointment.type}</TableCell>
                  <TableCell>{appointment.therapist}</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => onStartSession(appointment.id)}
                      disabled={isLoadingVideoSession}
                    >
                      {isLoadingVideoSession ? "Loading..." : "Start Session"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Calendar className="h-12 w-12 text-gray-300 mb-3" />
            <h3 className="text-lg font-medium">No appointments today</h3>
            <p className="text-sm text-gray-500 mt-1">Check your upcoming appointments below</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TodayAppointments;
