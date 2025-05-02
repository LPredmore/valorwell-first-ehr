import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import { Calendar as CalendarDatepicker } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TimeZoneService } from '@/utils/timeZoneService';
import { DateTime } from 'luxon';

interface EditAppointmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: any;
  onAppointmentUpdated: (appointment: any) => void;
}

/**
 * EditAppointmentDialog - A dialog for editing appointment details
 */
const EditAppointmentDialog: React.FC<EditAppointmentDialogProps> = ({
  isOpen,
  onClose,
  appointment,
  onAppointmentUpdated,
}) => {
  const [date, setDate] = useState<Date | undefined>(appointment?.date ? new Date(appointment.date) : undefined);
  const [time, setTime] = useState(appointment?.time || '');
  const [type, setType] = useState(appointment?.type || '');
  const [notes, setNotes] = useState(appointment?.notes || '');
  
  useEffect(() => {
    if (appointment) {
      // Use fromUTCTimestamp to convert the UTC timestamp to the local DateTime
      const localDateTime = TimeZoneService.fromUTCTimestamp(appointment.start_time, TimeZoneService.getLocalTimeZone());
      
      setDate(localDateTime.toJSDate());
      setTime(localDateTime.toFormat('HH:mm'));
      setType(appointment.type || '');
      setNotes(appointment.notes || '');
    }
  }, [appointment]);

  const handleSubmit = () => {
    if (!date) {
      alert('Please select a date');
      return;
    }
    if (!time) {
      alert('Please select a time');
      return;
    }

    // Convert the local date and time to a UTC timestamp
    const timeZone = TimeZoneService.getLocalTimeZone();
    const dateStr = format(date, 'yyyy-MM-dd');
    const utcTimestamp = TimeZoneService.toUTCTimestamp(dateStr, time, timeZone);

    const updatedAppointment = {
      ...appointment,
      date: dateStr,
      time: time,
      start_time: utcTimestamp,
      type: type,
      notes: notes,
    };

    onAppointmentUpdated(updatedAppointment);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Appointment</DialogTitle>
          <DialogDescription>
            Make changes to your upcoming appointment.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right">
              Date
            </Label>
            <Popover className="col-span-3">
              <PopoverTrigger asChild>
                <Button
                  variant={'outline'}
                  className={cn(
                    'w-[240px] justify-start text-left font-normal',
                    !date && 'text-muted-foreground'
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                <CalendarDatepicker
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(date) =>
                    date < new Date()
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="time" className="text-right">
              Time
            </Label>
            <Input
              id="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="col-span-3"
              type="time"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">
              Type
            </Label>
            <Input
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="notes" className="text-right">
              Notes
            </Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditAppointmentDialog;
