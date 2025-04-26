import React, { useState, useEffect } from 'react';
import { format, parse, addDays, isSameDay, isAfter, differenceInCalendarDays } from 'date-fns';
import { Calendar as CalendarIcon, Clock, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  getUserTimeZone
} from '@/utils/timeZoneUtils';
import { 
  convertClinicianDataToAvailabilityBlocks,
  getClinicianAvailabilityFieldsQuery
} from '@/utils/availabilityUtils';
import { getUserTimeZoneById } from '@/hooks/useUserTimeZone';
import { TimeZoneService } from '@/utils/timeZoneService';

import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

interface AppointmentBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clinicianId: string | null;
  clinicianName: string | null;
  clientId: string | null;
  onAppointmentBooked: () => void;
  userTimeZone?: string;
  disabled?: boolean;
}

interface AvailabilityBlock {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

interface AvailabilitySettings {
  time_granularity: string;
  min_days_ahead: number;
}

const AppointmentBookingDialog: React.FC<AppointmentBookingDialogProps> = ({
  open,
  onOpenChange,
  clinicianId,
  clinicianName,
  clientId,
  onAppointmentBooked,
  userTimeZone: propTimeZone,
  disabled = false
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [notes, setNotes] = useState<string>("");
  const [availabilityBlocks, setAvailabilityBlocks] = useState<AvailabilityBlock[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [bookingInProgress, setBookingInProgress] = useState<boolean>(false);
  const [minDaysAhead, setMinDaysAhead] = useState<number>(1);
  const [clinicianTimeZone, setClinicianTimeZone] = useState<string>("America/Chicago");
  const [clientTimeZone, setClientTimeZone] = useState<string>(TimeZoneService.ensureIANATimeZone(propTimeZone || getUserTimeZone()));
  const [timeGranularity, setTimeGranularity] = useState<string>("half-hour");
  const { toast } = useToast();

  useEffect(() => {
    if (open && clientId) {
      const fetchClientTimeZone = async () => {
        try {
          const timeZone = await getUserTimeZoneById(clientId);
          console.log(`[AppointmentBookingDialog] Fetched client time zone from database: ${timeZone}`);
          setClientTimeZone(timeZone);
        } catch (error) {
          console.error('[AppointmentBookingDialog] Error fetching client time zone:', error);
          setClientTimeZone(TimeZoneService.ensureIANATimeZone(propTimeZone || getUserTimeZone()));
        }
      };
      
      fetchClientTimeZone();
    }
  }, [open, clientId, propTimeZone]);

  useEffect(() => {
    if (open) {
      console.log("[AppointmentBookingDialog] Opened with client timezone:", clientTimeZone);
    }
  }, [open, clientTimeZone]);

  useEffect(() => {
    if (!open || !clinicianId) return;
    
    const fetchClinicianTimeZone = async () => {
      try {
        const timeZone = await getUserTimeZoneById(clinicianId);
        console.log('[AppointmentBookingDialog] Fetched clinician timezone:', timeZone);
        setClinicianTimeZone(timeZone);
      } catch (error) {
        console.error('[AppointmentBookingDialog] Error fetching clinician timezone:', error);
      }
    };
    
    fetchClinicianTimeZone();
    
    const fetchSettings = async () => {
      try {
        console.log('Fetching availability settings for clinician ID:', clinicianId);
        const { data: settingsData, error: settingsError } = await supabase.functions.invoke('get-availability-settings', {
          body: { clinicianId }
        });
        
        if (settingsError) {
          console.error('Error fetching availability settings:', settingsError);
        } else if (settingsData) {
          const parsedMinDays = Number(settingsData.min_days_ahead);
          console.log('Received availability settings:', settingsData);
          console.log('Parsed min_days_ahead:', parsedMinDays);
          setMinDaysAhead(parsedMinDays || 1);
          
          if (settingsData.time_granularity) {
            console.log('Setting time granularity to:', settingsData.time_granularity);
            setTimeGranularity(settingsData.time_granularity);
          }
          
          console.log('Set minDaysAhead state to:', parsedMinDays || 1);
        } else {
          console.log('No settings data received, using default value of 1 for minDaysAhead');
        }
      } catch (error) {
        console.error('Caught error in fetchSettings:', error);
        setMinDaysAhead(1);
        setTimeGranularity('half-hour');
      }
    };
    
    fetchSettings();
  }, [clinicianId, open]);

  useEffect(() => {
    const fetchAvailability = async () => {
      if (!clinicianId) return;
      
      setLoading(true);
      try {
        const { data: clinicianData, error: clinicianError } = await supabase
          .from('clinicians')
          .select(getClinicianAvailabilityFieldsQuery())
          .eq('id', clinicianId)
          .single();
          
        if (clinicianError) {
          console.error('Error fetching clinician data:', clinicianError);
          toast({
            title: "Error",
            description: "Could not fetch therapist availability",
            variant: "destructive"
          });
          return;
        }
        
        const availabilityData = convertClinicianDataToAvailabilityBlocks(clinicianData);
        setAvailabilityBlocks(availabilityData || []);
      } catch (error) {
        console.error('Error:', error);
        toast({
          title: "Error",
          description: "Could not fetch therapist availability",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, [clinicianId, toast]);

  useEffect(() => {
    if (!selectedDate || !availabilityBlocks.length) {
      setTimeSlots([]);
      return;
    }

    const dayOfWeek = format(selectedDate, 'EEEE');
    const availabilityForDay = availabilityBlocks.filter(
      block => block.day_of_week === dayOfWeek
    );

    if (availabilityForDay.length === 0) {
      setTimeSlots([]);
      return;
    }

    const slots: TimeSlot[] = [];
    
    availabilityForDay.forEach(block => {
      console.log(`Processing availability block: ${block.start_time} - ${block.end_time} (clinician timezone: ${clinicianTimeZone})`);
      
      try {
        const startTimeDate = parse(block.start_time, 'HH:mm:ss', new Date());
        const endTimeDate = parse(block.end_time, 'HH:mm:ss', new Date());
        
        let currentTime = startTimeDate;
        while (currentTime < endTimeDate) {
          const timeString = format(currentTime, 'HH:mm');
          slots.push({
            time: timeString,
            available: true
          });
          
          currentTime = addDays(currentTime, 0);
          if (timeGranularity === 'hour') {
            currentTime.setMinutes(currentTime.getMinutes() + 60);
          } else {
            currentTime.setMinutes(currentTime.getMinutes() + 30);
          }
        }
      } catch (error) {
        console.error('Error processing availability block times:', error, {
          block_start: block.start_time,
          block_end: block.end_time,
          timeZone: clinicianTimeZone
        });
      }
    });

    const checkExistingAppointments = async () => {
      if (!selectedDate || !clinicianId) return;
      
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      console.log('Checking appointments for date:', dateStr);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const daysFromToday = differenceInCalendarDays(selectedDate, today);
      console.log('Days from today:', daysFromToday, 'minDaysAhead:', minDaysAhead);
      
      if (daysFromToday < minDaysAhead) {
        console.log('Selected date is too soon, should be blocked');
        setTimeSlots([]);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('appointments')
          .select('*')
          .eq('clinician_id', clinicianId)
          .eq('date', dateStr)
          .eq('status', 'scheduled');
          
        if (error) {
          console.error('Error fetching appointments:', error);
        } else if (data && data.length > 0) {
          console.log('Found existing appointments:', data);
          
          const updatedSlots = slots.map(slot => {
            const slotTimeStr = `${slot.time}:00`;
            
            const isBooked = data.some(appointment => {
              return appointment.start_time === slotTimeStr;
            });
            
            return {
              ...slot,
              available: !isBooked
            };
          });
          
          setTimeSlots(updatedSlots);
        } else {
          setTimeSlots(slots);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };
    
    checkExistingAppointments();
  }, [selectedDate, availabilityBlocks, clinicianId, minDaysAhead, clinicianTimeZone, timeGranularity]);

  const handleBookAppointment = async () => {
    if (!selectedDate || !selectedTime || !clinicianId || !clientId) {
      toast({
        title: "Missing information",
        description: "Please select a date and time",
        variant: "destructive"
      });
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysFromToday = differenceInCalendarDays(selectedDate, today);
    
    if (daysFromToday < minDaysAhead) {
      toast({
        title: "Invalid date selection",
        description: `Appointments must be booked at least ${minDaysAhead} day${minDaysAhead !== 1 ? 's' : ''} in advance.`,
        variant: "destructive"
      });
      return;
    }

    setBookingInProgress(true);
    
    try {
      const startTime = selectedTime;
      const endTimeObj = parse(selectedTime, 'HH:mm', new Date());
      endTimeObj.setMinutes(endTimeObj.getMinutes() + 30);
      const endTime = format(endTimeObj, 'HH:mm');
      
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      console.log(`Booking appointment: ${dateStr} at ${startTime} in timezone: ${clientTimeZone}`);
      console.log('Converting from client timezone to database format:', { 
        originalDate: dateStr, 
        originalStartTime: startTime,
        originalEndTime: endTime,
        timezone: clientTimeZone
      });
      
      const startTimestamp = TimeZoneService.toUTCTimestamp(selectedDate, startTime, clientTimeZone);
      const endTimestamp = TimeZoneService.toUTCTimestamp(selectedDate, endTime, clientTimeZone);
      
      console.log('Converted to UTC timestamps:', {
        startTimestamp,
        endTimestamp
      });
      
      const { data, error } = await supabase
        .from('appointments')
        .insert([
          {
            client_id: clientId,
            clinician_id: clinicianId,
            date: dateStr,
            start_time: startTime,
            end_time: endTime,
            appointment_datetime: startTimestamp,
            appointment_end_datetime: endTimestamp,
            source_time_zone: clientTimeZone,
            type: "Therapy Session",
            notes: notes,
            status: 'scheduled'
          }
        ]);
        
      if (error) {
        console.error('Error booking appointment:', error);
        toast({
          title: "Error",
          description: "Failed to book appointment. Please try again.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "Your appointment has been booked successfully!",
        });
        
        setSelectedTime(null);
        setNotes("");
        onAppointmentBooked();
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setBookingInProgress(false);
    }
  };

  const isDayUnavailable = (date: Date) => {
    const dayOfWeek = format(date, 'EEEE');
    return !availabilityBlocks.some(block => block.day_of_week === dayOfWeek);
  };

  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isDateTooSoon = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysFromToday = differenceInCalendarDays(date, today);
    const result = daysFromToday < minDaysAhead;
    console.log('isDateTooSoon check:', {
      date: format(date, 'yyyy-MM-dd'),
      today: format(today, 'yyyy-MM-dd'),
      daysFromToday,
      minDaysAhead,
      isTooSoon: result
    });
    return result;
  };

  const disabledDays = (date: Date) => {
    const unavailable = isDayUnavailable(date);
    const pastDate = isPastDate(date);
    const tooSoon = isDateTooSoon(date);
    
    const today = new Date();
    const daysFromToday = differenceInCalendarDays(date, today);
    if (daysFromToday >= 0 && daysFromToday < 10) {
      console.log('Checking date:', format(date, 'yyyy-MM-dd'), {
        unavailable,
        pastDate,
        tooSoon,
        minDaysAhead,
        daysFromToday,
        disabled: unavailable || pastDate || tooSoon
      });
    }
    
    return unavailable || pastDate || tooSoon;
  };

  const formatTimeDisplay = (timeString: string) => {
    try {
      console.log('Displaying in timezone', clientTimeZone, ':', {
        originalTime: timeString
      });
      
      const formattedTime = TimeZoneService.formatTime(timeString, 'h:mm a', clientTimeZone);
      console.log('Formatted time result:', formattedTime);
      return formattedTime;
    } catch (error) {
      console.error('Error formatting time for display:', error, { timeString, clientTimeZone });
      return TimeZoneService.formatTime(timeString, 'h:mm a');
    }
  };

  const timeZoneDisplay = TimeZoneService.formatTimeZoneDisplay(clientTimeZone);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book an Appointment</DialogTitle>
          <DialogDescription>
            {clinicianName 
              ? `Schedule a session with ${clinicianName}` 
              : 'Select a date and time that works for you'}
          </DialogDescription>
        </DialogHeader>

        {disabled ? (
          <div className="text-center py-6">
            <p className="text-gray-500">You need to complete your assigned documents before booking appointments.</p>
            <p className="text-sm text-gray-400 mt-2">Please check your documents section for any pending forms.</p>
          </div>
        ) : loading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-valorwell-500" />
          </div>
        ) : availabilityBlocks.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-gray-500">No availability found for this therapist.</p>
            <p className="text-sm text-gray-400 mt-2">Please contact the clinic for assistance.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label className="text-sm text-muted-foreground mb-2 block">
                Your time zone: {timeZoneDisplay}
              </Label>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={disabledDays}
                className="rounded-md border mx-auto"
              />
            </div>
            
            {timeSlots.length > 0 ? (
              <div className="mt-4">
                <Label className="text-sm font-medium mb-2 block">
                  Available Times <span className="text-xs text-muted-foreground">({timeZoneDisplay})</span>
                </Label>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {timeSlots.map((slot, index) => (
                    <Button
                      key={index}
                      variant={selectedTime === slot.time ? "default" : "outline"}
                      className={`${!slot.available ? "opacity-50 cursor-not-allowed" : ""}`}
                      disabled={!slot.available}
                      onClick={() => setSelectedTime(slot.time)}
                    >
                      {formatTimeDisplay(slot.time)}
                    </Button>
                  ))}
                </div>
              </div>
            ) : selectedDate ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground">No available times for this date.</p>
              </div>
            ) : null}

            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes or questions for your therapist"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-medium mb-2">Appointment Summary</h3>
              <div className="text-sm space-y-1">
                <p><span className="text-muted-foreground">Date:</span> {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : ''}</p>
                <p>
                  <span className="text-muted-foreground">Time:</span> {selectedTime ? formatTimeDisplay(selectedTime) : ''} 
                  <span className="text-xs text-muted-foreground ml-1">({timeZoneDisplay})</span>
                </p>
                <p><span className="text-muted-foreground">Therapist:</span> {clinicianName}</p>
                <p><span className="text-muted-foreground">Type:</span> Therapy Session</p>
              </div>
            </div>
          </div>
        )}
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleBookAppointment}
            disabled={!selectedDate || !selectedTime || bookingInProgress || disabled}
          >
            {bookingInProgress ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Booking...
              </>
            ) : (
              'Book Appointment'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentBookingDialog;
