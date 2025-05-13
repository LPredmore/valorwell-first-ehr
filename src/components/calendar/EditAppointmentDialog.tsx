
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { TimeZoneService } from '@/utils/timeZoneService';
import { DateTime } from 'luxon';

interface EditAppointmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: any;
  onAppointmentUpdated: () => void;
  userTimeZone?: string;
}

// Generate time options for dropdown
const generateTimeOptions = (): string[] => {
  const options: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      options.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
    }
  }
  return options;
};

// Function to calculate end time (30 minutes after start time)
const calculateEndTime = (startTime: string): string => {
  const [hours, minutes] = startTime.split(':').map(Number);
  let endHours = hours;
  let endMinutes = minutes + 30;
  
  if (endMinutes >= 60) {
    endHours = (endHours + 1) % 24;
    endMinutes = endMinutes - 60;
  }
  
  return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
};

const EditAppointmentDialog: React.FC<EditAppointmentDialogProps> = ({
  isOpen,
  onClose,
  appointment,
  onAppointmentUpdated,
  userTimeZone = TimeZoneService.DEFAULT_TIMEZONE
}) => {
  const safeTimeZone = TimeZoneService.ensureIANATimeZone(userTimeZone);
  
  // Debug helper function
  const logDebug = (message: string, data: any = {}) => {
    console.log(`🔍 EDIT APPOINTMENT - ${message}`, data);
  };
  
  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      logDebug('Auth status checked', { 
        isAuthenticated: !!session,
        userId: session?.user?.id || null
      });
    };
    
    checkAuth();
  }, []);
  
  // Convert UTC timestamp to local date and time for initial values
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    appointment?.start_at ? 
      TimeZoneService.fromUTC(appointment.start_at, safeTimeZone).toJSDate() : 
      new Date()
  );
  
  const [startTime, setStartTime] = useState<string>(() => {
    if (appointment?.start_at) {
      return TimeZoneService.fromUTC(appointment.start_at, safeTimeZone).toFormat('HH:mm');
    }
    return '09:00';
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [editOption, setEditOption] = useState<'single' | 'series'>('single');
  const [isEditOptionDialogOpen, setIsEditOptionDialogOpen] = useState(false);

  // Generate time options once
  const timeOptions = generateTimeOptions();

  useEffect(() => {
    if (appointment) {
      // Update state when appointment changes
      if (appointment.start_at) {
        const localDateTime = TimeZoneService.fromUTC(appointment.start_at, safeTimeZone);
        setSelectedDate(localDateTime.toJSDate());
        setStartTime(localDateTime.toFormat('HH:mm'));
      }
      setIsRecurring(!!appointment.recurring_group_id);
      
      // Log appointment data for debugging
      logDebug('Appointment data loaded', {
        appointmentId: appointment.id,
        startTime: appointment.start_at,
        isRecurring: !!appointment.recurring_group_id,
        timezone: safeTimeZone
      });
    }
  }, [appointment, safeTimeZone]);

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
      logDebug('Updating appointment with values:', {
        selectedDate: format(selectedDate, 'yyyy-MM-dd'),
        startTime,
        mode,
        appointmentId: appointment.id,
        isRecurring,
        recurringId: appointment.recurring_group_id
      });
      
      // Convert local date and time to UTC timestamps using Luxon
      // Create a DateTime object in user's timezone
      const localDateTime = DateTime.fromJSDate(selectedDate)
        .set({ 
          hour: parseInt(startTime.split(':')[0]), 
          minute: parseInt(startTime.split(':')[1]),
          second: 0,
          millisecond: 0 
        })
        .setZone(safeTimeZone);
      
      // Calculate end time (30 minutes after start)
      const endDateTime = localDateTime.plus({ minutes: 30 });
      
      // Convert to UTC for storage
      const utcStart = localDateTime.toUTC().toISO();
      const utcEnd = endDateTime.toUTC().toISO();
      
      logDebug('Calculated timestamps:', {
        localStart: localDateTime.toISO(),
        localEnd: endDateTime.toISO(),
        utcStart,
        utcEnd,
        timezone: safeTimeZone
      });

      if (mode === 'single') {
        const updateData: any = {
          start_at: utcStart,
          end_at: utcEnd,
        };
        
        if (isRecurring) {
          updateData.recurring_group_id = null;
        }
        
        logDebug('Updating single appointment:', {
          appointmentId: appointment.id,
          updateData
        });
        
        const { data, error } = await supabase
          .from('appointments')
          .update(updateData)
          .eq('id', appointment.id);

        if (error) {
          logDebug('Error updating appointment:', error);
          throw error;
        }
        
        toast({
          title: "Success",
          description: "The appointment has been updated.",
        });
      } else if (mode === 'series' && appointment.recurring_group_id) {
        logDebug('Updating recurring appointment series:', {
          recurringGroupId: appointment.recurring_group_id,
          fromDate: appointment.start_at,
          updateData: {
            startAt: utcStart,
            endAt: utcEnd
          }
        });
        
        const { data, error } = await supabase
          .from('appointments')
          .update({
            start_at: utcStart,
            end_at: utcEnd,
          })
          .eq('recurring_group_id', appointment.recurring_group_id)
          .gte('start_at', appointment.start_at);

        if (error) {
          logDebug('Error updating recurring appointments:', error);
          throw error;
        }
        
        toast({
          title: "Success",
          description: "All future recurring appointments have been updated.",
        });
      }

      // Enhanced logging for debugging calendar refresh
      logDebug('Appointment updated successfully, triggering calendar refresh');
      
      setIsEditOptionDialogOpen(false);
      onClose();
      
      // Explicitly call onAppointmentUpdated to refresh the calendar
      onAppointmentUpdated();
    } catch (error) {
      logDebug('Error updating appointment:', error);
      toast({
        title: "Error",
        description: "Failed to update the appointment.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
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
                      setSelectedDate(date);
                    }}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="time">Start Time ({TimeZoneService.getTimeZoneDisplayName(safeTimeZone)})</Label>
              <Select value={startTime} onValueChange={setStartTime}>
                <SelectTrigger id="time">
                  <SelectValue placeholder="Select start time" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
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
