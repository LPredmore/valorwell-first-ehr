
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { TimeInput } from '@/components/ui/time-input';
import { Trash2 } from 'lucide-react';
import { useAvailability } from './AvailabilityContext';

interface WeeklyAvailabilitySlotProps {
  eventId?: string;
  dayIndex: number;
  dayName: string;
  startTime: string;
  endTime: string;
  isEditable?: boolean;
}

const WeeklyAvailabilitySlot: React.FC<WeeklyAvailabilitySlotProps> = ({
  eventId,
  dayIndex,
  dayName,
  startTime,
  endTime,
  isEditable = true
}) => {
  const { addAvailabilitySlot, updateAvailabilitySlot, removeAvailabilitySlot } = useAvailability();
  const [isLoading, setIsLoading] = useState(false);
  const [start, setStart] = useState(startTime || '09:00');
  const [end, setEnd] = useState(endTime || '17:00');
  const [isEditing, setIsEditing] = useState(!eventId);
  
  const handleSave = async () => {
    if (!isEditing) return;
    
    setIsLoading(true);
    try {
      if (eventId) {
        await updateAvailabilitySlot(eventId, start, end);
      } else {
        await addAvailabilitySlot(dayIndex, start, end);
      }
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving availability slot:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDelete = async () => {
    if (!eventId) return;
    
    setIsLoading(true);
    try {
      await removeAvailabilitySlot(eventId);
    } catch (error) {
      console.error('Error removing availability slot:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex items-center space-x-4 p-2 bg-white rounded-md border border-gray-200">
      <div className="flex-1 grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs mb-1 block">Start Time</label>
          <TimeInput 
            value={start} 
            onChange={setStart} 
            disabled={!isEditable || !isEditing || isLoading}
          />
        </div>
        <div>
          <label className="text-xs mb-1 block">End Time</label>
          <TimeInput 
            value={end} 
            onChange={setEnd} 
            disabled={!isEditable || !isEditing || isLoading}
          />
        </div>
      </div>
      
      <div className="flex space-x-2">
        {isEditable && (
          <>
            {isEditing ? (
              <Button 
                size="sm" 
                onClick={handleSave}
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save'}
              </Button>
            ) : (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setIsEditing(true)}
                disabled={isLoading}
              >
                Edit
              </Button>
            )}
            
            {eventId && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDelete}
                disabled={isLoading}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default WeeklyAvailabilitySlot;
