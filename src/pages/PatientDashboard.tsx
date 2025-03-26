
import React from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, LayoutDashboard, User, FileText, Calendar as CalendarIcon } from 'lucide-react';

const PatientDashboard: React.FC = () => {
  // Mock data for upcoming appointments
  const upcomingAppointments = [
    { id: 1, date: 'May 15, 2024', time: '10:00 AM', type: 'Therapy Session', therapist: 'Dr. Sarah Johnson' },
    { id: 2, date: 'May 22, 2024', time: '11:30 AM', type: 'Follow-up', therapist: 'Dr. Sarah Johnson' },
  ];

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Patient Dashboard</h1>
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5 text-valorwell-600" />
            <span className="text-sm text-gray-500">Comprehensive patient overview</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Upcoming Appointments Section */}
          <Card className="md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Upcoming Appointments</CardTitle>
                <CardDescription>Your scheduled sessions</CardDescription>
              </div>
              <Calendar className="h-5 w-5 text-valorwell-600" />
            </CardHeader>
            <CardContent>
              {upcomingAppointments.length > 0 ? (
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
                    {upcomingAppointments.map((appointment) => (
                      <TableRow key={appointment.id}>
                        <TableCell>{appointment.date}</TableCell>
                        <TableCell>{appointment.time}</TableCell>
                        <TableCell>{appointment.type}</TableCell>
                        <TableCell>{appointment.therapist}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm">Reschedule</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <Calendar className="h-12 w-12 text-gray-300 mb-3" />
                  <h3 className="text-lg font-medium">No upcoming appointments</h3>
                  <p className="text-sm text-gray-500 mt-1">Schedule a session with your therapist</p>
                  <Button className="mt-4">Book Appointment</Button>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="ghost" size="sm">View All Appointments</Button>
              <Button variant="outline" size="sm">
                <CalendarIcon className="mr-2 h-4 w-4" />
                Book New Appointment
              </Button>
            </CardFooter>
          </Card>

          {/* Quick Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common patient tasks</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Button variant="outline" className="justify-start">
                <CalendarIcon className="mr-2 h-4 w-4" />
                Schedule Appointment
              </Button>
              <Button variant="outline" className="justify-start">
                <FileText className="mr-2 h-4 w-4" />
                View Documents
              </Button>
              <Button variant="outline" className="justify-start">
                <User className="mr-2 h-4 w-4" />
                Update Profile
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Therapist Schedule Section */}
        <Card>
          <CardHeader>
            <CardTitle>Therapist Availability</CardTitle>
            <CardDescription>View your therapist's schedule</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="weekly">
              <TabsList className="mb-4">
                <TabsTrigger value="weekly">Weekly View</TabsTrigger>
                <TabsTrigger value="monthly">Monthly View</TabsTrigger>
              </TabsList>
              
              <TabsContent value="weekly" className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="font-medium mb-2">Dr. Sarah Johnson's Schedule</h3>
                  <p className="text-sm text-gray-500 mb-4">Available time slots for the current week</p>
                  
                  <div className="grid grid-cols-5 gap-3">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => (
                      <div key={day} className="bg-white rounded-md shadow-sm p-3">
                        <h4 className="font-medium text-sm mb-2">{day}</h4>
                        <div className="space-y-2">
                          <div className="text-xs py-1 px-2 rounded bg-green-50 text-green-700 flex items-center">
                            <Clock className="h-3 w-3 mr-1" /> 9:00 AM
                          </div>
                          <div className="text-xs py-1 px-2 rounded bg-green-50 text-green-700 flex items-center">
                            <Clock className="h-3 w-3 mr-1" /> 10:00 AM
                          </div>
                          <div className="text-xs py-1 px-2 rounded bg-gray-100 text-gray-400 flex items-center">
                            <Clock className="h-3 w-3 mr-1" /> 11:00 AM (Booked)
                          </div>
                          <div className="text-xs py-1 px-2 rounded bg-green-50 text-green-700 flex items-center">
                            <Clock className="h-3 w-3 mr-1" /> 2:00 PM
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button>Book a Time Slot</Button>
                </div>
              </TabsContent>
              
              <TabsContent value="monthly">
                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="font-medium mb-2">Monthly Availability</h3>
                  <p className="text-sm text-gray-500 mb-4">View available slots for the entire month</p>
                  <div className="flex justify-center">
                    <p className="text-gray-500">Monthly calendar view will be displayed here</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default PatientDashboard;
