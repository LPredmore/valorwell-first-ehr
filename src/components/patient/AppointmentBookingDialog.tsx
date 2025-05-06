
import React, { useState, useEffect } from 'react';
import { format, parse, addDays, isSameDay, isAfter, differenceInCalendarDays } from 'date-fns';
import { Calendar as CalendarIcon, Clock, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getUserTimeZone } from '@/utils/timeZoneUtils';
import { TimeZoneService } from '@/utils/timeZoneService';
import { DateTime } from 'luxon';

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
  clinician_id: string;
  start_at: string; // UTC timestamp
  end_at: string;   // UTC timestamp
  is_active: boolean;
}

interface TimeSlot {
  utcStart: string;   // UTC ISO string for start
  utcEnd: string;     // UTC ISO string for end
  localTime: string;  // Formatted local time for display
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
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [notes, setNotes] = useState<string>("");
  const [availabilityBlocks, setAvailabilityBlocks] = useState<AvailabilityBlock[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [bookingInProgress, setBookingInProgress] = useState<boolean>(false);
  const [minDaysAhead, setMinDaysAhead] = useState<number>(1);
  const [clinicianTimeZone, setClinicianTimeZone] = useState<string>(TimeZoneService.DEFAULT_TIMEZONE);
  const { toast } = useToast();
  
  // Get user's timezone safely
  const userTimeZone = TimeZoneService.ensureIANATimeZone(
    propTimeZone || getUserTimeZone()
  );

  // When dialog opens, fetch clinician's timezone and availability settings
  useEffect(() => {
    if (!open || !clinicianId) return;
    
    const fetchClinicianData = async () => {
      try {
        // Get clinician's timezone
        const { data: clinicianData, error: clinicianError } = await supabase
          .from('clinicians')
          .select('clinician_time_zone')
          .eq('id', clinicianId)
          .single();
          
        if (!clinicianError && clinicianData) {
          const safeTimezone = TimeZoneService.ensureIANATimeZone(
            clinicianData.clinician_time_zone
          );
          setClinicianTimeZone(safeTimezone);
          console.log(`Using clinician timezone: ${safeTimezone}`);
        } else {
          console.log(`No clinician timezone found, using default: ${TimeZoneService.DEFAULT_TIMEZONE}`);
        }
        
        // Get availability settings
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
        console.error('Caught error fetching clinician data:', error);
      }
    };
    
    fetchClinicianData();
  }, [clinicianId, open]);

  // Fetch availability blocks from the database
  useEffect(() => {
    const fetchAvailability = async () => {
      if (!clinicianId) return;
      
      setLoading(true);
      try {
        // Get availability blocks using UTC timestamps
        const { data, error } = await supabase
          .from('availability_blocks')
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
          console.log('Retrieved availability blocks:', data);
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

  // Generate time slots when a date is selected and we have availability data
  useEffect(() => {
    if (!selectedDate || !availabilityBlocks.length) {
      setTimeSlots([]);
      return;
    }

    // Convert selected date to DateTime for easier manipulation
    const selectedDateLuxon = DateTime.fromJSDate(selectedDate).setZone(userTimeZone).startOf('day');
    console.log(`Generating slots for date: ${selectedDateLuxon.toFormat('yyyy-MM-dd')}`);
    
    // Check if date is too soon based on minDaysAhead
    const today = DateTime.now().setZone(userTimeZone).startOf('day');
    const daysFromToday = selectedDateLuxon.diff(today, 'days').days;
    
    console.log('Days from today:', daysFromToday, 'minDaysAhead:', minDaysAhead);
    
    if (daysFromToday < minDaysAhead) {
      console.log('Selected date is too soon, should be blocked');
      setTimeSlots([]);
      return;
    }
    
    const slots: TimeSlot[] = [];
    
    // Process availability blocks for the selected day
    availabilityBlocks.forEach(block => {
      // Convert UTC block to clinician's timezone and check if it's on this day of week
      const blockStartLocal = TimeZoneService.fromUTC(block.start_at, clinicianTimeZone);
      const blockEndLocal = TimeZoneService.fromUTC(block.end_at, clinicianTimeZone);
      
      const blockDayOfWeek = blockStartLocal.weekday; // 1-7 (Monday to Sunday in Luxon)
      const selectedDayOfWeek = selectedDateLuxon.weekday;
      
      if (blockDayOfWeek === selectedDayOfWeek) {
        console.log(`Found block for day ${blockDayOfWeek}:`, 
          `${blockStartLocal.toFormat('HH:mm')} - ${blockEndLocal.toFormat('HH:mm')}`);
        
        // Generate 30-minute slots for this block
        let slotStart = blockStartLocal;
        while (slotStart < blockEndLocal) {
          const slotEnd = slotStart.plus({ minutes: 30 });
          
          // Create slot with user's time
          const slotInUserTZ = slotStart.setZone(userTimeZone);
          
          // Map this time to the actual date selected
          const slotStartOnSelectedDate = selectedDateLuxon
            .set({
              hour: slotInUserTZ.hour,
              minute: slotInUserTZ.minute,
              second: 0,
              millisecond: 0
            });
          
          const slotEndOnSelectedDate = slotStartOnSelectedDate.plus({ minutes: 30 });
          
          // Convert back to UTC for storage
          const slotStartUTC = slotStartOnSelectedDate.toUTC();
          const slotEndUTC = slotEndOnSelectedDate.toUTC();
          
          slots.push({
            utcStart: slotStartUTC.toISO(),
            utcEnd: slotEndUTC.toISO(),
            localTime: slotInUserTZ.toFormat('h:mm a'),
            available: true
          });
          
          slotStart = slotEnd;
        }
      }
    });
    
    // Sort slots by time
    slots.sort((a, b) => a.utcStart.localeCompare(b.utcStart));
    
    // Check if any slots are already booked
    const checkExistingAppointments = async () => {
      if (!selectedDate || !clinicianId) return;
      
      try {
        const selectedDateISO = selectedDateLuxon.toISO();
        const nextDayISO = selectedDateLuxon.plus({ days: 1 }).toISO();
        
        console.log('Checking appointments between:', selectedDateISO, 'and', nextDayISO);
        
        const { data, error } = await supabase
          .from('appointments')
          .select('*')
          .eq('clinician_id', clinicianId)
          .eq('status', 'scheduled')
          .gte('start_at', selectedDateISO)
          .lt('start_at', nextDayISO);
          
        if (error) {
          console.error('Error fetching appointments:', error);
        } else if (data && data.length > 0) {
          console.log('Found existing appointments:', data);
          
          // Mark booked slots as unavailable
          const updatedSlots = slots.map(slot => {
            const isBooked = data.some(appointment => {
              return new Date(appointment.start_at).getTime() === new Date(slot.utcStart).getTime();
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
        console.error('Error checking existing appointments:', error);
        setTimeSlots(slots); // Use slots without availability check on error
      }
    };
    
    checkExistingAppointments();
  }, [selectedDate, availabilityBlocks, userTimeZone, clinicianId, minDaysAhead, clinicianTimeZone]);

  const handleBookAppointment = async () => {
    if (!selectedDate || !selectedTimeSlot || !clinicianId || !clientId) {
      toast({
        title: "Missing information",
        description: "Please select a date and time",
        variant: "destructive"
      });
      return;
    }

    // Add validation to ensure the selected date meets the minimum days ahead requirement
    const today = DateTime.now().setZone(userTimeZone).startOf('day');
    const selectedDay = DateTime.fromJSDate(selectedDate).setZone(userTimeZone).startOf('day');
    const daysFromToday = selectedDay.diff(today, 'days').days;
    
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
      // Use UTC timestamps for database storage
      const { data, error } = await supabase
        .from('appointments')
        .insert([
          {
            client_id: clientId,
            clinician_id: clinicianId,
            start_at: selectedTimeSlot.utcStart,
            end_at: selectedTimeSlot.utcEnd,
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
        
        setSelectedTimeSlot(null);
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
    const selectedDay = DateTime.fromJSDate(date).setZone(userTimeZone);
    const dayOfWeek = selectedDay.weekday; // 1-7 (Monday to Sunday in Luxon)
    
    // Check if day is available in any block
    const hasAvailability = availabilityBlocks.some(block => {
      const blockStart = TimeZoneService.fromUTC(block.start_at, clinicianTimeZone);
      return blockStart.weekday === dayOfWeek;
    });
    
    return !hasAvailability;
  };

  const isPastDate = (date: Date) => {
    const today = DateTime.now().setZone(userTimeZone).startOf('day');
    const testDate = DateTime.fromJSDate(date).setZone(userTimeZone).startOf('day');
    return testDate < today;
  };

  const isDateTooSoon = (date: Date) => {
    const today = DateTime.now().setZone(userTimeZone).startOf('day');
    const testDate = DateTime.fromJSDate(date).setZone(userTimeZone).startOf('day');
    const daysFromToday = testDate.diff(today, 'days').days;
    return daysFromToday < minDaysAhead;
  };

  const disabledDays = (date: Date) => {
    const unavailable = isDayUnavailable(date);
    const pastDate = isPastDate(date);
    const tooSoon = isDateTooSoon(date);
    
    // For debugging near-term dates
    const testDate = DateTime.fromJSDate(date).setZone(userTimeZone);
    const today = DateTime.now().setZone(userTimeZone).startOf('day');
    const daysFromToday = testDate.diff(today, 'days').days;
    
    if (daysFromToday >= 0 && daysFromToday < 10) {
      console.log('Checking date:', testDate.toFormat('yyyy-MM-dd'), {
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
              <TabsTrigger value="details" disabled={!selectedTimeSlot}>
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
                      setSelectedTimeSlot(null); // Reset time slot selection when date changes
                    }}
                    disabled={disabledDays}
                    className="border rounded-md"
                  />
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2">Available Time Slots</h3>
                  <div className="text-xs text-gray-600 mb-2">
                    All times shown in {TimeZoneService.getTimeZoneDisplayName(userTimeZone)}
                  </div>
                  {timeSlots.length > 0 ? (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto p-2">
                      <RadioGroup 
                        value={selectedTimeSlot?.utcStart || ''} 
                        onValueChange={(value) => {
                          const slot = timeSlots.find(slot => slot.utcStart === value);
                          setSelectedTimeSlot(slot || null);
                        }}
                      >
                        <div className="grid grid-cols-2 gap-2">
                          {timeSlots.map(slot => (
                            <div key={slot.utcStart} className="flex items-center">
                              <RadioGroupItem
                                value={slot.utcStart}
                                id={`time-${slot.utcStart}`}
                                disabled={!slot.available}
                                className="focus:ring-valorwell-500"
                              />
                              <Label
                                htmlFor={`time-${slot.utcStart}`}
                                className={`ml-2 ${!slot.available ? 'line-through text-gray-400' : ''}`}
                              >
                                {slot.localTime}
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
                    if (selectedTimeSlot) {
                      const tabsList = document.querySelector('[role="tablist"]');
                      if (tabsList) {
                        const detailsTab = tabsList.querySelector('[value="details"]');
                        if (detailsTab) {
                          (detailsTab as HTMLElement).click();
                        }
                      }
                    }
                  }}
                  disabled={!selectedTimeSlot}
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
                      {selectedTimeSlot?.localTime || ''}
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
                    <span className="font-medium">{TimeZoneService.getTimeZoneDisplayName(userTimeZone)}</span>
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
