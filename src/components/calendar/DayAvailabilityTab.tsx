
import React, { useState } from 'react';
import { AvailabilitySlot as AvailabilitySlotType } from '@/types/availability';
import AvailabilitySlot from './AvailabilitySlot';
import AvailabilityEditForm from './AvailabilityEditForm';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { TimeZoneService } from '@/utils/timeZoneService';

interface DayAvailabilityTabProps {
  day: string;
  slots: AvailabilitySlotType[];
  onAddSlot: (startTime: string, endTime: string, isRecurring: boolean) => Promise<boolean>;
  onUpdateSlot: (slotId: string, updates: Partial<AvailabilitySlotType>) => Promise<boolean>;
  onDeleteSlot: (slotId: string) => Promise<boolean>;
  selectedSlotId?: string | null;
}

const DayAvailabilityTab: React.FC<DayAvailabilityTabProps> = ({
  day,
  slots,
  onAddSlot,
  onUpdateSlot,
  onDeleteSlot,
  selectedSlotId
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Create time options for the form
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        options.push({ value: timeStr, display: TimeZoneService.formatTime(timeStr) });
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  const handleAdd = async (startTime: string, endTime: string) => {
    setIsSaving(true);
    try {
      const success = await onAddSlot(startTime, endTime, true);
      if (success) {
        setIsAdding(false);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async (slotId: string, updates: Partial<AvailabilitySlotType>) => {
    setIsSaving(true);
    try {
      const success = await onUpdateSlot(slotId, updates);
      if (success) {
        setEditingSlotId(null);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (slotId: string) => {
    setIsDeleting(true);
    try {
      const success = await onDeleteSlot(slotId);
      if (success) {
        setEditingSlotId(null);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {slots.map((slot) => (
        <div key={slot.id} className="mb-4">
          {editingSlotId === slot.id ? (
            <AvailabilityEditForm
              startTime={slot.startTime}
              endTime={slot.endTime}
              onStartTimeChange={(value) => handleUpdate(slot.id!, { startTime: value })}
              onEndTimeChange={(value) => handleUpdate(slot.id!, { endTime: value })}
              onSave={() => setEditingSlotId(null)}
              onCancel={() => setEditingSlotId(null)}
              onDelete={() => slot.id && handleDelete(slot.id)}
              isSaving={isSaving}
              isDeleting={isDeleting}
              timeOptions={timeOptions}
            />
          ) : (
            <AvailabilitySlot
              startTime={slot.startTime}
              endTime={slot.endTime}
              isRecurring={slot.isRecurring}
              onEdit={() => setEditingSlotId(slot.id!)}
              onDelete={() => slot.id && handleDelete(slot.id)}
              isEditing={selectedSlotId === slot.id}
            />
          )}
        </div>
      ))}

      {isAdding ? (
        <AvailabilityEditForm
          startTime="09:00"
          endTime="17:00"
          onStartTimeChange={(value) => {}}
          onEndTimeChange={(value) => {}}
          onSave={() => handleAdd("09:00", "17:00")}
          onCancel={() => setIsAdding(false)}
          isSaving={isSaving}
          timeOptions={timeOptions}
        />
      ) : (
        <Button 
          onClick={() => setIsAdding(true)}
          className="w-full"
          variant="outline"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Availability
        </Button>
      )}
    </div>
  );
};

export default DayAvailabilityTab;
