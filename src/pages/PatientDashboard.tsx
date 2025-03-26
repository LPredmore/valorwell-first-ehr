
import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, LayoutDashboard, User, FileText, Calendar as CalendarIcon, Clock3, ClipboardList, Shield, Edit, PenSquare } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { useForm } from 'react-hook-form';

const PatientDashboard: React.FC = () => {
  // Mock data for patient profile
  const patientProfile = {
    firstName: 'Robert',
    lastName: 'Boucher',
    preferredName: 'Bobby',
    email: 'predmorejax@gmail.com',
    phone: '5736346131',
    dateOfBirth: 'September 7th, 1986',
    age: '38',
    gender: 'Male',
    genderIdentity: 'Male',
    state: 'Missouri',
    timeZone: 'Central Standard Time (CST)'
  };

  // Mock data for upcoming appointments
  const upcomingAppointments = [
    { id: 1, date: 'May 15, 2024', time: '10:00 AM', type: 'Therapy Session', therapist: 'Dr. Sarah Johnson' },
    { id: 2, date: 'May 22, 2024', time: '11:30 AM', type: 'Follow-up', therapist: 'Dr. Sarah Johnson' },
  ];

  // Mock data for past appointments
  const pastAppointments = [
    { id: 1, date: 'April 30, 2024', time: '10:00 AM', type: 'Initial Consultation', therapist: 'Dr. Sarah Johnson' },
    { id: 2, date: 'April 15, 2024', time: '11:30 AM', type: 'Therapy Session', therapist: 'Dr. Sarah Johnson' },
  ];

  // Options for dropdowns
  const genderOptions = ['Male', 'Female', 'Non-Binary', 'Other', 'Prefer not to say'];
  const genderIdentityOptions = ['Male', 'Female', 'Trans Man', 'Trans Woman', 'Non-Binary', 'Other', 'Prefer not to say'];
  const stateOptions = ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 
    'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 
    'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 
    'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 
    'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 
    'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 
    'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'];
  const timeZoneOptions = ['Eastern Standard Time (EST)', 'Central Standard Time (CST)', 
    'Mountain Standard Time (MST)', 'Pacific Standard Time (PST)', 'Alaska Standard Time (AKST)', 
    'Hawaii-Aleutian Standard Time (HST)', 'Atlantic Standard Time (AST)'];

  // Form setup for profile
  const form = useForm({
    defaultValues: patientProfile,
  });

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Patient Portal</h1>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-valorwell-600" />
            <span className="text-sm text-gray-500">Welcome back</span>
          </div>
        </div>

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="mb-6 w-full justify-start border-b pb-0 pt-0">
            <TabsTrigger value="dashboard" className="gap-2 rounded-b-none rounded-t-lg data-[state=active]:border-b-2 data-[state=active]:border-valorwell-600">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="profile" className="gap-2 rounded-b-none rounded-t-lg data-[state=active]:border-b-2 data-[state=active]:border-valorwell-600">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="pastAppointments" className="gap-2 rounded-b-none rounded-t-lg data-[state=active]:border-b-2 data-[state=active]:border-valorwell-600">
              <Clock3 className="h-4 w-4" />
              Past Appointments
            </TabsTrigger>
            <TabsTrigger value="insurance" className="gap-2 rounded-b-none rounded-t-lg data-[state=active]:border-b-2 data-[state=active]:border-valorwell-600">
              <Shield className="h-4 w-4" />
              Insurance
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-2 rounded-b-none rounded-t-lg data-[state=active]:border-b-2 data-[state=active]:border-valorwell-600">
              <ClipboardList className="h-4 w-4" />
              Documents
            </TabsTrigger>
          </TabsList>
          
          {/* Dashboard Tab Content */}
          <TabsContent value="dashboard" className="mt-0">
            <div className="grid grid-cols-1 gap-6">
              {/* Upcoming Appointments Section */}
              <Card>
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
          </TabsContent>
          
          {/* Profile Tab Content */}
          <TabsContent value="profile" className="mt-0">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-2xl">
                    {patientProfile.firstName} {patientProfile.lastName}
                  </CardTitle>
                  <CardDescription>{patientProfile.email}</CardDescription>
                </div>
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
              </CardHeader>
              <CardContent>
                <div className="border-b pb-4 mb-4">
                  <ul className="flex space-x-4 overflow-x-auto">
                    <li className="border-b-2 border-valorwell-600 px-3 py-2 text-sm font-medium text-valorwell-600">
                      Personal Info
                    </li>
                    <li className="px-3 py-2 text-sm font-medium text-gray-500 hover:text-valorwell-600 cursor-pointer">
                      Insurance
                    </li>
                    <li className="px-3 py-2 text-sm font-medium text-gray-500 hover:text-valorwell-600 cursor-pointer">
                      Treatment
                    </li>
                    <li className="px-3 py-2 text-sm font-medium text-gray-500 hover:text-valorwell-600 cursor-pointer">
                      Notes
                    </li>
                  </ul>
                </div>
              
                <div className="mt-6">
                  <h3 className="text-xl font-semibold mb-4">Personal Information</h3>
                  
                  <Form {...form}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* First Name */}
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">First Name</FormLabel>
                            <FormControl>
                              <Input {...field} readOnly />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      {/* Last Name */}
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Last Name</FormLabel>
                            <FormControl>
                              <Input {...field} readOnly />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      {/* Preferred Name */}
                      <FormField
                        control={form.control}
                        name="preferredName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Preferred Name</FormLabel>
                            <FormControl>
                              <Input {...field} readOnly />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      {/* Email */}
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Email</FormLabel>
                            <FormControl>
                              <Input {...field} readOnly />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      {/* Phone */}
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Phone</FormLabel>
                            <FormControl>
                              <Input {...field} readOnly />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      {/* Date of Birth */}
                      <FormField
                        control={form.control}
                        name="dateOfBirth"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Date of Birth</FormLabel>
                            <FormControl>
                              <Input {...field} readOnly />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      {/* Age */}
                      <FormField
                        control={form.control}
                        name="age"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Age</FormLabel>
                            <FormControl>
                              <Input {...field} readOnly />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      {/* Gender */}
                      <FormField
                        control={form.control}
                        name="gender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Gender</FormLabel>
                            <Select 
                              disabled 
                              value={field.value} 
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {genderOptions.map(option => (
                                  <SelectItem key={option} value={option}>{option}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      
                      {/* Gender Identity */}
                      <FormField
                        control={form.control}
                        name="genderIdentity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Gender Identity</FormLabel>
                            <Select 
                              disabled 
                              value={field.value} 
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select gender identity" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {genderIdentityOptions.map(option => (
                                  <SelectItem key={option} value={option}>{option}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      
                      {/* State */}
                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">State</FormLabel>
                            <Select 
                              disabled 
                              value={field.value} 
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select state" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {stateOptions.map(option => (
                                  <SelectItem key={option} value={option}>{option}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      
                      {/* Time Zone */}
                      <FormField
                        control={form.control}
                        name="timeZone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Time Zone</FormLabel>
                            <Select 
                              disabled 
                              value={field.value} 
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select time zone" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {timeZoneOptions.map(option => (
                                  <SelectItem key={option} value={option}>{option}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                    </div>
                  </Form>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Past Appointments Tab Content */}
          <TabsContent value="pastAppointments" className="mt-0">
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
          </TabsContent>
          
          {/* Insurance Tab Content */}
          <TabsContent value="insurance" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Insurance Information</CardTitle>
                <CardDescription>View and manage your insurance details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-center text-gray-500">Your insurance information will be displayed here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Documents Tab Content */}
          <TabsContent value="documents" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Documents</CardTitle>
                <CardDescription>View and download your documents</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-center text-gray-500">Your documents will be displayed here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default PatientDashboard;
