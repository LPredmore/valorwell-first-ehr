
import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import CalendarView from '../components/calendar/CalendarView';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar as CalendarIcon, Users, Clock, Plus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { getUserTimeZone } from '@/utils/timeZoneUtils';
import { useClinicianData } from '@/hooks/useClinicianData';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, addWeeks, addMonths, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { Form, FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';

type ViewType = 'day' | 'week' | 'month';

interface Clinician {
  id: string;
  clinician_professional_name: string;
}

interface Client {
  id: string;
  displayName: string;
}

// This function generates recurring dates based on the pattern
const generateRecurringDates = (
  startDate: Date,
  recurrenceType: string,
  count = 26 // 6 months (26 weeks) of appointments
): Date[] => {
  const dates: Date[] = [new Date(startDate)];
  let currentDate = new Date(startDate);
  
  for (let i = 1; i < count; i++) {
    if (recurrenceType === 'weekly') {
      currentDate = addWeeks(currentDate, 1);
    } else if (recurrenceType === 'biweekly') {
      currentDate = addWeeks(currentDate, 2);
    } else if (recurrenceType === 'monthly') {
      currentDate = addWeeks(currentDate, 4); // Every 4 weeks
    }
    
    // Limit to 6 months of appointments
    if (currentDate > addMonths(startDate, 6)) {
      break;
    }
    
    dates.push(new Date(currentDate));
  }
  
  return dates;
};

const CalendarPage = () => {
  const [view, setView] = useState<ViewType>('week');
  const [showAvailability, setShowAvailability] = useState(false);
  const [selectedClinicianId, setSelectedClinicianId] = useState<string | null>(null);
  const [clinicians, setClinicians] = useState<Clinician[]>([]);
  const [loadingClinicians, setLoadingClinicians] = useState(true);
  const { clinicianData } = useClinicianData();
  const [userTimeZone, setUserTimeZone] = useState<string>('');
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<string>('weekly');
  const [startTime, setStartTime] = useState<string>('09:00');
  
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [appointmentRefreshTrigger, setAppointmentRefreshTrigger] = useState(0);

  useEffect(() => {
    if (clinicianData?.clinician_time_zone) {
      setUserTimeZone(clinicianData.clinician_time_zone);
    } else {
      setUserTimeZone(getUserTimeZone());
    }
  }, [clinicianData]);

  useEffect(() => {
    const fetchClinicians = async () => {
      setLoadingClinicians(true);
      try {
        const { data, error } = await supabase
          .from('clinicians')
          .select('id, clinician_professional_name')
          .order('clinician_professional_name');

        if (error) {
          console.error('Error fetching clinicians:', error);
        } else {
          setClinicians(data || []);
          if (data && data.length > 0 && !selectedClinicianId) {
            setSelectedClinicianId(data[0].id);
          }
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoadingClinicians(false);
      }
    };

    fetchClinicians();
  }, []);

  useEffect(() => {
    const fetchClientsForClinician = async () => {
      if (!selectedClinicianId) return;
      
      setLoadingClients(true);
      setClients([]);
      setSelectedClientId(null);
      
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('id, client_preferred_name, client_last_name')
          .eq('client_assigned_therapist', selectedClinicianId)
          .order('client_last_name');
          
        if (error) {
          console.error('Error fetching clients:', error);
        } else {
          const formattedClients = data.map(client => ({
            id: client.id,
            displayName: `${client.client_preferred_name || ''} ${client.client_last_name || ''}`.trim() || 'Unnamed Client'
          }));
          setClients(formattedClients);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoadingClients(false);
      }
    };

    fetchClientsForClinician();
  }, [selectedClinicianId]);

  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const formattedHour = hour.toString().padStart(2, '0');
        const formattedMinute = minute.toString().padStart(2, '0');
        options.push(`${formattedHour}:${formattedMinute}`);
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  const handleCreateAppointment = async () => {
    if (!selectedClientId || !selectedDate || !startTime || !selectedClinicianId) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    try {
      const startTimeParts = startTime.split(':').map(Number);
      const startDateTime = new Date();
      startDateTime.setHours(startTimeParts[0], startTimeParts[1], 0, 0);
      
      const endDateTime = new Date(startDateTime);
      endDateTime.setMinutes(endDateTime.getMinutes() + 60); // Always 60 minutes
      
      const endTime = `${endDateTime.getHours().toString().padStart(2, '0')}:${endDateTime.getMinutes().toString().padStart(2, '0')}`;

      // If it's a recurring appointment, we need to generate multiple dates
      if (isRecurring) {
        const recurringGroupId = uuidv4(); // Generate a unique ID to link recurring appointments
        const recurringDates = generateRecurringDates(selectedDate, recurrenceType);
        
        const appointmentsToInsert = recurringDates.map(date => ({
          client_id: selectedClientId,
          clinician_id: selectedClinicianId,
          date: format(date, 'yyyy-MM-dd'),
          start_time: startTime,
          end_time: endTime,
          type: "Therapy Session",
          status: 'scheduled',
          appointment_recurring: recurrenceType,
          recurring_group_id: recurringGroupId
        }));

        // Insert all recurring appointments in a batch
        const { data, error } = await supabase
          .from('appointments')
          .insert(appointmentsToInsert)
          .select();

        if (error) {
          console.error('Error details:', error.message, error);
          throw error;
        }

        toast({
          title: "Recurring Appointments Created",
          description: `Created ${recurringDates.length} recurring appointments.`,
        });
      } else {
        // Create a single appointment
        const formattedDate = format(selectedDate, 'yyyy-MM-dd');

        const { data, error } = await supabase
          .from('appointments')
          .insert([{
            client_id: selectedClientId,
            clinician_id: selectedClinicianId,
            date: formattedDate,
            start_time: startTime,
            end_time: endTime,
            type: "Therapy Session", // Hardcoded default type
            status: 'scheduled'
          }])
          .select();

        if (error) {
          console.error('Error details:', error.message, error);
          throw error;
        }

        toast({
          title: "Appointment Created",
          description: "The appointment has been successfully scheduled.",
        });
      }

      setSelectedClientId(null);
      setStartTime("09:00");
      setIsDialogOpen(false);
      setIsRecurring(false);
      
      // Trigger a refresh of the calendar view
      setAppointmentRefreshTrigger(prev => prev + 1);

    } catch (error) {
      console.error('Error creating appointment:', error);
      toast({
        title: "Error",
        description: "Failed to create appointment. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Layout>
      <div className="bg-white rounded-lg shadow-sm p-6 animate-fade-in">
        <div className="flex flex-col space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">Calendar</h1>
            <div className="flex items-center gap-4">
              <Tabs defaultValue="week" value={view} onValueChange={(value) => setView(value as ViewType)}>
                <TabsList>
                  <TabsTrigger value="day">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Day
                  </TabsTrigger>
                  <TabsTrigger value="week">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Week
                  </TabsTrigger>
                  <TabsTrigger value="month">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Month
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <Button
                variant={showAvailability ? "default" : "outline"}
                onClick={() => setShowAvailability(!showAvailability)}
              >
                <Clock className="mr-2 h-4 w-4" />
                Availability
              </Button>

              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Appointment
              </Button>

              <div className="w-64">
                <Select
                  value={selectedClinicianId || undefined}
                  onValueChange={(value) => setSelectedClinicianId(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a clinician" />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingClinicians ? (
                      <div className="flex items-center justify-center p-2">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Loading...
                      </div>
                    ) : (
                      clinicians.map((clinician) => (
                        <SelectItem key={clinician.id} value={clinician.id}>
                          {clinician.clinician_professional_name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <CalendarView
            view={view}
            showAvailability={showAvailability}
            clinicianId={selectedClinicianId}
            userTimeZone={userTimeZone}
            refreshTrigger={appointmentRefreshTrigger}
          />
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Appointment</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="client">Client Name</Label>
              <Select 
                value={selectedClientId || undefined}
                onValueChange={(value) => setSelectedClientId(value)}
              >
                <SelectTrigger id="client">
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {loadingClients ? (
                    <div className="flex items-center justify-center p-2">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Loading...
                    </div>
                  ) : clients.length > 0 ? (
                    clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.displayName}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-clients" disabled>
                      No clients assigned to this clinician
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                    id="date"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="time">Start Time</Label>
              <Select value={startTime} onValueChange={setStartTime}>
                <SelectTrigger id="time">
                  <SelectValue placeholder="Select start time" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((time) => (
                    <SelectItem key={time} value={time}>
                      {format(new Date(`2023-01-01T${time}`), 'h:mm a')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Checkbox 
                id="recurring" 
                checked={isRecurring} 
                onCheckedChange={(checked) => setIsRecurring(checked === true)}
              />
              <Label htmlFor="recurring">Recurring appointment</Label>
            </div>

            {isRecurring && (
              <div className="grid gap-2 pl-6">
                <Label htmlFor="recurrenceType">Recurrence Pattern</Label>
                <Select value={recurrenceType} onValueChange={setRecurrenceType}>
                  <SelectTrigger id="recurrenceType">
                    <SelectValue placeholder="Select recurrence pattern" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Every 2 weeks</SelectItem>
                    <SelectItem value="monthly">Every 4 weeks</SelectItem>
                  </SelectContent>
                </Select>
                <div className="text-xs text-muted-foreground mt-1">
                  This will create appointments for the next 6 months following this pattern.
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="button" onClick={handleCreateAppointment}>
              {isRecurring ? "Create Recurring Appointments" : "Create Appointment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default CalendarPage;
