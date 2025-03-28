
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';

interface MyAppointmentsProps {
  pastAppointments: Array<{
    id: number;
    date: string;
    time: string;
    type: string;
    therapist: string;
  }>;
}

const MyAppointments: React.FC<MyAppointmentsProps> = ({ pastAppointments }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Past Appointments</CardTitle>
        <CardDescription>View your appointment history</CardDescription>
      </CardHeader>
      <CardContent>
        {pastAppointments.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Therapist</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pastAppointments.map((appointment) => (
                <TableRow key={appointment.id}>
                  <TableCell>{appointment.date}</TableCell>
                  <TableCell>{appointment.time}</TableCell>
                  <TableCell>{appointment.type}</TableCell>
                  <TableCell>{appointment.therapist}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm">View Details</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Calendar className="h-12 w-12 text-gray-300 mb-3" />
            <h3 className="text-lg font-medium">No past appointments</h3>
            <p className="text-sm text-gray-500 mt-1">Your appointment history will appear here</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MyAppointments;
