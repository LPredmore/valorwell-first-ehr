
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';

interface UpcomingAppointmentsProps {
  appointments: any[];
  timeZoneDisplay: string;
  showBookingButtons: boolean;
  onBookAppointment: () => void;
}

const UpcomingAppointments: React.FC<UpcomingAppointmentsProps> = ({
  appointments,
  timeZoneDisplay,
  showBookingButtons,
  onBookAppointment,
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>Upcoming Appointments</CardTitle>
          <CardDescription>Your scheduled sessions</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {appointments.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Time <span className="text-xs text-gray-500">({timeZoneDisplay})</span></TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Therapist</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.map(appointment => (
                <TableRow key={appointment.id}>
                  <TableCell>{appointment.date}</TableCell>
                  <TableCell>{appointment.time}</TableCell>
                  <TableCell>{appointment.type}</TableCell>
                  <TableCell>{appointment.therapist}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Calendar className="h-12 w-12 text-gray-300 mb-3" />
            <h3 className="text-lg font-medium">No upcoming appointments</h3>
            <p className="text-sm text-gray-500 mt-1">Schedule a session with your therapist</p>
            {showBookingButtons && (
              <Button className="mt-4" onClick={onBookAppointment}>
                Book Appointment
              </Button>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
      </CardFooter>
    </Card>
  );
};

export default UpcomingAppointments;
