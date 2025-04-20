
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { PlusCircle, Trash2, Clock } from 'lucide-react';
import { useAvailability } from './AvailabilityContext';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
}

interface WeeklyAvailabilityProps {
  dayIndex: number;
  dayName: string;
  slots: TimeSlot[];
  enabled: boolean;
  onToggleDay: (dayIndex: number, enabled: boolean) => void;
}

const WeeklyAvailability: React.FC<WeeklyAvailabilityProps> = ({
  dayIndex,
  dayName,
  slots: initialSlots,
  enabled,
  onToggleDay
}) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newStartTime, setNewStartTime] = useState('09:00');
  const [newEndTime, setNewEndTime] = useState('17:00');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  
  const { addAvailabilitySlot, removeAvailabilitySlot, updateAvailabilitySlot, events, isLoading } = useAvailability();
  
  // Filter events to get slots for this specific day
  const slots = events
    .filter(event => 
      event.extendedProps?.isAvailability && 
      event.extendedProps.availabilityBlock?.type === 'weekly' &&
      event.extendedProps.availabilityBlock.dayOfWeek === dayIndex.toString()
    )
    .map(event => ({
      id: event.id,
      startTime: event.extendedProps?.availabilityBlock?.startTime || '',
      endTime: event.extendedProps?.availabilityBlock?.endTime || ''
    }));
  
  const handleAddSlot = async () => {
    try {
      await addAvailabilitySlot(dayIndex, newStartTime, newEndTime);
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Failed to add availability slot:', error);
    }
  };

  const handleEditClick = (slot: TimeSlot) => {
    setEditingSlot(slot);
    setEditStartTime(slot.startTime);
    setEditEndTime(slot.endTime);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingSlot) return;
    try {
      await updateAvailabilitySlot(editingSlot.id, editStartTime, editEndTime);
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Failed to update availability slot:', error);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    try {
      await removeAvailabilitySlot(slotId);
    } catch (error) {
      console.error('Failed to remove availability slot:', error);
    }
  };

  return (
    <div className="border rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <Switch 
            checked={enabled}
            onCheckedChange={(checked) => onToggleDay(dayIndex, checked)}
            id={`day-toggle-${dayIndex}`}
          />
          <Label htmlFor={`day-toggle-${dayIndex}`} className="text-lg font-medium">{dayName}</Label>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAddDialogOpen(true)}
          disabled={isLoading || !enabled}
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Time
        </Button>
      </div>

      {enabled && slots.length > 0 ? (
        <div className="space-y-2">
          {slots.map((slot) => (
            <div key={slot.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-gray-500" />
                <span>{slot.startTime} - {slot.endTime}</span>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditClick(slot)}
                  disabled={isLoading}
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteSlot(slot.id)}
                  disabled={isLoading}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : enabled ? (
        <div className="text-center py-4 text-gray-500">No availability slots set for {dayName}</div>
      ) : (
        <div className="text-center py-4 text-gray-500">{dayName} is disabled</div>
      )}

      {/* Add Time Slot Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Availability for {dayName}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-time">Start Time</Label>
                <Input
                  id="start-time"
                  type="time"
                  value={newStartTime}
                  onChange={(e) => setNewStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-time">End Time</Label>
                <Input
                  id="end-time"
                  type="time"
                  value={newEndTime}
                  onChange={(e) => setNewEndTime(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSlot} disabled={isLoading}>
              Add Slot
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Time Slot Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Availability for {dayName}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-start-time">Start Time</Label>
                <Input
                  id="edit-start-time"
                  type="time"
                  value={editStartTime}
                  onChange={(e) => setEditStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-end-time">End Time</Label>
                <Input
                  id="edit-end-time"
                  type="time"
                  value={editEndTime}
                  onChange={(e) => setEditEndTime(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isLoading}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WeeklyAvailability;
