
import React, { useState, useEffect } from 'react';
import { format, parse, addDays, isSameDay, isAfter, differenceInCalendarDays } from 'date-fns';
import { Calendar as CalendarIcon, Clock, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatTimeInUserTimeZone, getUserTimeZone } from '@/utils/timeZoneUtils';

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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';

interface AppointmentBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clinicianId: string | null;
  clinicianName: string | null;
  clientId: string | null;
  onAppointmentBooked: () => void;
  userTimeZone?: string;
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
  userTimeZone: propTimeZone
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [notes, setNotes] = useState<string>("");
  const [availabilityBlocks, setAvailabilityBlocks] = useState<AvailabilityBlock[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [bookingInProgress, setBookingInProgress] = useState<boolean>(false);
  const [minDaysAhead, setMinDaysAhead] = useState<number>(1);
  const { toast } = useToast();
  const userTimeZone = propTimeZone || getUserTimeZone();

  useEffect(() => {
    if (!open || !clinicianId) return;
    
    const fetchSettings = async () => {
      try {
        console.log('Fetching availability settings for clinician ID:', clinicianId);
        const { data: settingsData, error: settingsError } = await supabase.functions.invoke('getavailabilitysettings', {
          body: { clinicianId }
        });
        
        if (settingsError) {
          console.error('Error fetching availability settings:', settingsError);
        } else if (settingsData) {
          const parsedMinDays = Number(settingsData.min_days_ahead);
          console.log('Received availability settings:', settingsData);
          console.log('Parsed min_days_ahead:', parsedMinDays);
          setMinDaysAhead(parsedMinDays || 1);
          console.log('Set minDaysAhead state to:', parsedMinDays || 1);
        } else {
          console.log('No settings data received, using default value of 1 for minDaysAhead');
        }
      } catch (error) {
        console.error('Caught error in fetchSettings:', error);
      }
    };
    
    fetchSettings();
  }, [clinicianId, open]);

  useEffect(() => {
    const fetchAvailability = async () => {
      if (!clinicianId) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('availability')
          .select('*')
          .eq('clinician_id', clinicianId)
          .eq('is_active', true);
          
        if (error) {
          console.error('Error fetching availability:', error);
          toast({
            title: "Error",
            description: "Could not fetch therapist availability",
            variant: "destructive"
          });
        } else {
          setAvailabilityBlocks(data || []);
        }
      } catch (error) {
        console.error('Error:', error);
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
      const startTime = parse(block.start_time, 'HH:mm:ss', new Date());
      const endTime = parse(block.end_time, 'HH:mm:ss', new Date());
      
      let currentTime = startTime;
      while (currentTime < endTime) {
        const timeString = format(currentTime, 'HH:mm');
        slots.push({
          time: timeString,
          available: true
        });
        currentTime = addDays(currentTime, 0);
        currentTime.setMinutes(currentTime.getMinutes() + 30);
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
          const updatedSlots = slots.map(slot => {
            const slotTime = parse(slot.time, 'HH:mm', new Date());
            const slotTimeStr = format(slotTime, 'HH:mm:ss');
            
            const isBooked = data.some(appointment => 
              appointment.start_time === slotTimeStr
            );
            
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
  }, [selectedDate, availabilityBlocks, clinicianId, minDaysAhead]);

  const handleBookAppointment = async () => {
    if (!selectedDate || !selectedTime || !clinicianId || !clientId) {
      toast({
        title: "Missing information",
        description: "Please select a date and time",
        variant: "destructive"
      });
      return;
    }

    // Add validation to ensure the selected date meets the minimum days ahead requirement
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
      
      const { data, error } = await supabase
        .from('appointments')
        .insert([
          {
            client_id: clientId,
            clinician_id: clinicianId,
            date: dateStr,
            start_time: startTime,
            end_time: endTime,
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
    return formatTimeInUserTimeZone(timeString, userTimeZone);
  };

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

        {loading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-valorwell-500" />
          </div>
        ) : availabilityBlocks.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-gray-500">No availability found for this therapist.</p>
            <p className="text-sm text-gray-400 mt-2">Please contact the clinic for assistance.</p>
          </div>
        ) : (
          <Tabs defaultValue="calendar">
            <TabsList className="mb-4">
              <TabsTrigger value="calendar">
                <CalendarIcon className="h-4 w-4 mr-2" />
                Select Date
              </TabsTrigger>
              <TabsTrigger value="details" disabled={!selectedTime}>
                <Clock className="h-4 w-4 mr-2" />
                Appointment Details
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="calendar" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium mb-2">Select Date</h3>
                  <div className="text-xs text-gray-600 mb-1">
                    Minimum advance booking: {minDaysAhead} day{minDaysAhead !== 1 ? 's' : ''}
                  </div>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      console.log('Date selected:', date ? format(date, 'yyyy-MM-dd') : 'none');
                      setSelectedDate(date);
                    }}
                    disabled={disabledDays}
                    className="border rounded-md"
                  />
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2">Available Time Slots</h3>
                  <div className="text-xs text-gray-600 mb-2">
                    All times shown in your local time zone ({userTimeZone})
                  </div>
                  {timeSlots.length > 0 ? (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto p-2">
                      <RadioGroup value={selectedTime || ''} onValueChange={setSelectedTime}>
                        <div className="grid grid-cols-2 gap-2">
                          {timeSlots.map(slot => (
                            <div key={slot.time} className="flex items-center">
                              <RadioGroupItem
                                value={slot.time}
                                id={`time-${slot.time}`}
                                disabled={!slot.available}
                                className="focus:ring-valorwell-500"
                              />
                              <Label
                                htmlFor={`time-${slot.time}`}
                                className={`ml-2 ${!slot.available ? 'line-through text-gray-400' : ''}`}
                              >
                                {formatTimeDisplay(slot.time)}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </RadioGroup>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[300px] border rounded-md p-4 bg-gray-50">
                      <p className="text-gray-500">
                        {selectedDate 
                          ? 'No available time slots for this date' 
                          : 'Please select a date to view available times'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  onClick={() => {
                    if (selectedTime) {
                      const tabsList = document.querySelector('[role="tablist"]');
                      if (tabsList) {
                        const detailsTab = tabsList.querySelector('[value="details"]');
                        if (detailsTab) {
                          (detailsTab as HTMLElement).click();
                        }
                      }
                    }
                  }}
                  disabled={!selectedTime}
                >
                  Continue
                </Button>
              </DialogFooter>
            </TabsContent>
            
            <TabsContent value="details" className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Notes (Optional)</h3>
                <Textarea
                  placeholder="Add any notes or questions for your therapist"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="text-sm font-medium mb-3">Appointment Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Date:</span>
                    <span className="font-medium">
                      {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : ''}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Time:</span>
                    <span className="font-medium">
                      {selectedTime ? formatTimeDisplay(selectedTime) : ''}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Type:</span>
                    <span className="font-medium">Therapy Session</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Provider:</span>
                    <span className="font-medium">{clinicianName || 'Your therapist'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Time Zone:</span>
                    <span className="font-medium">{userTimeZone}</span>
                  </div>
                </div>
              </div>
              
              <DialogFooter className="flex justify-between items-center pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    const tabsList = document.querySelector('[role="tablist"]');
                    if (tabsList) {
                      const calendarTab = tabsList.querySelector('[value="calendar"]');
                      if (calendarTab) {
                        (calendarTab as HTMLElement).click();
                      }
                    }
                  }}
                >
                  Back
                </Button>
                <Button 
                  onClick={handleBookAppointment}
                  disabled={bookingInProgress}
                >
                  {bookingInProgress ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Booking...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Confirm Booking
                    </>
                  )}
                </Button>
              </DialogFooter>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentBookingDialog;
