
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { SelectSingleEventHandler } from 'react-day-picker';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CalendarIcon, Clock } from 'lucide-react';
import { CalendarService } from '@/services/calendarService';
import { AvailabilityService } from '@/services/availabilityService';
import { formatTimeZoneDisplay, formatTime12Hour } from '@/utils/timeZoneUtils';
import { Card, CardContent } from '@/components/ui/card';
import { format, startOfToday, addDays, isToday, isSameDay } from 'date-fns';
import { useUserTimeZone } from '@/hooks/useUserTimeZone';
import { DateTime } from 'luxon';

interface BookAppointmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  clinicianId: string;
  onAppointmentBooked?: () => void;
}

interface TimeSlot {
  start: string;
  end: string;
  startFormatted: string;
  endFormatted: string;
}

const BookAppointmentDialog: React.FC<BookAppointmentDialogProps> = ({
  isOpen,
  onClose,
  clinicianId,
  onAppointmentBooked
}) => {
  const { toast } = useToast();
  const { timeZone } = useUserTimeZone(clinicianId);
  const [isLoading, setIsLoading] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  
  // Settings from the clinician's availability
  const [minNoticeHours, setMinNoticeHours] = useState<number>(24);
  const [maxAdvanceDays, setMaxAdvanceDays] = useState<number>(90);

  // Fetch available dates when dialog opens
  useEffect(() => {
    const fetchAvailabilitySettings = async () => {
      if (!isOpen || !clinicianId) return;
      
      setIsLoading(true);
      try {
        const settings = await AvailabilityService.getSettings(clinicianId);
        if (settings) {
          setMinNoticeHours(settings.minNoticeHours);
          setMaxAdvanceDays(settings.maxAdvanceDays);
        }

        // Get available dates (this is a simplified version - actual implementation would be more complex)
        const today = startOfToday();
        const maxDate = addDays(today, settings?.maxAdvanceDays || 90);
        
        // Fetch dates with availability
        // This is a placeholder - in a real implementation, you would query the database
        const datesWithAvailability: Date[] = [];
        
        setAvailableDates(datesWithAvailability);
      } catch (error) {
        console.error('Error fetching availability settings:', error);
        toast({
          title: 'Error',
          description: 'Failed to load available appointment times',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailabilitySettings();
  }, [clinicianId, isOpen, toast]);

  // When user selects a date, fetch available time slots for that date
  const handleDateSelect: SelectSingleEventHandler = (day) => {
    if (!day) return;
    
    setSelectedDate(day);
    setSelectedTimeSlot(null);
    fetchAvailableTimeSlots(day);
  };

  const fetchAvailableTimeSlots = async (date: Date) => {
    if (!clinicianId) return;
    
    setIsLoading(true);
    try {
      // This is a simplified implementation - in reality, you would:
      // 1. Get the clinician's availability for this day
      // 2. Check against existing appointments
      // 3. Apply the minimum notice period
      // 4. Return available time slots
      
      // Placeholder implementation
      const mockTimeSlots: TimeSlot[] = [
        {
          start: `${format(date, 'yyyy-MM-dd')}T09:00:00`,
          end: `${format(date, 'yyyy-MM-dd')}T10:00:00`,
          startFormatted: '9:00 AM',
          endFormatted: '10:00 AM'
        },
        {
          start: `${format(date, 'yyyy-MM-dd')}T10:00:00`,
          end: `${format(date, 'yyyy-MM-dd')}T11:00:00`,
          startFormatted: '10:00 AM',
          endFormatted: '11:00 AM'
        },
        {
          start: `${format(date, 'yyyy-MM-dd')}T14:00:00`,
          end: `${format(date, 'yyyy-MM-dd')}T15:00:00`,
          startFormatted: '2:00 PM',
          endFormatted: '3:00 PM'
        }
      ];
      
      setTimeSlots(mockTimeSlots);
    } catch (error) {
      console.error('Error fetching available time slots:', error);
      toast({
        title: 'Error',
        description: 'Failed to load available time slots',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTimeSlotSelect = (slot: TimeSlot) => {
    setSelectedTimeSlot(slot);
  };

  const handleBookAppointment = async () => {
    if (!clinicianId || !selectedDate || !selectedTimeSlot) return;
    
    setIsBooking(true);
    try {
      // Here you would implement the actual booking logic
      // This would typically create an appointment record
      
      // Placeholder for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'Success',
        description: 'Your appointment has been booked successfully'
      });
      
      if (onAppointmentBooked) {
        onAppointmentBooked();
      }
      
      onClose();
    } catch (error) {
      console.error('Error booking appointment:', error);
      toast({
        title: 'Error',
        description: 'Failed to book appointment',
        variant: 'destructive'
      });
    } finally {
      setIsBooking(false);
    }
  };

  // Determine the earliest bookable date based on minimum notice period
  const earliestBookableDate = DateTime.now().plus({ hours: minNoticeHours }).toJSDate();
  
  // Determine the latest bookable date based on maximum advance days
  const latestBookableDate = DateTime.now().plus({ days: maxAdvanceDays }).toJSDate();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <CalendarIcon className="h-5 w-5 mr-2" />
            Book an Appointment
            {timeZone && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({formatTimeZoneDisplay(timeZone)})
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {isLoading && !selectedDate ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-6">
            <div className="space-y-1">
              <h3 className="text-sm font-medium">1. Select a Date</h3>
              <p className="text-xs text-gray-500">
                Appointments available between{' '}
                {isToday(earliestBookableDate) ? 'today' : format(earliestBookableDate, 'MMM d, yyyy')} and{' '}
                {format(latestBookableDate, 'MMM d, yyyy')}
              </p>
              <div className="border rounded-md p-2">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  disabled={(date) => {
                    // Disable dates before earliest bookable date or after latest bookable date
                    return (
                      date < earliestBookableDate || 
                      date > latestBookableDate || 
                      // This is where you would check available dates (simplified for now)
                      false
                    );
                  }}
                  className="rounded-md bg-white w-full"
                />
              </div>
            </div>

            {selectedDate && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium">2. Select a Time Slot</h3>
                {isLoading ? (
                  <div className="flex justify-center items-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : timeSlots.length === 0 ? (
                  <div className="text-center text-gray-500 py-4">
                    No available time slots for {format(selectedDate, 'MMMM d, yyyy')}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {timeSlots.map((slot, index) => (
                      <Card 
                        key={index}
                        className={`cursor-pointer transition ${
                          selectedTimeSlot === slot ? 'border-2 border-primary' : ''
                        }`}
                        onClick={() => handleTimeSlotSelect(slot)}
                      >
                        <CardContent className="flex items-center justify-center py-4">
                          <Clock className="h-4 w-4 mr-2 text-gray-500" />
                          <span>{slot.startFormatted} - {slot.endFormatted}</span>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedDate && selectedTimeSlot && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">3. Review & Confirm</h3>
                <div className="bg-gray-50 rounded-md p-4">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-gray-500">Date:</div>
                    <div>{format(selectedDate, 'MMMM d, yyyy')}</div>
                    <div className="text-gray-500">Time:</div>
                    <div>{selectedTimeSlot.startFormatted} - {selectedTimeSlot.endFormatted}</div>
                    <div className="text-gray-500">Time Zone:</div>
                    <div>{formatTimeZoneDisplay(timeZone || 'UTC')}</div>
                    <div className="text-gray-500">Duration:</div>
                    <div>1 hour</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            disabled={isBooking}
            className="mr-2"
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleBookAppointment}
            disabled={!selectedDate || !selectedTimeSlot || isBooking || isLoading}
          >
            {isBooking ? (
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

export default BookAppointmentDialog;
