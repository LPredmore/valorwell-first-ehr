
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { useAvailability } from '@/hooks/useAvailability';
import { useToast } from '@/components/ui/use-toast';
import TimeField from '@/components/ui/time-field';
import { TimeZoneService } from '@/utils/timezone';
import { DateTime } from 'luxon';
import { DayOfWeek } from '@/types/calendar';

interface SingleAvailabilityDialogProps {
  clinicianId?: string;
  date?: Date;
  isOpen: boolean;
  userTimeZone: string;
  onClose: () => void;
  onAvailabilityCreated?: () => void;
}

const SingleAvailabilityDialog: React.FC<SingleAvailabilityDialogProps> = ({
  clinicianId,
  date: initialDate,
  isOpen,
  userTimeZone,
  onClose,
  onAvailabilityCreated
}) => {
  const [date, setDate] = useState<Date | undefined>(initialDate || new Date());
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('17:00');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { createSlot } = useAvailability(clinicianId || null);
  const { toast } = useToast();
  
  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setStartTime('09:00');
      setEndTime('17:00');
      setDate(initialDate || new Date());
      setErrors({});
    }
  }, [isOpen, initialDate]);
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!date) {
      newErrors.date = 'Please select a date';
    }
    
    if (!startTime) {
      newErrors.startTime = 'Please select a start time';
    }
    
    if (!endTime) {
      newErrors.endTime = 'Please select an end time';
    } else if (startTime >= endTime) {
      newErrors.endTime = 'End time must be after start time';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async () => {
    if (!validateForm() || !clinicianId || !date) return;
    
    setIsSubmitting(true);
    
    try {
      // Map day of week to string format
      const dayOfWeekNum = date.getDay();
      const daysOfWeek: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayOfWeek = daysOfWeek[dayOfWeekNum];
      
      // Create availability slot
      const result = await createSlot(
        dayOfWeek,
        startTime,
        endTime,
        false, // Not recurring
        undefined,
        userTimeZone,
        date
      );
      
      if (result.success) {
        toast({
          title: 'Availability Added',
          description: `Availability slot added for ${DateTime.fromJSDate(date).setZone(userTimeZone).toFormat('EEE, MMM d, yyyy')}`,
        });
        
        if (onAvailabilityCreated) {
          onAvailabilityCreated();
        }
        
        onClose();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to create availability slot',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Add Single Day Availability
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col gap-4">
          <div>
            <Label>Select Date</Label>
            <div className="border rounded-md p-2 mt-2">
              <CalendarComponent
                mode="single"
                selected={date}
                onSelect={setDate}
                className="mx-auto"
              />
            </div>
            {errors.date && <p className="text-sm text-red-500 mt-1">{errors.date}</p>}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <TimeField
              label="Start Time"
              value={startTime}
              onChange={setStartTime}
              error={errors.startTime}
            />
            
            <TimeField
              label="End Time"
              value={endTime}
              onChange={setEndTime}
              error={errors.endTime}
            />
          </div>
          
          <div className="text-sm text-gray-500">
            Time Zone: {TimeZoneService.formatTimeZoneDisplay(userTimeZone)}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Availability'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SingleAvailabilityDialog;
