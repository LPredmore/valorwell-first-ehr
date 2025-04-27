
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { TimePickerInput } from '@/components/ui/time-picker';
import { toast } from '@/hooks/use-toast';
import { DateTime } from 'luxon';
import { TimeZoneService } from '@/utils/timeZoneService';
import { AvailabilityMutationService } from '@/services/AvailabilityMutationService';
import { useCalendarAuth } from '@/hooks/useCalendarAuth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';

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
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  const { currentUserId, refreshAuth } = useCalendarAuth();
  const validTimeZone = TimeZoneService.ensureIANATimeZone(userTimeZone);

  useEffect(() => {
    // Reset form error when dialog opens/closes
    if (isOpen) {
      setFormError(null);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!selectedDate) {
      toast({
        title: "Select Date",
        description: "Please select a date for the availability slot",
        variant: "destructive"
      });
      return;
    }

    // Validate that end time is after start time
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    if (endHour < startHour || (endHour === startHour && endMinute <= startMinute)) {
      toast({
        title: "Invalid Time Range",
        description: "End time must be after start time",
        variant: "destructive"
      });
      return;
    }

    setFormError(null);
    
    try {
      setIsSubmitting(true);
      
      // Format date properly for TimeZoneService
      const dateStr = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      console.log('[SingleAvailabilityDialog] Creating availability with:', {
        clinicianId,
        startTime: dateStr + 'T' + startTime,
        endTime: dateStr + 'T' + endTime,
        userTimeZone: validTimeZone,
        authUserId: currentUserId
      });
      
      // Debug authentication state before proceeding
      if (!currentUserId) {
        console.warn('[SingleAvailabilityDialog] Warning: No authenticated user found');
        await refreshAuth();
      }
      
      // Create availability object with correct day of week
      const selectedDateTime = DateTime.fromJSDate(selectedDate).setZone(validTimeZone);
      const dayOfWeek = TimeZoneService.getWeekdayName(selectedDateTime, 'long').toLowerCase() as any;
      
      const response = await AvailabilityMutationService.createAvailabilitySlot(
        clinicianId,
        dayOfWeek,
        dateStr + 'T' + startTime,
        dateStr + 'T' + endTime,
        false, // Not recurring for single day
        undefined,
        validTimeZone,
        selectedDateTime
      );

      toast({
        title: "Success",
        description: "Single day availability has been added",
      });
      
      onAvailabilityCreated();
      onClose();
    } catch (error) {
      console.error('[SingleAvailabilityDialog] Error creating single availability:', error);
      
      let errorMessage = "Failed to create availability slot";
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Enhanced error messages for specific cases
        if (error.message.includes('violates row level security policy')) {
          errorMessage = "Permission denied: You don't have access to create availability for this clinician.";
        } else if (error.message.includes('overlapping')) {
          errorMessage = "This time slot overlaps with an existing availability. Please select a different time.";
        }
      }
      
      setFormError(errorMessage);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Single Day Availability</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {formError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}
          
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
              <TimePickerInput 
                value={startTime} 
                onChange={setStartTime} 
                min="00:00" 
                max="23:45"
                step={900} 
              />
            </div>
            <div className="flex flex-col gap-2">
              <label>End Time</label>
              <TimePickerInput 
                value={endTime} 
                onChange={setEndTime} 
                min="00:15" 
                max="23:59"
                step={900} 
              />
            </div>
          </div>
          
          <p className="text-xs text-gray-500 mt-1">
            Adding availability for: {clinicianId}<br/>
            Current user: {currentUserId || 'Not authenticated'}
          </p>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Add Availability
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SingleAvailabilityDialog;
