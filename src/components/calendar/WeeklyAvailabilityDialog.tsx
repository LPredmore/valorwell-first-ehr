
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DayOfWeek, AvailabilitySlot } from '@/types/availability';
import { TimeZoneService } from '@/utils/timeZoneService';
import { useAvailability } from '@/hooks/useAvailability';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2, AlertCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useUserTimeZone } from '@/hooks/useUserTimeZone';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DateTime } from 'luxon';

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
  const [activeTab, setActiveTab] = useState<DayOfWeek>((initialActiveTab || 'monday') as DayOfWeek);
  const [newStartTime, setNewStartTime] = useState('09:00');
  const [newEndTime, setNewEndTime] = useState('10:00');
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

  const formatTimeDisplay = (timeStr: string): string => {
    if (!timeStr) return '';
    return TimeZoneService.formatTime(timeStr, 'h:mm a', timeZone);
  };

  const handleAddSlot = async () => {
    setFormError(null);
    
    if (!newStartTime || !newEndTime) {
      const errorMessage = "Please provide both start and end time";
      setFormError(errorMessage);
      toast({
        title: "Missing Information",
        description: errorMessage,
        variant: "destructive"
      });
      return;
    }
    
    if (newStartTime >= newEndTime) {
      const errorMessage = "End time must be later than start time";
      setFormError(errorMessage);
      toast({
        title: "Invalid Time Range",
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
        newStartTime,
        newEndTime,
        timeZone,
        specificDate
      });
      
      const result = await createSlot(
        activeTab,
        newStartTime,
        newEndTime,
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
        setNewStartTime('09:00');
        setNewEndTime('10:00');
      } else {
        const errorMessage = result.error ? 
          String(result.error) : 
          "Failed to add availability. Please try again.";
        
        setFormError(errorMessage);
        setRetryCount(prev => prev + 1);
        
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive"
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
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

  const handleDeleteSlot = (slotId: string, isRecurring: boolean = false) => {
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

  const renderSlotList = (slots: AvailabilitySlot[] = []) => {
    const availabilitySlots = slots.filter(slot => !slot.isAppointment);
    const appointmentSlots = slots.filter(slot => slot.isAppointment);
    
    if (availabilitySlots.length === 0 && appointmentSlots.length === 0) {
      return (
        <div className="text-center text-gray-500 py-4">
          No availability slots set for this day.
        </div>
      );
    }
    
    return (
      <>
        {availabilitySlots.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2">Available Times</h4>
            <ul className="space-y-2">
              {availabilitySlots.map(slot => (
                <li key={slot.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md border">
                  <span className="text-sm">
                    {formatTimeDisplay(slot.startTime)} - {formatTimeDisplay(slot.endTime)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteSlot(slot.id, slot.isRecurring)}
                    title={slot.isRecurring ? "Delete this recurring availability slot" : "Delete this availability slot"}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {appointmentSlots.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 text-blue-600">Scheduled Appointments</h4>
            <ul className="space-y-2">
              {appointmentSlots.map(slot => (
                <li key={slot.id} className="p-2 bg-blue-50 rounded-md border border-blue-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">
                      {formatTimeDisplay(slot.startTime)} - {formatTimeDisplay(slot.endTime)}
                    </span>
                    <span className="text-xs px-2 py-1 bg-blue-100 rounded-full">
                      Appointment
                    </span>
                  </div>
                  {slot.clientName && (
                    <div className="text-xs text-gray-600 mt-1">
                      Client: {slot.clientName}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </>
    );
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
      <Tabs defaultValue={activeTab} onValueChange={(value) => setActiveTab(value as DayOfWeek)}>
        <TabsList className="grid grid-cols-7">
          <TabsTrigger value="monday">Mon</TabsTrigger>
          <TabsTrigger value="tuesday">Tue</TabsTrigger>
          <TabsTrigger value="wednesday">Wed</TabsTrigger>
          <TabsTrigger value="thursday">Thu</TabsTrigger>
          <TabsTrigger value="friday">Fri</TabsTrigger>
          <TabsTrigger value="saturday">Sat</TabsTrigger>
          <TabsTrigger value="sunday">Sun</TabsTrigger>
        </TabsList>
        
        {weeklyAvailability && Object.keys(weeklyAvailability).map((day) => (
          <TabsContent key={day} value={day} className="p-4 bg-white border rounded-md mt-4">
            <h3 className="text-lg font-semibold mb-4 capitalize">{day}</h3>
            
            {renderSlotList(weeklyAvailability[day as DayOfWeek])}
            
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
                onClick={handleAddSlot} 
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

              {retryCount > 1 && (
                <div className="mt-3 p-2 bg-gray-50 rounded-md text-xs text-gray-600">
                  <p className="font-medium">Troubleshooting Tips:</p>
                  <ul className="list-disc list-inside mt-1">
                    <li>Ensure the start time is before the end time</li>
                    <li>Check for time slot conflicts</li>
                    <li>Verify your timezone settings in profile</li>
                    <li>Try refreshing the page if the issue persists</li>
                  </ul>
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    );
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
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
      
      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isDeleteAll ? "Delete Recurring Availability" : "Delete Availability Slot"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isDeleteAll
                ? "This will delete all instances of this recurring availability slot. Are you sure?"
                : "Are you sure you want to delete this availability slot?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default WeeklyAvailabilityDialog;
