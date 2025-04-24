import React from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Edit } from 'lucide-react';
import { formatTime12Hour } from '@/utils/timeZoneUtils';

interface AvailabilitySlotProps {
  startTime: string;
  endTime: string;
  isRecurring?: boolean;
  onEdit: () => void;
  onDelete?: () => void;
  isEditing?: boolean;
}

const AvailabilitySlot = ({
  startTime,
  endTime,
  isRecurring,
  onEdit,
  onDelete,
  isEditing
}: AvailabilitySlotProps) => {
  return (
    <div className={`flex justify-between items-center border p-3 rounded-md ${isEditing ? 'border-primary' : ''}`}>
      <div>
        <span className="font-medium">
          {formatTime12Hour(startTime)} - {formatTime12Hour(endTime)}
        </span>
        {isRecurring && (
          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
            Recurring
          </span>
        )}
      </div>
      <div className="flex gap-2">
        <Button 
          size="sm" 
          variant="ghost" 
          className="p-1 h-auto"
          onClick={onEdit}
        >
          <Edit className="h-4 w-4 text-gray-500" />
        </Button>
        {onDelete && (
          <Button 
            size="sm" 
            variant="ghost" 
            className="p-1 h-auto"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default AvailabilitySlot;
