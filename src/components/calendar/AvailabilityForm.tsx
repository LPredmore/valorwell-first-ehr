import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, Plus } from 'lucide-react';
import { DayOfWeek } from '@/types/availability';

export interface AvailabilityFormProps {
  day: DayOfWeek;
  onAddSlot: (startTime: string, endTime: string) => Promise<void>;
  isSubmitting: boolean;
  formError: string | null;
  retryCount: number;
  timeZone: string;
  permissionLevel?: 'full' | 'limited' | 'none';
}

/**
 * AvailabilityForm - A component for adding new availability slots
 * 
 * This component provides a form for adding new availability slots with
 * start and end time inputs. It also displays error messages and
 * troubleshooting tips when errors occur.
 */
const AvailabilityForm: React.FC<AvailabilityFormProps> = ({
  day,
  onAddSlot,
  isSubmitting,
  formError,
  retryCount,
  timeZone,
  permissionLevel = 'full'
}) => {
  const [newStartTime, setNewStartTime] = useState('09:00');
  const [newEndTime, setNewEndTime] = useState('10:00');

  const handleSubmit = async () => {
    await onAddSlot(newStartTime, newEndTime);
  };

  if (permissionLevel === 'none') {
    return null;
  }

  return (
    <div className="mt-4 p-3 border border-dashed rounded-md">
      <h4 className="text-sm font-medium mb-2">Add New Availability Slot</h4>
      
      {formError && (
        <Alert variant="destructive" className="mb-3">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`${day}-start`}>Start Time</Label>
          <Input
            id={`${day}-start`}
            type="time"
            value={newStartTime}
            onChange={(e) => setNewStartTime(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor={`${day}-end`}>End Time</Label>
          <Input
            id={`${day}-end`}
            type="time"
            value={newEndTime}
            onChange={(e) => setNewEndTime(e.target.value)}
          />
        </div>
      </div>
      <Button 
        onClick={handleSubmit} 
        className="mt-3 w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Plus className="h-4 w-4 mr-2" />
        )}
        Add Time Slot
      </Button>

      {retryCount > 0 && (
        <div className="mt-3 p-2 bg-gray-50 rounded-md text-xs text-gray-600">
          <p className="font-medium">Troubleshooting Tips:</p>
          <ul className="list-disc list-inside mt-1">
            <li>Ensure the start time is before the end time</li>
            <li>Check for time slot conflicts with existing availability</li>
            <li>Verify your timezone settings in profile (current: {timeZone || 'Not set'})</li>
            <li>Make sure you have permission to manage this calendar</li>
            <li>Try refreshing the page if the issue persists</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default AvailabilityForm;