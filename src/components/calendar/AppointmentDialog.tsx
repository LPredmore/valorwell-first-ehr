import React, { useState, useEffect } from 'react';
import { format, addWeeks, addMonths, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useDialogs, DialogType } from '@/context/DialogContext';
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
import { TimeZoneService } from '@/utils/timeZoneService';
import { getClinicianTimeZone } from '@/hooks/useClinicianData';

interface Client {
  id: string;
  displayName: string;
}

interface AppointmentDialogProps {
  clients: Client[];
  loadingClients: boolean;
  selectedClinicianId: string | null;
  onAppointmentCreated: () => void;
}

const AppointmentDialog: React.FC<AppointmentDialogProps> = ({
  clients,
  loadingClients,
  selectedClinicianId,
  onAppointmentCreated
}) => {
  const { state, closeDialog } = useDialogs();
  const isOpen = state.type === 'appointment';
  const onClose = closeDialog;
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<string>("09:00");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<string>('weekly');
  const [clinicianTimeZone, setClinicianTimeZone] = useState<string>('America/Chicago');
  const [isLoadingTimeZone, setIsLoadingTimeZone] = useState<boolean>(true);

  useEffect(() => {
    const fetchClinicianTimeZone = async () => {
      if (selectedClinicianId) {
        setIsLoadingTimeZone(true);
        try {
          const timeZone = await getClinicianTimeZone(selectedClinicianId);
          console.log("[AppointmentDialog] Fetched clinician timezone:", timeZone);
          const validTimeZone = TimeZoneService.ensureIANATimeZone(timeZone);
          setClinicianTimeZone(validTimeZone);
        } catch (error) {
          console.error("[AppointmentDialog] Error fetching clinician timezone:", error);
          setClinicianTimeZone('America/Chicago');
        } finally {
          setIsLoadingTimeZone(false);
        }
      }
    };
    
    fetchClinicianTimeZone();
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

  const calculateEndTime = (startTimeStr: string): string => {
    try {
      const startTimeParts = startTimeStr.split(':').map(Number);
      const startDateTime = new Date();
      startDateTime.setHours(startTimeParts[0], startTimeParts[1], 0, 0);
      
      const endDateTime = new Date(startDateTime);
      endDateTime.setMinutes(endDateTime.getMinutes() + 60); // Always 60 minutes
      
      return `${endDateTime.getHours().toString().padStart(2, '0')}:${endDateTime.getMinutes().toString().padStart(2, '0')}`;
    } catch (error) {
      console.error('[AppointmentDialog] Error calculating end time:', error);
      const startHour = parseInt(startTimeStr.split(':')[0], 10);
      return `${(startHour + 1) % 24}:${startTimeStr.split(':')[1]}`;
    }
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
      const validTimeZone = TimeZoneService.ensureIANATimeZone(clinicianTimeZone);
      console.log(`[AppointmentDialog] Using clinician timezone: ${validTimeZone} (${TimeZoneService.formatTimeZoneDisplay(validTimeZone)})`);
      
      const endTime = calculateEndTime(startTime);
      
      if (isRecurring) {
        const recurringGroupId = uuidv4();
        const recurringDates = generateRecurringDates(selectedDate, recurrenceType);
        
        const appointmentsToInsert = [];
        
        for (const date of recurringDates) {
          try {
            const formattedDate = format(date, 'yyyy-MM-dd');
            
            const startTimestamp = TimeZoneService.toUTCTimestamp(formattedDate, startTime, validTimeZone);
            const endTimestamp = TimeZoneService.toUTCTimestamp(formattedDate, endTime, validTimeZone);
            
            console.log(`[AppointmentDialog] Creating appointment for ${formattedDate} at ${startTime}-${endTime}`);
            console.log(`[AppointmentDialog] UTC timestamps: ${startTimestamp} to ${endTimestamp}`);
            
            appointmentsToInsert.push({
              client_id: selectedClientId,
              clinician_id: selectedClinicianId,
              date: formattedDate,
              start_time: startTime,
              end_time: endTime,
              appointment_datetime: startTimestamp,
              appointment_end_datetime: endTimestamp,
              type: "Therapy Session",
              status: 'scheduled',
              appointment_recurring: recurrenceType,
              recurring_group_id: recurringGroupId
            });
          } catch (error) {
            console.error('[AppointmentDialog] Error processing appointment date:', error, date);
          }
        }

        console.log('[AppointmentDialog] Inserting recurring appointments:', appointmentsToInsert);
        
        const { data, error } = await supabase
          .from('appointments')
          .insert(appointmentsToInsert)
          .select();

        if (error) {
          console.error('[AppointmentDialog] Error details:', error.message, error);
          throw error;
        }

        toast({
          title: "Recurring Appointments Created",
          description: `Created ${recurringDates.length} recurring appointments.`,
        });
      } else {
        try {
          const formattedDate = format(selectedDate, 'yyyy-MM-dd');

          const startTimestamp = TimeZoneService.toUTCTimestamp(formattedDate, startTime, validTimeZone);
          const endTimestamp = TimeZoneService.toUTCTimestamp(formattedDate, endTime, validTimeZone);
          
          console.log(`[AppointmentDialog] Creating appointment for ${formattedDate}:`);
          console.log(`- Local time (${validTimeZone}): ${startTime}-${endTime}`);
          console.log(`- UTC timestamps: ${startTimestamp} to ${endTimestamp}`);

          const { data, error } = await supabase
            .from('appointments')
            .insert([{
              client_id: selectedClientId,
              clinician_id: selectedClinicianId,
              date: formattedDate,
              start_time: startTime,
              end_time: endTime,
              appointment_datetime: startTimestamp,
              appointment_end_datetime: endTimestamp,
              type: "Therapy Session",
              status: 'scheduled'
            }])
            .select();

          if (error) {
            console.error('[AppointmentDialog] Error details:', error.message, error);
            throw error;
          }

          toast({
            title: "Appointment Created",
            description: "The appointment has been successfully scheduled.",
          });
        } catch (error) {
          console.error('[AppointmentDialog] Error creating single appointment:', error);
          throw error;
        }
      }

      setSelectedClientId(null);
      setStartTime("09:00");
      setIsRecurring(false);
      onClose();
      onAppointmentCreated();

    } catch (error) {
      console.error('[AppointmentDialog] Error creating appointment:', error);
      toast({
        title: "Error",
        description: "Failed to create appointment. Please try again.",
        variant: "destructive"
      });
    }
  };

  const timeZoneDisplay = TimeZoneService.formatTimeZoneDisplay(clinicianTimeZone);

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
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
            <Label htmlFor="time">Start Time <span className="text-xs text-muted-foreground">({isLoadingTimeZone ? 'Loading timezone...' : timeZoneDisplay})</span></Label>
            <Select value={startTime} onValueChange={setStartTime}>
              <SelectTrigger id="time">
                <SelectValue placeholder="Select start time" />
              </SelectTrigger>
              <SelectContent>
                {timeOptions.map((time) => {
                  let displayTime;
                  try {
                    const timeDate = new Date();
                    const [hours, minutes] = time.split(':').map(Number);
                    timeDate.setHours(hours, minutes, 0, 0);
                    displayTime = format(timeDate, 'h:mm a');
                  } catch (error) {
                    console.error('Error formatting time for display:', error, time);
                    displayTime = TimeZoneService.formatTime(time);
                  }
                  
                  return (
                    <SelectItem key={time} value={time}>
                      {displayTime}
                    </SelectItem>
                  );
                })}
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
