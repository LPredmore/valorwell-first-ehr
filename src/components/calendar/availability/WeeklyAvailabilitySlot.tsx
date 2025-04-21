
import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Clock, Trash2 } from 'lucide-react';
import { useAvailabilityTimeSlot } from '@/hooks/useAvailabilityTimeSlot';
import { TimeSlotValidation } from '@/utils/timeSlotValidation';
import { useAvailability } from './AvailabilityContext';

interface WeeklyAvailabilitySlotProps {
  dayIndex: number;
  dayName: string;
  eventId?: string;
  startTime?: string;
  endTime?: string;
  isReadOnly?: boolean;
  isGoogleEvent?: boolean;
}

const WeeklyAvailabilitySlot: React.FC<WeeklyAvailabilitySlotProps> = ({
  dayIndex,
  dayName,
  eventId,
  startTime: initialStartTime = '09:00',
  endTime: initialEndTime = '17:00',
  isReadOnly = false,
  isGoogleEvent = false
}) => {
  const { updateAvailabilitySlot, removeAvailabilitySlot } = useAvailability();
  const timeOptions = TimeSlotValidation.getTimeOptions();

  const {
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    isAdding,
    handleTimeSlotAdd
  } = useAvailabilityTimeSlot({
    dayIndex,
    onTimeSlotAdded: async () => {
      if (eventId) {
        await updateAvailabilitySlot(eventId, startTime, endTime);
      }
    }
  });

  const handleDelete = async () => {
    if (eventId) {
      await removeAvailabilitySlot(eventId);
    }
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{dayName}</span>
        </div>
        {isGoogleEvent && (
          <span className="text-sm text-muted-foreground">Google Calendar</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Start Time</label>
          <Select
            value={startTime}
            onValueChange={setStartTime}
            disabled={isReadOnly}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select start time" />
            </SelectTrigger>
            <SelectContent>
              {timeOptions.map(time => (
                <SelectItem key={time} value={time}>
                  {time}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">End Time</label>
          <Select
            value={endTime}
            onValueChange={setEndTime}
            disabled={isReadOnly}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select end time" />
            </SelectTrigger>
            <SelectContent>
              {timeOptions.map(time => (
                <SelectItem key={time} value={time}>
                  {time}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!isReadOnly && (
        <div className="flex justify-end space-x-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isAdding}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Remove
          </Button>
        </div>
      )}
    </Card>
  );
};

export default WeeklyAvailabilitySlot;
