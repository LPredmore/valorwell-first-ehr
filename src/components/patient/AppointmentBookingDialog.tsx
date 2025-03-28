
import React, { useState, useEffect } from 'react';
import { format, parse, addDays, isSameDay } from 'date-fns';
import { Calendar as CalendarIcon, Clock, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

const AppointmentBookingDialog: React.FC<AppointmentBookingDialogProps> = ({
  open,
  onOpenChange,
  clinicianId,
  clinicianName,
  clientId,
  onAppointmentBooked
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [appointmentType, setAppointmentType] = useState<string>("Therapy Session");
  const [notes, setNotes] = useState<string>("");
  const [availabilityBlocks, setAvailabilityBlocks] = useState<AvailabilityBlock[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [bookingInProgress, setBookingInProgress] = useState<boolean>(false);
  const { toast } = useToast();

  // Fetch availability for the selected clinician
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

  // Generate time slots when date is selected
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
      
      // Create 30-minute slots
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

    // Check for existing appointments to mark slots as unavailable
    const checkExistingAppointments = async () => {
      if (!selectedDate || !clinicianId) return;
      
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
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
          // Mark any slots that overlap with existing appointments as unavailable
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
  }, [selectedDate, availabilityBlocks, clinicianId]);

  const handleBookAppointment = async () => {
    if (!selectedDate || !selectedTime || !clinicianId || !clientId) {
      toast({
        title: "Missing information",
        description: "Please select a date, time, and appointment type",
        variant: "destructive"
      });
      return;
    }

    setBookingInProgress(true);
    
    try {
      // Convert time string to start and end times (30 min appointment)
      const startTime = selectedTime;
      const endTimeObj = parse(selectedTime, 'HH:mm', new Date());
      endTimeObj.setMinutes(endTimeObj.getMinutes() + 30);
      const endTime = format(endTimeObj, 'HH:mm');
      
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      // Insert the appointment in the database
      const { data, error } = await supabase
        .from('appointments')
        .insert([
          {
            client_id: clientId,
            clinician_id: clinicianId,
            date: dateStr,
            start_time: startTime,
            end_time: endTime,
            type: appointmentType,
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
        
        // Reset form and close dialog
        setSelectedTime(null);
        setAppointmentType("Therapy Session");
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

  // Disable dates that don't have availability
  const isDayUnavailable = (date: Date) => {
    const dayOfWeek = format(date, 'EEEE');
    return !availabilityBlocks.some(block => block.day_of_week === dayOfWeek);
  };

  // Check if date is in the past
  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const disabledDays = (date: Date) => {
    return isDayUnavailable(date) || isPastDate(date);
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
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={disabledDays}
                    className="border rounded-md"
                  />
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2">Available Time Slots</h3>
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
                                {format(parse(slot.time, 'HH:mm', new Date()), 'h:mm a')}
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
                <h3 className="text-sm font-medium mb-2">Appointment Type</h3>
                <RadioGroup value={appointmentType} onValueChange={setAppointmentType} className="space-y-2">
                  <div className="flex items-center">
                    <RadioGroupItem value="Therapy Session" id="type-therapy" />
                    <Label htmlFor="type-therapy" className="ml-2">Therapy Session</Label>
                  </div>
                  <div className="flex items-center">
                    <RadioGroupItem value="Initial Consultation" id="type-consultation" />
                    <Label htmlFor="type-consultation" className="ml-2">Initial Consultation</Label>
                  </div>
                  <div className="flex items-center">
                    <RadioGroupItem value="Follow-up" id="type-followup" />
                    <Label htmlFor="type-followup" className="ml-2">Follow-up</Label>
                  </div>
                </RadioGroup>
              </div>
              
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
                      {selectedTime 
                        ? format(parse(selectedTime, 'HH:mm', new Date()), 'h:mm a') 
                        : ''}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Type:</span>
                    <span className="font-medium">{appointmentType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Provider:</span>
                    <span className="font-medium">{clinicianName || 'Your therapist'}</span>
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
