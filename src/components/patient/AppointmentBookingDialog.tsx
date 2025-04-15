import React, { useState, useEffect } from 'react';
import { format, parse, addDays, isSameDay, isAfter, differenceInCalendarDays } from 'date-fns';
import { Calendar as CalendarIcon, Clock, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  formatTimeInUserTimeZone, 
  getUserTimeZone, 
  toUTC, 
  fromUTC,
  formatUTCTimeForUser,
  formatTimeZoneDisplay,
  ensureIANATimeZone,
  formatTime12Hour
} from '@/utils/timeZoneUtils';
import { 
  convertClinicianDataToAvailabilityBlocks,
  getClinicianAvailabilityFieldsQuery
} from '@/utils/availabilityUtils';

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
  const [clinicianTimeZone, setClinicianTimeZone] = useState<string>("America/Chicago");
  const [timeGranularity, setTimeGranularity] = useState<string>("half-hour");
  const { toast } = useToast();
  
  const clientTimeZone = ensureIANATimeZone(propTimeZone || getUserTimeZone());

  useEffect(() => {
    if (open) {
      console.log("AppointmentBookingDialog opened with client timezone:", clientTimeZone);
    }
  }, [open, clientTimeZone]);

  useEffect(() => {
    if (!open || !clinicianId) return;
    
    const fetchClinicianData = async () => {
      try {
        const { data, error } = await supabase
          .from('clinicians')
          .select('clinician_timezone')
          .eq('id', clinicianId)
          .single();
          
        if (error) {
          console.error('Error fetching clinician timezone:', error);
        } else if (data?.clinician_timezone) {
          const timezone = ensureIANATimeZone(data.clinician_timezone);
          console.log('Fetched clinician timezone:', timezone);
          setClinicianTimeZone(timezone);
        }
      } catch (error) {
        console.error('Error in fetchClinicianData:', error);
      }
    };
    
    fetchClinicianData();
    
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
        // Fetch clinician data which includes availability in columns
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
        
        // Convert clinician data to availability blocks format
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
    try {
      console.log('Displaying in timezone', clientTimeZone, ':', {
        originalTime: timeString
      });
      
      const formattedTime = formatTimeInUserTimeZone(timeString, clientTimeZone, 'h:mm a');
      console.log('Formatted time result:', formattedTime);
      return formattedTime;
    } catch (error) {
      console.error('Error formatting time for display:', error, { timeString, clientTimeZone });
      return formatTime12Hour(timeString);
    }
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
                  <div className="text-xs text-gray-600 mb-1">
                    {selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : 'Select a date'}
                  </div>
                  
                  {selectedDate && timeSlots.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto p-1">
                      {timeSlots.map((slot, index) => (
                        <div key={index} className="relative">
                          <button
                            type="button"
                            className={`w-full p-2 rounded-md text-sm transition-colors ${
                              selectedTime === slot.time
                                ? 'bg-valorwell-500 text-white'
                                : slot.available
                                ? 'bg-white border border-gray-200 hover:bg-gray-50'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                            onClick={() => {
                              if (slot.available) {
                                setSelectedTime(slot.time);
                              }
                            }}
                            disabled={!slot.available}
                          >
                            {formatTimeDisplay(`${slot.time}:00`)}
                            {selectedTime === slot.time && (
                              <Check className="h-4 w-4 absolute right-2 top-1/2 transform -translate-y-1/2" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : selectedDate ? (
                    <div className="flex items-center justify-center h-[200px] border rounded-md bg-gray-50">
                      <p className="text-sm text-gray-500">No available time slots for this date</p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-[200px] border rounded-md bg-gray-50">
                      <p className="text-sm text-gray-500">Please select a date first</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button 
                  type="button" 
                  onClick={() => {
                    if (selectedTime) {
                      document.querySelector('[data-value="details"]')?.click();
                    }
                  }}
                  disabled={!selectedTime}
                >
                  Continue
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="details" className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Appointment Details</h3>
                <div className="space-y-4 p-4 border rounded-md bg-gray-50">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Date:</span>
                      <span className="ml-2 font-medium">
                        {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : ''}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Time:</span>
                      <span className="ml-2 font-medium">
                        {selectedTime ? formatTimeDisplay(`${selectedTime}:00`) : ''}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Therapist:</span>
                      <span className="ml-2 font-medium">{clinicianName}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Session Type:</span>
                      <span className="ml-2 font-medium">Therapy Session</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <Label htmlFor="notes" className="text-sm font-medium">
                  Notes (optional)
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes or questions for your therapist"
                  className="mt-1"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              
              <div className="flex justify-between">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    document.querySelector('[data-value="calendar"]')?.click();
                  }}
                >
                  Back
                </Button>
                <Button 
                  type="button" 
                  onClick={handleBookAppointment}
                  disabled={bookingInProgress}
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
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentBookingDialog;
