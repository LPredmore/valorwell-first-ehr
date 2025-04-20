
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { TimeInput } from '@/components/ui/time-input';
import { Trash2, PlusCircle } from 'lucide-react';
import { useAvailability } from './AvailabilityContext';

interface WeeklyAvailabilityProps {
  dayIndex: number;
  dayName: string;
  slots: Array<{ id: string; startTime: string; endTime: string }>;
  enabled: boolean;
  onToggleDay: (enabled: boolean) => void;
}

const WeeklyAvailability: React.FC<WeeklyAvailabilityProps> = ({
  dayIndex,
  dayName,
  slots,
  enabled,
  onToggleDay,
}) => {
  const { addAvailabilitySlot, removeAvailabilitySlot, updateAvailabilitySlot } = useAvailability();

  const validateTimeSlot = (startTime: string, endTime: string): boolean => {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    return start < end;
  };

  return (
    <Card>
      <CardContent className="p-0">
        <div className="p-4 border-b flex justify-between items-center">
          <div className="flex items-center">
            <Switch
              id={`day-${dayIndex}`}
              checked={enabled}
              onCheckedChange={onToggleDay}
            />
            <Label 
              htmlFor={`day-${dayIndex}`} 
              className={`ml-2 font-medium ${!enabled ? 'text-gray-500' : ''}`}
            >
              {dayName}
            </Label>
          </div>
        </div>

        {enabled && (
          <div className="p-4 space-y-4">
            {slots.map((slot, slotIndex) => (
              <div key={slot.id} className="flex items-center space-x-4">
                <div className="flex-1 grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`start-${dayIndex}-${slotIndex}`} className="text-xs mb-1 block">
                      Start Time
                    </Label>
                    <TimeInput
                      id={`start-${dayIndex}-${slotIndex}`}
                      value={slot.startTime}
                      onChange={(value) => updateAvailabilitySlot(slot.id, value, slot.endTime)}
                      className={!validateTimeSlot(slot.startTime, slot.endTime) ? 'border-red-500' : ''}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`end-${dayIndex}-${slotIndex}`} className="text-xs mb-1 block">
                      End Time
                    </Label>
                    <TimeInput
                      id={`end-${dayIndex}-${slotIndex}`}
                      value={slot.endTime}
                      onChange={(value) => updateAvailabilitySlot(slot.id, slot.startTime, value)}
                      className={!validateTimeSlot(slot.startTime, slot.endTime) ? 'border-red-500' : ''}
                    />
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeAvailabilitySlot(slot.id)}
                  className="h-8 w-8"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            {slots.length < 3 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => addAvailabilitySlot(dayIndex, '09:00', '17:00')}
                className="mt-2"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Time Slot
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WeeklyAvailability;
