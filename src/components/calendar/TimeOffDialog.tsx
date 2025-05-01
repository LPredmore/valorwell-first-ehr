import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { TimeOffService } from '@/services/calendar/TimeOffService';
import { TimeOff as TimeOffType } from '@/types/calendar';
import { DateTime } from 'luxon';
import { Loader2 } from 'lucide-react';
import { TimeZoneService } from '@/utils/timezone';

interface TimeOffDialogProps {
  isOpen: boolean;
  onClose: () => void;
  timeOffId?: string;
  clinicianId: string;
  startTime?: Date;
  endTime?: Date;
  userTimeZone: string;
  onTimeOffCreated?: () => void;
  onTimeOffUpdated?: () => void;
  onTimeOffDeleted?: () => void;
}

const TimeOffDialog: React.FC<TimeOffDialogProps> = ({
  isOpen,
  onClose,
  timeOffId,
  clinicianId,
  startTime,
  endTime,
  userTimeZone,
  onTimeOffCreated,
  onTimeOffUpdated,
  onTimeOffDeleted,
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [reason, setReason] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime24, setStartTime24] = useState('09:00');
  const [endTime24, setEndTime24] = useState('17:00');
  const [isAllDay, setIsAllDay] = useState(false);
  const [timeOff, setTimeOff] = useState<any | null>(null);

  // Format date and time for input fields
  const formatDateForInput = (date: Date | string): string => {
    return DateTime.fromJSDate(date instanceof Date ? date : new Date(date))
      .setZone(userTimeZone)
      .toFormat('yyyy-MM-dd');
  };

  const formatTimeForInput = (date: Date | string): string => {
    return DateTime.fromJSDate(date instanceof Date ? date : new Date(date))
      .setZone(userTimeZone)
      .toFormat('HH:mm');
  };

  // Load time off data if editing
  useEffect(() => {
    const loadTimeOff = async () => {
      if (!timeOffId) return;

      setIsLoading(true);
      try {
        // Fetch time off data
        const timeOffData = await TimeOffService.getTimeOffById(timeOffId);
        if (timeOffData) {
          setTimeOff(timeOffData);
          setReason(timeOffData.reason || '');
          setIsAllDay(timeOffData.allDay);

          // Format dates and times
          const startDateTime = DateTime.fromISO(timeOffData.startTime.toString()).setZone(userTimeZone);
          const endDateTime = DateTime.fromISO(timeOffData.endTime.toString()).setZone(userTimeZone);

          setStartDate(startDateTime.toFormat('yyyy-MM-dd'));
          setEndDate(endDateTime.toFormat('yyyy-MM-dd'));
          setStartTime24(startDateTime.toFormat('HH:mm'));
          setEndTime24(endDateTime.toFormat('HH:mm'));
        }
      } catch (error) {
        console.error('Error loading time off data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load time off data. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen && timeOffId) {
      loadTimeOff();
    } else if (isOpen && startTime && endTime) {
      // New time off with provided start and end times
      setStartDate(formatDateForInput(startTime));
      setEndDate(formatDateForInput(endTime));
      setStartTime24(formatTimeForInput(startTime));
      setEndTime24(formatTimeForInput(endTime));
    } else if (isOpen) {
      // New time off with default times
      const now = DateTime.now().setZone(userTimeZone);
      setStartDate(now.toFormat('yyyy-MM-dd'));
      setEndDate(now.toFormat('yyyy-MM-dd'));
      setStartTime24('09:00');
      setEndTime24('17:00');
    }
  }, [isOpen, timeOffId, startTime, endTime, userTimeZone, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clinicianId) {
      toast({
        title: 'Error',
        description: 'Clinician ID is required.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      // Create start and end DateTime objects
      let startDateTime = DateTime.fromFormat(`${startDate} ${isAllDay ? '00:00' : startTime24}`, 'yyyy-MM-dd HH:mm', { zone: userTimeZone });
      let endDateTime = DateTime.fromFormat(`${endDate} ${isAllDay ? '23:59' : endTime24}`, 'yyyy-MM-dd HH:mm', { zone: userTimeZone });

      // Validate dates
      if (!startDateTime.isValid || !endDateTime.isValid) {
        throw new Error('Invalid date or time format');
      }

      if (endDateTime < startDateTime) {
        throw new Error('End time must be after start time');
      }

      // Create or update time off
      if (timeOffId) {
        // Update existing time off
        await TimeOffService.updateTimeOff(timeOffId, {
          clinician_id: clinicianId,
          start_time: startDateTime.toISO(),
          end_time: endDateTime.toISO(),
          reason,
          all_day: isAllDay,
          time_zone: userTimeZone,
        });

        toast({
          title: 'Success',
          description: 'Time off updated successfully.',
        });

        if (onTimeOffUpdated) onTimeOffUpdated();
      } else {
        // Create new time off
        await TimeOffService.createTimeOff(
          clinicianId,
          startDateTime.toJSDate(),
          endDateTime.toJSDate(),
          userTimeZone,
          reason,
          isAllDay
        );

        toast({
          title: 'Success',
          description: 'Time off created successfully.',
        });

        if (onTimeOffCreated) onTimeOffCreated();
      }

      onClose();
    } catch (error) {
      console.error('Error saving time off:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save time off. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!timeOffId) return;

    setIsDeleting(true);
    try {
      await TimeOffService.deleteTimeOff(timeOffId);
      
      toast({
        title: 'Success',
        description: 'Time off deleted successfully.',
      });

      if (onTimeOffDeleted) onTimeOffDeleted();
      onClose();
    } catch (error) {
      console.error('Error deleting time off:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete time off. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{timeOffId ? 'Edit Time Off' : 'Create Time Off'}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-2">Loading...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason (optional)</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Vacation, sick day, etc."
                className="resize-none"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="all-day"
                checked={isAllDay}
                onCheckedChange={(checked) => setIsAllDay(checked === true)}
              />
              <Label htmlFor="all-day" className="cursor-pointer">All day</Label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {!isAllDay && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-time">Start Time</Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={startTime24}
                    onChange={(e) => setStartTime24(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end-time">End Time</Label>
                  <Input
                    id="end-time"
                    type="time"
                    value={endTime24}
                    onChange={(e) => setEndTime24(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <div className="text-sm text-gray-500">
              Time zone: {TimeZoneService.formatTimeZoneDisplay(userTimeZone)}
            </div>

            <DialogFooter className="flex justify-between">
              <div>
                {timeOffId && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isLoading || isDeleting}
                  >
                    {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Delete
                  </Button>
                )}
              </div>
              <div className="flex space-x-2">
                <Button type="button" variant="outline" onClick={onClose} disabled={isLoading || isDeleting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading || isDeleting}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {timeOffId ? 'Update' : 'Create'}
                </Button>
              </div>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TimeOffDialog;