
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  formatTime12Hour, 
  toUTC, 
  fromUTC, 
  ensureIANATimeZone, 
  formatTimeZoneDisplay,
  formatUTCTimeForUser
} from '@/utils/timeZoneUtils';
import { getClinicianTimeZone } from '@/hooks/useClinicianData';

interface EditAppointmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: any;
  onAppointmentUpdated: () => void;
}

const EditAppointmentDialog: React.FC<EditAppointmentDialogProps> = ({
  isOpen,
  onClose,
  appointment,
  onAppointmentUpdated
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    appointment?.date ? new Date(appointment.date) : new Date()
  );
  const [startTime, setStartTime] = useState<string>(appointment?.start_time || '09:00');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [editOption, setEditOption] = useState<'single' | 'series'>('single');
  const [isEditOptionDialogOpen, setIsEditOptionDialogOpen] = useState(false);
  const [clinicianTimeZone, setClinicianTimeZone] = useState<string>('America/Chicago'); // Default timezone
  const [timeZoneDisplay, setTimeZoneDisplay] = useState<string>('Central Time');

  // Fetch clinician's timezone when appointment changes
  useEffect(() => {
    const fetchClinicianTimeZone = async () => {
      if (appointment?.clinician_id) {
        try {
          const timezone = await getClinicianTimeZone(appointment.clinician_id);
          const validTimeZone = ensureIANATimeZone(timezone);
          console.log('Fetched clinician timezone:', validTimeZone);
          setClinicianTimeZone(validTimeZone);
          setTimeZoneDisplay(formatTimeZoneDisplay(validTimeZone));
        } catch (error) {
          console.error('Error fetching clinician timezone:', error);
          // Fallback to browser's timezone
          const systemTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          setClinicianTimeZone(systemTimeZone);
          setTimeZoneDisplay(formatTimeZoneDisplay(systemTimeZone));
        }
      }
    };

    fetchClinicianTimeZone();
  }, [appointment?.clinician_id]);

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

  useEffect(() => {
    if (appointment) {
      setSelectedDate(appointment.date ? new Date(appointment.date) : new Date());
      
      // Converting UTC time from database to clinician timezone for display
      try {
        if (appointment.start_time) {
          // Create a datetime string by combining the date and time
          const dateTimeStr = `${appointment.date}T${appointment.start_time}:00Z`;
          console.log('Displaying in timezone:', { 
            timeZone: clinicianTimeZone, 
            originalTime: appointment.start_time
          });
          
          const displayTime = formatUTCTimeForUser(dateTimeStr, clinicianTimeZone, 'HH:mm');
          console.log('Converted display time:', displayTime);
          setStartTime(displayTime);
        } else {
          setStartTime('09:00');
        }
      } catch (error) {
        console.error('Error converting appointment time for display:', error);
        // Fallback to raw time from database
        setStartTime(appointment.start_time || '09:00');
      }
      
      setIsRecurring(!!appointment.recurring_group_id);
    }
  }, [appointment, clinicianTimeZone]);

  const calculateEndTime = (startTimeStr: string): string => {
    const [hours, minutes] = startTimeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    date.setMinutes(date.getMinutes() + 60); // 60 minute appointments

    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const handleSaveClick = () => {
    if (isRecurring) {
      setIsEditOptionDialogOpen(true);
    } else {
      updateAppointment('single');
    }
  };

  const updateAppointment = async (mode: 'single' | 'series') => {
    if (!selectedDate || !startTime || !appointment?.id) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      
      // Get the clinician's timezone (fallback to system timezone if not available)
      const validTimeZone = ensureIANATimeZone(clinicianTimeZone);
      
      // Converting local time (clinicianTimeZone) to UTC for database storage
      console.log('Converting from', validTimeZone, 'to UTC:', { 
        originalDate: formattedDate, 
        originalTime: startTime 
      });
      
      let utcStartTime;
      try {
        // We don't actually convert to a full UTC timestamp here,
        // we just need to adjust the time portion to be correct in UTC
        // when it's the given local time in the clinician's timezone
        utcStartTime = startTime; // Default fallback
        
        // Create a full ISO datetime string for the conversion
        const localDateTimeStr = `${formattedDate}T${startTime}`;
        const utcDateTime = toUTC(formattedDate, startTime, validTimeZone);
        
        // Extract just the time part (HH:MM) from the UTC timestamp
        utcStartTime = utcDateTime.split('T')[1].substring(0, 5);
        
        console.log('Converted to UTC time:', utcStartTime);
      } catch (error) {
        console.error('Error converting to UTC:', error);
        // Fallback to original time if conversion fails
        utcStartTime = startTime;
      }
      
      const utcEndTime = calculateEndTime(utcStartTime);

      if (mode === 'single') {
        const updateData: any = {
          date: formattedDate,
          start_time: utcStartTime,
          end_time: utcEndTime,
        };

        if (isRecurring) {
          updateData.recurring_group_id = null;
          updateData.appointment_recurring = null;
        }

        const { error } = await supabase
          .from('appointments')
          .update(updateData)
          .eq('id', appointment.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "The appointment has been updated.",
        });
      } else if (mode === 'series' && appointment.recurring_group_id) {
        const { error } = await supabase
          .from('appointments')
          .update({
            start_time: utcStartTime,
            end_time: utcEndTime,
          })
          .eq('recurring_group_id', appointment.recurring_group_id)
          .gte('date', appointment.date);

        if (error) throw error;

        toast({
          title: "Success",
          description: "All future recurring appointments have been updated.",
        });
      }

      setIsEditOptionDialogOpen(false);
      onClose();
      onAppointmentUpdated();
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast({
        title: "Error",
        description: "Failed to update the appointment.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Format time display with timezone
  const formatTimeWithTimezone = (time: string): string => {
    try {
      // Format the time to 12-hour format
      const formatted = formatTime12Hour(time);
      // Add timezone display
      return `${formatted} (${timeZoneDisplay})`;
    } catch (error) {
      console.error('Error formatting time with timezone:', error);
      return formatTime12Hour(time);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Appointment</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="client">Client</Label>
              <div className="p-2 bg-gray-50 rounded border">
                {appointment?.clientName || 'Unknown Client'}
              </div>
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
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      console.log('Date selected:', date);
                      setSelectedDate(date);
                    }}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="time">
                Start Time <span className="text-sm text-muted-foreground">({timeZoneDisplay})</span>
              </Label>
              <Select value={startTime} onValueChange={setStartTime}>
                <SelectTrigger id="time">
                  <SelectValue placeholder="Select start time" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((time) => (
                    <SelectItem key={time} value={time}>
                      {formatTimeWithTimezone(time)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isRecurring && (
              <div className="mt-2 p-3 bg-blue-50 text-sm rounded-md border border-blue-100">
                <div className="font-medium text-blue-700 mb-1">Recurring Appointment</div>
                <p className="text-blue-600">
                  This is part of a recurring series. When you save, you'll be asked if you want to update just this appointment
                  or all future appointments in the series.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveClick} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isEditOptionDialogOpen} onOpenChange={setIsEditOptionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Edit Recurring Appointment</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-4">
                <p>This is a recurring appointment. Would you like to edit just this appointment or all future appointments in this series?</p>

                <RadioGroup value={editOption} onValueChange={(value) => setEditOption(value as 'single' | 'series')}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="single" id="edit-single" />
                    <Label htmlFor="edit-single">Edit only this appointment</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="series" id="edit-series" />
                    <Label htmlFor="edit-series">Edit this and all future appointments in the series</Label>
                  </div>
                </RadioGroup>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => updateAppointment(editOption)} disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Continue'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EditAppointmentDialog;
