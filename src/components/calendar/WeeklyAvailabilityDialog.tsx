import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAvailability } from '@/hooks/useAvailability';
import { DayOfWeek, WeeklyAvailability } from '@/types/availability';
import { DateTime } from 'luxon';
import DayAvailabilityTab from './DayAvailabilityTab';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';

interface WeeklyAvailabilityDialogProps {
  isOpen: boolean;
  onClose: () => void;
  clinicianId: string;
  onAvailabilityUpdated?: () => void;
  initialActiveTab?: string;
}

const WeeklyAvailabilityDialog: React.FC<WeeklyAvailabilityDialogProps> = ({ 
  isOpen, 
  onClose, 
  clinicianId,
  onAvailabilityUpdated,
  initialActiveTab = 'monday'
}) => {
  const [activeTab, setActiveTab] = useState<string>(initialActiveTab);
  const [specificDate, setSpecificDate] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const { weeklyAvailability, loading, error, createSlot, updateSlot, deleteSlot } = useAvailability(clinicianId);

  useEffect(() => {
    if (isOpen) {
      // Set active tab if provided
      if (initialActiveTab) {
        setActiveTab(initialActiveTab);
      }
      
      // Check for stored specific date
      const storedDate = localStorage.getItem('selectedAvailabilityDate');
      if (storedDate) {
        console.log('[WeeklyAvailabilityDialog] Retrieved specific date from localStorage:', storedDate);
        setSpecificDate(storedDate);
        localStorage.removeItem('selectedAvailabilityDate');
      } else {
        setSpecificDate(null);
      }
      
      // Check for stored slot ID
      const storedSlotId = localStorage.getItem('selectedAvailabilitySlotId');
      if (storedSlotId) {
        console.log('[WeeklyAvailabilityDialog] Retrieved slot ID from localStorage:', storedSlotId);
        setSelectedSlotId(storedSlotId);
      } else {
        setSelectedSlotId(null);
      }
    }
  }, [isOpen, initialActiveTab]);

  const handleAddSlot = async (dayOfWeek: DayOfWeek, startTime: string, endTime: string, isRecurring: boolean) => {
    try {
      console.log('[WeeklyAvailabilityDialog] Adding availability slot:', {
        dayOfWeek,
        startTime,
        endTime,
        isRecurring,
        specificDate
      });
      
      const result = await createSlot(dayOfWeek, startTime, endTime, isRecurring, undefined, undefined, specificDate);
      
      if (result.success) {
        console.log('[WeeklyAvailabilityDialog] Successfully created slot:', result.slotId);
        if (onAvailabilityUpdated) {
          onAvailabilityUpdated();
        }
        return true;
      } else {
        console.error('[WeeklyAvailabilityDialog] Failed to create slot:', result.error);
        return false;
      }
    } catch (error) {
      console.error('[WeeklyAvailabilityDialog] Error in handleAddSlot:', error);
      return false;
    }
  };

  const handleUpdateSlot = async (slotId: string, updates: any) => {
    try {
      console.log('[WeeklyAvailabilityDialog] Updating availability slot:', {
        slotId,
        updates
      });
      
      const result = await updateSlot(slotId, updates);
      
      if (result.success) {
        console.log('[WeeklyAvailabilityDialog] Successfully updated slot:', slotId);
        if (onAvailabilityUpdated) {
          onAvailabilityUpdated();
        }
        return true;
      } else {
        console.error('[WeeklyAvailabilityDialog] Failed to update slot:', result.error);
        return false;
      }
    } catch (error) {
      console.error('[WeeklyAvailabilityDialog] Error in handleUpdateSlot:', error);
      return false;
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    try {
      console.log('[WeeklyAvailabilityDialog] Deleting availability slot:', slotId);
      
      const result = await deleteSlot(slotId);
      
      if (result.success) {
        console.log('[WeeklyAvailabilityDialog] Successfully deleted slot:', slotId);
        if (onAvailabilityUpdated) {
          onAvailabilityUpdated();
        }
        return true;
      } else {
        console.error('[WeeklyAvailabilityDialog] Failed to delete slot:', result.error);
        return false;
      }
    } catch (error) {
      console.error('[WeeklyAvailabilityDialog] Error in handleDeleteSlot:', error);
      return false;
    }
  };

  const renderTabs = () => {
    const days: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    return (
      <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-7">
          {days.map((day) => (
            <TabsTrigger key={day} value={day} className="text-xs sm:text-sm">
              {day.charAt(0).toUpperCase() + day.slice(1, 3)}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {days.map((day) => (
          <TabsContent key={day} value={day} className="mt-4">
            <DayAvailabilityTab
              day={day}
              slots={weeklyAvailability?.[day] || []}
              onAddSlot={(startTime, endTime, isRecurring) => 
                handleAddSlot(day, startTime, endTime, isRecurring)
              }
              onUpdateSlot={(slotId, updates) => handleUpdateSlot(slotId, updates)}
              onDeleteSlot={(slotId) => handleDeleteSlot(slotId)}
              selectedSlotId={selectedSlotId}
            />
          </TabsContent>
        ))}
      </Tabs>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Weekly Availability Schedule</span>
            {specificDate && (
              <span className="text-sm font-normal text-gray-500">
                (Using date: {specificDate})
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error.message || "Failed to load availability data"}
            </AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-gray-600">Loading availability data...</span>
          </div>
        ) : (
          renderTabs()
        )}
      </DialogContent>
    </Dialog>
  );
};

export default WeeklyAvailabilityDialog;
