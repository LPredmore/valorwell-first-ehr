import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { SelectSingleEventHandler } from 'react-day-picker';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CalendarIcon, Clock } from 'lucide-react';
import { AvailabilityService } from '@/services/availabilityService';
import { formatTimeZoneDisplay, formatTime12Hour } from '@/utils/timeZoneUtils';
import { Card, CardContent } from '@/components/ui/card';
import { format, startOfToday, addDays, isToday } from 'date-fns';
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

  const [minNoticeHours, setMinNoticeHours] = useState<number>(24);
  const [maxAdvanceDays, setMaxAdvanceDays] = useState<number>(90);

  useEffect(() => {
    const fetchAvailabilitySettingsAndDates = async () => {
      if (!isOpen || !clinicianId) return;

      setIsLoading(true);
      try {
        const settings = await AvailabilityService.getSettings(clinicianId);
        if (settings) {
          setMinNoticeHours(settings.minNoticeHours);
          setMaxAdvanceDays(settings.maxAdvanceDays);
        }

        const today = startOfToday();
        const maxDate = addDays(today, settings?.maxAdvanceDays ?? 90);
        const candidateDates: Date[] = [];
        for (let d = today; d <= maxDate; d = addDays(d, 1)) {
          candidateDates.push(d);
        }

        const results = await Promise.all(
          candidateDates.map(async (date) => {
            const isoDate = DateTime.fromJSDate(date).toISODate() ?? '';
            const slots = await AvailabilityService.calculateAvailableSlots(clinicianId, isoDate);
            return slots.length > 0 ? date : null;
          })
        );
        setAvailableDates(results.filter(Boolean) as Date[]);
      } catch (error) {
        console.error('Error fetching availability settings/dates:', error);
        toast({
          title: 'Error',
          description: 'Failed to load available appointment dates',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen && clinicianId) {
      setSelectedTimeSlot(null);
      setTimeSlots([]);
      setSelectedDate(undefined);
      setAvailableDates([]);
      fetchAvailabilitySettingsAndDates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clinicianId, isOpen]);

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
      const isoDate = DateTime.fromJSDate(date).toISODate() ?? '';
      const slots = await AvailabilityService.calculateAvailableSlots(clinicianId, isoDate);

      const formatted: TimeSlot[] = slots.map((slot) => {
        const startDt = DateTime.fromISO(slot.start, { zone: timeZone });
        const endDt = DateTime.fromISO(slot.end, { zone: timeZone });
        return {
          start: slot.start,
          end: slot.end,
          startFormatted: formatTime12Hour(startDt.toFormat("HH:mm")),
          endFormatted: formatTime12Hour(endDt.toFormat("HH:mm")),
        };
      });
      setTimeSlots(formatted);
    } catch (error) {
      console.error('Error fetching available time slots:', error);
      toast({
        title: 'Error',
        description: 'Failed to load available time slots',
        variant: 'destructive'
      });
      setTimeSlots([]);
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

  const earliestBookableDate = DateTime.now().plus({ hours: minNoticeHours }).toJSDate();
  const latestBookableDate = DateTime.now().plus({ days: maxAdvanceDays }).toJSDate();

  const isDateAvailable = (date: Date) =>
    availableDates.some(d => d.getFullYear() === date.getFullYear() && d.getMonth() === date.getMonth() && d.getDate() === date.getDate());

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
                    return (
                      date < earliestBookableDate ||
                      date > latestBookableDate ||
                      !isDateAvailable(date)
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
                    <div>
                      {(() => {
                        const d1 = DateTime.fromISO(selectedTimeSlot.start, { zone: timeZone });
                        const d2 = DateTime.fromISO(selectedTimeSlot.end, { zone: timeZone });
                        return `${d2.diff(d1, 'minutes').minutes} minutes`;
                      })()}
                    </div>
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
