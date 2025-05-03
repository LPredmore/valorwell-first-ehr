
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Plus, Trash } from 'lucide-react';
import { useAvailability } from '@/hooks/useAvailability';
import { useToast } from '@/components/ui/use-toast';
import TimeField from '@/components/ui/time-field';
import { TimeZoneService } from '@/utils/timezone';
import { AvailabilitySlot, WeeklyAvailability, DayOfWeek } from '@/types/availability';

interface WeeklyAvailabilityDialogProps {
  clinicianId?: string;
  isOpen: boolean;
  onClose: () => void;
  onAvailabilityUpdated?: () => void;
}

const DAYS_OF_WEEK: DayOfWeek[] = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
];

const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday'
};

const WeeklyAvailabilityDialog: React.FC<WeeklyAvailabilityDialogProps> = ({
  clinicianId,
  isOpen,
  onClose,
  onAvailabilityUpdated
}) => {
  const [activeTab, setActiveTab] = useState<DayOfWeek>('monday');
  const [availabilityByDay, setAvailabilityByDay] = useState<WeeklyAvailability>({
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { weeklyAvailability, createSlot, deleteSlot, refreshAvailability, settings } = useAvailability(clinicianId || null);
  const { toast } = useToast();
  
  // Load existing weekly availability
  useEffect(() => {
    if (isOpen && weeklyAvailability) {
      setAvailabilityByDay({...weeklyAvailability});
    }
  }, [isOpen, weeklyAvailability]);
  
  const handleAddSlot = (dayOfWeek: DayOfWeek) => {
    const newSlot: AvailabilitySlot = {
      startTime: '09:00',
      endTime: '17:00',
      dayOfWeek,
      clinicianId: clinicianId || '',
      isRecurring: true
    };
    
    setAvailabilityByDay(prev => ({
      ...prev,
      [dayOfWeek]: [...prev[dayOfWeek], newSlot]
    }));
  };
  
  const handleRemoveSlot = (dayOfWeek: DayOfWeek, index: number) => {
    const slot = availabilityByDay[dayOfWeek][index];
    
    // If slot has an ID, it exists in the database and needs to be deleted
    if (slot.id) {
      deleteExistingSlot(slot.id);
    }
    
    setAvailabilityByDay(prev => ({
      ...prev,
      [dayOfWeek]: prev[dayOfWeek].filter((_, i) => i !== index)
    }));
  };
  
  const handleChangeSlotTime = (dayOfWeek: DayOfWeek, index: number, field: 'startTime' | 'endTime', value: string) => {
    setAvailabilityByDay(prev => {
      const updatedSlots = [...prev[dayOfWeek]];
      updatedSlots[index] = { ...updatedSlots[index], [field]: value };
      return { ...prev, [dayOfWeek]: updatedSlots };
    });
  };
  
  const deleteExistingSlot = async (slotId: string) => {
    try {
      await deleteSlot(slotId);
    } catch (error) {
      console.error('Failed to delete slot:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete availability slot',
        variant: 'destructive'
      });
    }
  };
  
  const handleSave = async (dayOfWeek: DayOfWeek) => {
    setIsSubmitting(true);
    
    try {
      // Get existing slots for this day from the server
      const existingSlots = weeklyAvailability?.[dayOfWeek] || [];
      const currentSlots = availabilityByDay[dayOfWeek];
      
      // For each slot in the current state that doesn't have an ID, create it
      for (const slot of currentSlots) {
        if (!slot.id) {
          await createSlot(
            dayOfWeek,
            slot.startTime,
            slot.endTime,
            true, // Recurring
            undefined,
            settings?.timeZone
          );
        }
      }
      
      toast({
        title: 'Availability Updated',
        description: `Weekly availability for ${DAY_LABELS[dayOfWeek]} has been updated.`
      });
      
      // Refresh the availability data
      await refreshAvailability();
      
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update availability',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleSaveAll = async () => {
    setIsSubmitting(true);
    
    try {
      // Save each day's availability
      for (const day of DAYS_OF_WEEK) {
        await handleSave(day);
      }
      
      toast({
        title: 'Success',
        description: 'Weekly availability has been updated for all days.'
      });
      
      if (onAvailabilityUpdated) {
        onAvailabilityUpdated();
      }
      
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update all availability settings',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Manage Weekly Availability
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as DayOfWeek)}>
          <TabsList className="grid grid-cols-7">
            {DAYS_OF_WEEK.map(day => (
              <TabsTrigger key={day} value={day}>
                {DAY_LABELS[day].substring(0, 3)}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {DAYS_OF_WEEK.map(day => (
            <TabsContent key={day} value={day} className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">{DAY_LABELS[day]}</h3>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleAddSlot(day)}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Time Slot
                </Button>
              </div>
              
              {availabilityByDay[day].length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  No availability slots for {DAY_LABELS[day]}
                </div>
              ) : (
                <div className="space-y-3">
                  {availabilityByDay[day].map((slot, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="grid grid-cols-2 gap-3 flex-grow">
                        <TimeField
                          value={slot.startTime}
                          onChange={(value) => handleChangeSlotTime(day, index, 'startTime', value)}
                        />
                        <TimeField
                          value={slot.endTime}
                          onChange={(value) => handleChangeSlotTime(day, index, 'endTime', value)}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveSlot(day, index)}
                      >
                        <Trash className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              <Button 
                onClick={() => handleSave(day)}
                disabled={isSubmitting}
                className="w-full mt-2"
              >
                Save {DAY_LABELS[day]} Availability
              </Button>
            </TabsContent>
          ))}
        </Tabs>
        
        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSaveAll} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save All Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WeeklyAvailabilityDialog;
