
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { TimePickerInput } from '@/components/ui/time-picker';
import { toast } from '@/hooks/use-toast';
import { DateTime } from 'luxon';
import { TimeZoneService } from '@/utils/timeZoneService';
import { AvailabilityMutationService } from '@/services/AvailabilityMutationService';

interface SingleAvailabilityDialogProps {
  isOpen: boolean;
  onClose: () => void;
  clinicianId: string;
  userTimeZone: string;
  onAvailabilityCreated: () => void;
}

const SingleAvailabilityDialog: React.FC<SingleAvailabilityDialogProps> = ({
  isOpen,
  onClose,
  clinicianId,
  userTimeZone,
  onAvailabilityCreated
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('17:00');

  const handleSubmit = async () => {
    if (!selectedDate) {
      toast({
        title: "Select Date",
        description: "Please select a date for the availability slot",
        variant: "destructive"
      });
      return;
    }

    try {
      const date = DateTime.fromJSDate(selectedDate).setZone(userTimeZone);
      
      const response = await AvailabilityMutationService.createAvailabilitySlot(
        clinicianId,
        {
          startTime: `${date.toFormat('yyyy-MM-dd')}T${startTime}`,
          endTime: `${date.toFormat('yyyy-MM-dd')}T${endTime}`,
          title: 'Available (Single)',
          recurring: false,
        }
      );

      if (!response.success) {
        throw new Error(response.error);
      }

      toast({
        title: "Success",
        description: "Single day availability has been added",
      });
      
      onAvailabilityCreated();
      onClose();
    } catch (error) {
      console.error('Error creating single availability:', error);
      toast({
        title: "Error",
        description: "Failed to create availability slot",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Single Day Availability</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-2">
            <label>Select Date</label>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              initialFocus
              disabled={(date) => date < new Date()}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label>Start Time</label>
              <TimePickerInput value={startTime} onChange={setStartTime} />
            </div>
            <div className="flex flex-col gap-2">
              <label>End Time</label>
              <TimePickerInput value={endTime} onChange={setEndTime} />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Add Availability</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SingleAvailabilityDialog;
