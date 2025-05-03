
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { TimeZoneService } from '@/utils/timezone';
import { useAvailability } from '@/hooks/useAvailability';
import { DateTime } from 'luxon';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { DayOfWeek } from '@/types/availability';
import { TimeField } from '@/components/ui/time-field';

interface SingleAvailabilityDialogProps {
  clinicianId?: string;
  date?: Date;
  userTimeZone?: string;
  onAvailabilityCreated?: (availability: any) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const SingleAvailabilityDialog: React.FC<SingleAvailabilityDialogProps> = ({
  clinicianId,
  date,
  userTimeZone,
  onAvailabilityCreated,
  isOpen = false,
  onClose = () => {}
}) => {
  const { toast } = useToast();
  const { createSlot } = useAvailability(clinicianId || null);
  
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [isRecurring, setIsRecurring] = useState(false);
  const [timeZone, setTimeZone] = useState(userTimeZone || TimeZoneService.getUserTimeZone());
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('monday');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [displayDate, setDisplayDate] = useState<string>('');
  
  useEffect(() => {
    // Handle the date passed to the component
    if (date) {
      const dt = DateTime.fromJSDate(date);
      setDisplayDate(dt.toLocaleString(DateTime.DATE_FULL));
      
      // Get day of week from date
      const dayOfWeek = dt.weekday;
      const days: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      setSelectedDay(days[dayOfWeek - 1] || 'monday');
    }
  }, [date]);

  const handleSaveAvailability = async () => {
    if (!clinicianId) {
      toast({
        title: 'Error',
        description: 'Clinician ID is required',
        variant: 'destructive'
      });
      return;
    }

    if (!startTime || !endTime) {
      toast({
        title: 'Error',
        description: 'Please select both start and end times',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const result = await createSlot(
        selectedDay,
        startTime,
        endTime,
        isRecurring,
        undefined, // No recurrence rule for now
        timeZone,
        date // This will be used for single-day availability
      );

      if (result.success) {
        toast({
          title: 'Success',
          description: `Availability ${isRecurring ? 'pattern' : 'slot'} has been created`,
        });
        
        if (onAvailabilityCreated && result.slotId) {
          onAvailabilityCreated({
            id: result.slotId,
            startTime,
            endTime,
            dayOfWeek: selectedDay,
            isRecurring
          });
        }
        
        onClose();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to create availability',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error creating availability:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Availability</DialogTitle>
          <DialogDescription>
            {isRecurring 
              ? "Set recurring availability for this day of the week" 
              : "Set availability for a specific date"}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-2">
          <Card>
            <CardContent className="pt-4">
              {displayDate && (
                <div className="mb-4">
                  <p className="text-sm font-medium mb-1">Date:</p>
                  <p className="text-sm">{displayDate}</p>
                </div>
              )}
              
              <div className="flex items-center gap-2 mb-4">
                <Checkbox 
                  id="isRecurring" 
                  checked={isRecurring} 
                  onCheckedChange={(checked) => setIsRecurring(checked === true)}
                />
                <Label htmlFor="isRecurring">
                  Make this a recurring availability
                </Label>
              </div>
              
              {isRecurring && (
                <div className="mb-4">
                  <Label htmlFor="dayOfWeek">Day of Week</Label>
                  <Select 
                    value={selectedDay} 
                    onValueChange={(value: DayOfWeek) => setSelectedDay(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monday">Monday</SelectItem>
                      <SelectItem value="tuesday">Tuesday</SelectItem>
                      <SelectItem value="wednesday">Wednesday</SelectItem>
                      <SelectItem value="thursday">Thursday</SelectItem>
                      <SelectItem value="friday">Friday</SelectItem>
                      <SelectItem value="saturday">Saturday</SelectItem>
                      <SelectItem value="sunday">Sunday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input 
                    id="startTime"
                    type="time" 
                    value={startTime} 
                    onChange={(e) => setStartTime(e.target.value)} 
                  />
                </div>
                <div>
                  <Label htmlFor="endTime">End Time</Label>
                  <Input 
                    id="endTime"
                    type="time" 
                    value={endTime} 
                    onChange={(e) => setEndTime(e.target.value)} 
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="timezone">Time Zone</Label>
                <Select 
                  value={timeZone} 
                  onValueChange={setTimeZone}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {TimeZoneService.TIMEZONE_OPTIONS.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Times will be stored in UTC but displayed in the selected timezone
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleSaveAvailability} 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SingleAvailabilityDialog;
