import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface TimeOption {
  value: string;
  display: string;
}

interface AvailabilityEditFormProps {
  startTime: string;
  endTime: string;
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete?: () => void;
  isSaving: boolean;
  isDeleting?: boolean;
  timeOptions: { value: string; display: string; }[];
}

const AvailabilityEditForm = ({
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
  onSave,
  onCancel,
  onDelete,
  isSaving,
  isDeleting = false,
  timeOptions
}: AvailabilityEditFormProps) => {
  return (
    <div className="border p-4 rounded-md bg-muted/50">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs text-gray-500">Start Time</label>
          <select 
            className="w-full border border-gray-300 rounded-md p-2"
            value={startTime}
            onChange={(e) => onStartTimeChange(e.target.value)}
            disabled={isSaving || isDeleting}
          >
            {timeOptions.map(option => (
              <option key={`start-${option.value}`} value={option.value}>
                {option.display}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs text-gray-500">End Time</label>
          <select 
            className="w-full border border-gray-300 rounded-md p-2"
            value={endTime}
            onChange={(e) => onEndTimeChange(e.target.value)}
            disabled={isSaving || isDeleting}
          >
            {timeOptions.map(option => (
              <option key={`end-${option.value}`} value={option.value}>
                {option.display}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex justify-between mt-4">
        {onDelete && (
          <Button
            variant="destructive"
            onClick={onDelete}
            disabled={isSaving || isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </Button>
        )}
        <div className="flex gap-2 ml-auto">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isSaving || isDeleting}
          >
            Cancel
          </Button>
          <Button
            onClick={onSave}
            disabled={isSaving || isDeleting}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityEditForm;
