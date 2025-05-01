import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DayOfWeek } from '@/types/availability';
import { TimeZoneService } from '@/utils/timeZoneService';
import { useAvailability } from '@/hooks/useAvailability';
import { useToast } from '@/hooks/use-toast';
import { useDialogs } from '@/context/DialogContext';
import { Loader2, AlertCircle } from 'lucide-react';
import { useUserTimeZone } from '@/hooks/useUserTimeZone';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Import our new components
import AvailabilitySlotList from './AvailabilitySlotList';
import AvailabilityForm from './AvailabilityForm';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';
import DayTabs from './DayTabs';

import { PermissionLevel } from '@/services/PermissionService';

interface WeeklyAvailabilityDialogProps {
  clinicianId: string;
  onAvailabilityUpdated?: () => void;
  permissionLevel?: PermissionLevel;
}

/**
 * WeeklyAvailabilityDialog - A dialog for managing weekly availability
 * 
 * This component allows users to view and manage availability slots for each day
 * of the week. It has been refactored to use smaller, more focused components
 * for better maintainability and testability.
 */
const WeeklyAvailabilityDialog: React.FC<WeeklyAvailabilityDialogProps> = ({
  clinicianId,
  onAvailabilityUpdated,
  permissionLevel = 'admin'
}) => {
  const { state, closeDialog } = useDialogs();
  const isOpen = state.type === 'weeklyAvailability';
  const onClose = closeDialog;
  const selectedDate = state.props.selectedDate;
  const initialActiveTab = selectedDate || 'monday';
  const [activeTab, setActiveTab] = useState<DayOfWeek>((initialActiveTab || 'monday') as DayOfWeek);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [isDeleteAll, setIsDeleteAll] = useState(false);
  const { timeZone } = useUserTimeZone(clinicianId);
  const { toast } = useToast();
  const [formError, setFormError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [specificDate, setSpecificDate] = useState<string | null>(null);
  
  const {
    weeklyAvailability,
    isLoading,
    error,
    refreshAvailability,
    createSlot,
    updateSlot,
    deleteSlot
  } = useAvailability(clinicianId);

  useEffect(() => {
    if (isOpen) {
      setFormError(null);
      setRetryCount(0);
      
      const storedSlotId = localStorage.getItem('selectedAvailabilitySlotId');
      if (storedSlotId) {
        setSelectedSlotId(storedSlotId);
        localStorage.removeItem('selectedAvailabilitySlotId');
      }
      
      const storedDate = localStorage.getItem('selectedAvailabilityDate');
      if (storedDate) {
        setSpecificDate(storedDate);
        console.log('[WeeklyAvailabilityDialog] Retrieved specific date from storage:', storedDate);
        localStorage.removeItem('selectedAvailabilityDate');
      } else {
        setSpecificDate(null);
      }
    }
  }, [isOpen]);

  const handleDeleteSlot = (slotId: string, isRecurring: boolean = false) => {
    if (permissionLevel === 'none' || permissionLevel === 'read') {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to delete availability slots",
        variant: "destructive"
      });
      return;
    }
    
    setSelectedSlotId(slotId);
    setIsDeleteAll(isRecurring);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedSlotId) return;
    
    setIsSubmitting(true);
    try {
      const result = await deleteSlot(selectedSlotId);
      
      if (result.success) {
        setIsDeleteConfirmOpen(false);
        setSelectedSlotId(null);
        onAvailabilityUpdated?.();
        toast({
          title: "Success",
          description: "Availability slot deleted successfully"
        });
        setFormError(null);
      } else {
        setFormError(result.error || "Failed to delete availability slot");
        toast({
          title: "Error",
          description: result.error || "Failed to delete availability slot",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error('[WeeklyAvailabilityDialog] Error deleting availability slot:', err);
      setFormError("Failed to delete availability slot");
      toast({
        title: "Error",
        description: "Failed to delete availability slot",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    refreshAvailability();
    setFormError(null);
  };

  const getDayCode = (day: DayOfWeek): string => {
    const codes: Record<DayOfWeek, string> = {
      monday: 'MO',
      tuesday: 'TU',
      wednesday: 'WE',
      thursday: 'TH',
      friday: 'FR',
      saturday: 'SA',
      sunday: 'SU'
    };
    
    return codes[day] || 'MO';
  };

  const getDayIndex = (day: DayOfWeek): number => {
    const indices: Record<DayOfWeek, number> = {
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
      sunday: 0
    };
    
    return indices[day];
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="text-center py-4">
          <Alert variant="destructive" className="mb-3">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error instanceof Error ? error.message : String(error)}
            </AlertDescription>
          </Alert>
          <Button
            variant="outline"
            className="mt-2"
            onClick={handleRetry}
          >
            Try Again
          </Button>
        </div>
      );
    }
    
    return (
      <DayTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        weeklyAvailability={weeklyAvailability}
        timeZone={timeZone || ''}
        onDeleteSlot={handleDeleteSlot}
        onAddSlot={handleAddSlotWrapper}
        isSubmitting={isSubmitting}
        formError={formError}
        retryCount={retryCount}
        permissionLevel={permissionLevel}
      />
    );
  };

  // Wrapper function to handle adding a slot
  const handleAddSlotWrapper = async (startTime: string, endTime: string) => {
    setFormError(null);
    
    if (!startTime || !endTime) {
      const errorMessage = "Please provide both start and end time";
      setFormError(errorMessage);
      toast({
        title: "Missing Information",
        description: errorMessage,
        variant: "destructive"
      });
      return;
    }
    
    if (startTime >= endTime) {
      const errorMessage = "End time must be later than start time";
      setFormError(errorMessage);
      toast({
        title: "Invalid Time Range",
        description: errorMessage,
        variant: "destructive"
      });
      return;
    }

    if (permissionLevel === 'none' || permissionLevel === 'read') {
      const errorMessage = "You do not have permission to create availability slots";
      setFormError(errorMessage);
      toast({
        title: "Permission Denied",
        description: errorMessage,
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const byDay = getDayCode(activeTab);
      const recurrenceRule = `FREQ=WEEKLY;BYDAY=${byDay}`;
      
      console.log('[WeeklyAvailabilityDialog] Creating slot with:', {
        activeTab,
        startTime,
        endTime,
        timeZone,
        specificDate,
        permissionLevel
      });
      
      // Validate time zone before proceeding
      if (!timeZone) {
        throw new Error("Time zone is not set. Please check your profile settings.");
      }
      
      const result = await createSlot(
        activeTab,
        startTime,
        endTime,
        true,
        recurrenceRule,
        timeZone,
        specificDate
      );
      
      if (result.success) {
        toast({
          title: "Success",
          description: `Weekly availability added for ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`,
        });
        
        await refreshAvailability();
        onAvailabilityUpdated?.();
        setRetryCount(0);
        setFormError(null);
      } else {
        let errorMessage = result.error ?
          String(result.error) :
          "Failed to add availability. Please try again.";
        
        // Improve error messages
        if (errorMessage.includes("overlapping")) {
          errorMessage = "This time slot overlaps with an existing availability slot. Please choose a different time.";
        } else if (errorMessage.includes("permission")) {
          errorMessage = "You don't have permission to create availability for this clinician.";
        } else if (errorMessage.includes("timezone")) {
          errorMessage = "There was an issue with the time zone. Please check your profile settings.";
        }
        
        setFormError(errorMessage);
        setRetryCount(prev => prev + 1);
        
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive"
        });
      }
    } catch (err) {
      let errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      
      // Improve error messages
      if (errorMessage.includes("overlapping")) {
        errorMessage = "This time slot overlaps with an existing availability slot. Please choose a different time.";
      } else if (errorMessage.includes("permission")) {
        errorMessage = "You don't have permission to create availability for this clinician.";
      } else if (errorMessage.includes("timezone")) {
        errorMessage = "There was an issue with the time zone. Please check your profile settings.";
      }
      
      console.error('[WeeklyAvailabilityDialog] Error adding availability slot:', err);
      setFormError(errorMessage);
      setRetryCount(prev => prev + 1);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={() => onClose()}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Weekly Availability Schedule</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            {timeZone && (
              <div className="text-sm text-gray-500 mb-4">
                All times shown in {TimeZoneService.formatTimeZoneDisplay(timeZone)} timezone.
              </div>
            )}
            
            {renderContent()}
          </div>
          
          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <DeleteConfirmationDialog
        isOpen={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        onConfirm={confirmDelete}
        isRecurring={isDeleteAll}
        isSubmitting={isSubmitting}
      />
    </>
  );
};

export default WeeklyAvailabilityDialog;
