
import React, { useState } from 'react';
import { format, addWeeks, addMonths, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogFooter, DialogClose 
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';

interface Client {
  id: string;
  displayName: string;
}

interface AppointmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  loadingClients: boolean;
  selectedClinicianId: string | null;
  onAppointmentCreated: () => void;
}

const AppointmentDialog: React.FC<AppointmentDialogProps> = ({
  isOpen,
  onClose,
  clients,
  loadingClients,
  selectedClinicianId,
  onAppointmentCreated
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<string>("09:00");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<string>('weekly');

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
      
      if (currentDate > addMonths(startDate, 6)) {
        break;
      }
      
      dates.push(new Date(currentDate));
    }
    
    return dates;
  };

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
        const formattedDate = format(selectedDate, 'yyyy-MM-dd');

        const { data, error } = await supabase
          .from('appointments')
          .insert([{
            client_id: selectedClientId,
            clinician_id: selectedClinicianId,
            date: formattedDate,
            start_time: startTime,
            end_time: endTime,
            type: "Therapy Session",
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
      setIsRecurring(false);
      onClose();
      onAppointmentCreated();

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
    <Dialog open={isOpen} onOpenChange={onClose}>
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
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                  }}
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
  );
};

export default AppointmentDialog;
