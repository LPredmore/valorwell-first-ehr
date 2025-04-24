import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Calendar, AlertCircle } from 'lucide-react';
import { AvailabilityService } from '@/services/availabilityService';
import { WeeklyAvailability, AvailabilitySlot as AvailabilitySlotType } from '@/types/appointment';
import { formatTimeZoneDisplay } from '@/utils/timeZoneUtils';
import { useUserTimeZone } from '@/hooks/useUserTimeZone';
import { formatTime12Hour } from '@/utils/timeZoneUtils';
import { DateTime } from 'luxon';
import { WeekdayNumbers } from '@/types/calendar';
import { createEmptyWeeklyAvailability } from '@/utils/availabilityUtils';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import AvailabilitySlot from './AvailabilitySlot';
import AvailabilityEditForm from './AvailabilityEditForm';

interface WeeklyAvailabilityDialogProps {
  isOpen: boolean;
  onClose: () => void;
  clinicianId: string | null;
  onAvailabilityUpdated: () => void;
  initialActiveTab?: string;
}

interface DatabaseAvailabilitySlot extends AvailabilitySlotType {
  id?: string;
  startTime: string;
  endTime: string;
  dayOfWeek: string;
  isRecurring?: boolean;
}

interface TimeOption {
  value: string;
  display: string;
}

const dayTabs = [
  { id: 'monday', label: 'Monday' },
  { id: 'tuesday', label: 'Tuesday' },
  { id: 'wednesday', label: 'Wednesday' },
  { id: 'thursday', label: 'Thursday' },
  { id: 'friday', label: 'Friday' },
  { id: 'saturday', label: 'Saturday' },
  { id: 'sunday', label: 'Sunday' }
];

export default function WeeklyAvailabilityDialog({
  isOpen,
  onClose,
  clinicianId,
  onAvailabilityUpdated,
  initialActiveTab = 'monday'
}: WeeklyAvailabilityDialogProps) {
  const { toast } = useToast();
  const { timeZone } = useUserTimeZone(clinicianId);
  const [activeTab, setActiveTab] = useState(initialActiveTab);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [weeklyAvailability, setWeeklyAvailability] = useState<Record<string, DatabaseAvailabilitySlot[]>>(
    createEmptyWeeklyAvailability()
  );
  
  const [newSlotStartTime, setNewSlotStartTime] = useState('09:00');
  const [newSlotEndTime, setNewSlotEndTime] = useState('10:00');
  const [isAddingSlot, setIsAddingSlot] = useState(false);

  const [generalSettings, setGeneralSettings] = useState({
    minNoticeDays: 1,
    maxAdvanceDays: 30
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const [editingSlot, setEditingSlot] = useState<DatabaseAvailabilitySlot | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editStartTime, setEditStartTime] = useState('09:00');
  const [editEndTime, setEditEndTime] = useState('10:00');
  const [isDeleting, setIsDeleting] = useState(false);

  const timeOptions = useMemo(() => {
    const options: TimeOption[] = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute of [0, 30]) {
        const formattedHour = hour.toString().padStart(2, '0');
        const formattedMinute = minute.toString().padStart(2, '0');
        const timeValue = `${formattedHour}:${formattedMinute}`;
        
        const displayValue = formatTime12Hour(timeValue);
        
        options.push({
          value: timeValue,
          display: displayValue
        });
      }
    }
    
    console.log("[WeeklyAvailabilityDialog] Time options generated:", options.length);
    return options;
  }, []);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!clinicianId) return;
      
      setIsLoading(true);
      try {
        const settings = await AvailabilityService.getSettings(clinicianId);
        if (settings) {
          setGeneralSettings({
            minNoticeDays: settings.minNoticeDays,
            maxAdvanceDays: settings.maxAdvanceDays
          });
          console.log('[WeeklyAvailabilityDialog] Loaded settings:', settings);
        }
      } catch (error) {
        console.error('[WeeklyAvailabilityDialog] Error fetching availability settings:', error);
        toast({
          title: 'Error',
          description: 'Failed to load availability settings',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen && clinicianId) {
      fetchSettings();
    }
  }, [clinicianId, isOpen, toast]);

  useEffect(() => {
    if (isOpen) {
      console.log('[WeeklyAvailabilityDialog] Dialog opened, reloading availability');
      reloadWeeklyAvailability();
    }
    // eslint-disable-next-line
  }, [clinicianId, isOpen, toast]);

  useEffect(() => {
    if (isOpen && initialActiveTab) {
      console.log(`[WeeklyAvailabilityDialog] Setting active tab to: ${initialActiveTab}`);
      setActiveTab(initialActiveTab);
    }
  }, [isOpen, initialActiveTab]);

  useEffect(() => {
    if (isOpen && clinicianId) {
      const selectedSlotId = localStorage.getItem('selectedAvailabilitySlotId');
      
      if (selectedSlotId) {
        console.log(`[WeeklyAvailabilityDialog] Found stored slot ID: ${selectedSlotId}`);
        // Find and set the slot for editing
        const allSlots = Object.values(weeklyAvailability).flat();
        const selectedSlot = allSlots.find(slot => slot.id === selectedSlotId);
        
        if (selectedSlot) {
          console.log('[WeeklyAvailabilityDialog] Slot found, setting for editing:', selectedSlot);
          handleEditSlot(selectedSlot);
          // Set active tab to the day of the selected slot
          setActiveTab(selectedSlot.dayOfWeek);
        } else {
          console.log(`[WeeklyAvailabilityDialog] No slot found with ID ${selectedSlotId} in available slots:`, allSlots);
        }
        
        // Clear the stored ID after loading
        localStorage.removeItem('selectedAvailabilitySlotId');
      }
    }
  }, [isOpen, clinicianId, weeklyAvailability]);

  const reloadWeeklyAvailability = async () => {
    if (!clinicianId) {
      console.log('[WeeklyAvailabilityDialog] No clinician ID, skipping load');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      console.log(`[WeeklyAvailabilityDialog] Loading availability for clinician: ${clinicianId}`);
      const availability = await AvailabilityService.getWeeklyAvailability(clinicianId);
      setWeeklyAvailability(availability);
      console.log('[WeeklyAvailabilityDialog] Loaded weekly availability:', availability);
    } catch (error) {
      console.error('[WeeklyAvailabilityDialog] Error fetching weekly availability:', error);
      setError(error instanceof Error ? error : new Error('Failed to load availability settings'));
      toast({
        title: 'Error',
        description: 'Failed to load availability settings',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSlot = async () => {
    if (!clinicianId) return;
    
    if (newSlotStartTime === newSlotEndTime) {
      toast({
        title: 'Invalid Time Range',
        description: 'Start and end times cannot be the same.',
        variant: 'destructive'
      });
      return;
    }
    
    setIsAddingSlot(true);
    setError(null);
    try {
      const today = DateTime.now();
      const dayIndex = dayTabs.findIndex(day => day.id === activeTab);
      const targetDate = today.set({ 
        weekday: dayIndex + 1 as WeekdayNumbers
      });
      
      const startDateTime = targetDate.set({
        hour: parseInt(newSlotStartTime.split(':')[0]),
        minute: parseInt(newSlotStartTime.split(':')[1]),
        second: 0,
        millisecond: 0
      });
      
      const endDateTime = targetDate.set({
        hour: parseInt(newSlotEndTime.split(':')[0]),
        minute: parseInt(newSlotEndTime.split(':')[1]),
        second: 0,
        millisecond: 0
      });

      if (endDateTime <= startDateTime) {
        throw new Error('End time must be after start time');
      }

      console.log('[WeeklyAvailabilityDialog] Creating slot for:', {
        day: activeTab, 
        startTime: startDateTime.toISO(),
        endTime: endDateTime.toISO(),
        timeZone
      });

      const slotId = await AvailabilityService.createAvailabilitySlot(
        clinicianId,
        {
          startTime: startDateTime.toISO(),
          endTime: endDateTime.toISO(),
          title: 'Available',
          recurring: true,
          recurrenceRule: `FREQ=WEEKLY;BYDAY=${activeTab.substring(0, 2).toUpperCase()}`
        }
      );

      if (slotId) {
        toast({
          title: 'Success',
          description: 'Availability slot added successfully'
        });
        await reloadWeeklyAvailability();
        setNewSlotStartTime('09:00');
        setNewSlotEndTime('10:00');
        onAvailabilityUpdated();
      } else {
        throw new Error('Failed to add availability slot');
      }
    } catch (error) {
      console.error('[WeeklyAvailabilityDialog] Error adding availability slot:', error);
      setError(error instanceof Error ? error : new Error('Failed to add availability slot'));
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add availability slot',
        variant: 'destructive'
      });
    } finally {
      setIsAddingSlot(false);
    }
  };

  const handleEditSlot = (slot: DatabaseAvailabilitySlot) => {
    console.log('[WeeklyAvailabilityDialog] Editing slot:', slot);
    setEditingSlot(slot);
    setEditStartTime(slot.startTime);
    setEditEndTime(slot.endTime);
    setIsEditing(true);
  };

  const handleSaveSlot = async () => {
    if (!editingSlot?.id) return;
    
    if (editStartTime === editEndTime) {
      toast({
        title: 'Invalid Time Range',
        description: 'Start and end times cannot be the same.',
        variant: 'destructive'
      });
      return;
    }
    
    setIsSaving(true);
    try {
      const today = DateTime.now();
      const dayIndex = dayTabs.findIndex(day => day.id === activeTab);
      const targetDate = today.set({ 
        weekday: dayIndex + 1 as WeekdayNumbers
      });
      
      // Create Luxon DateTime objects with the correct timezone
      const startDateTime = targetDate.set({
        hour: parseInt(editStartTime.split(':')[0]),
        minute: parseInt(editStartTime.split(':')[1]),
        second: 0,
        millisecond: 0
      });
      
      const endDateTime = targetDate.set({
        hour: parseInt(editEndTime.split(':')[0]),
        minute: parseInt(editEndTime.split(':')[1]),
        second: 0,
        millisecond: 0
      });

      if (endDateTime <= startDateTime) {
        throw new Error('End time must be after start time');
      }

      console.log('[WeeklyAvailabilityDialog] Updating slot:', {
        id: editingSlot.id,
        startTime: startDateTime.toISO(),
        endTime: endDateTime.toISO()
      });

      const success = await AvailabilityService.updateAvailabilitySlot(
        editingSlot.id,
        {
          startTime: startDateTime.toISO(),
          endTime: endDateTime.toISO()
        },
        editingSlot.isRecurring || false
      );

      if (success) {
        toast({
          title: 'Success',
          description: 'Availability slot updated successfully'
        });
        setIsEditing(false);
        setEditingSlot(null);
        await reloadWeeklyAvailability();
        onAvailabilityUpdated();
      } else {
        throw new Error('Failed to update availability slot');
      }
    } catch (error) {
      console.error('[WeeklyAvailabilityDialog] Error updating availability slot:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update availability slot',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSlot = async () => {
    if (!editingSlot?.id) return;
    
    setIsDeleting(true);
    try {
      console.log('[WeeklyAvailabilityDialog] Deleting slot:', editingSlot.id);
      
      // For simplicity we're using the updateAvailabilitySlot method with is_active=false
      // This is effectively a soft delete as implemented in the service
      const success = await AvailabilityService.updateAvailabilitySlot(
        editingSlot.id,
        {}, // Empty update will set is_active=false in the service
        editingSlot.isRecurring || false
      );

      if (success) {
        toast({
          title: 'Success',
          description: 'Availability slot removed successfully'
        });
        setIsEditing(false);
        setEditingSlot(null);
        await reloadWeeklyAvailability();
        onAvailabilityUpdated();
      } else {
        throw new Error('Failed to remove availability slot');
      }
    } catch (error) {
      console.error('[WeeklyAvailabilityDialog] Error deleting availability slot:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete availability slot',
        variant: 'destructive'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCloseDialog = () => {
    // Clear any editing state
    setEditingSlot(null);
    setIsEditing(false);
    
    // Clear any stored IDs in localStorage to prevent stale data
    localStorage.removeItem('selectedAvailabilitySlotId');
    
    // Call the parent's onClose function
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCloseDialog}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Weekly Availability</span>
            {timeZone && (
              <span className="text-sm font-normal text-gray-500">
                Showing times in {formatTimeZoneDisplay(timeZone)}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="py-8 flex justify-center items-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-2">Loading availability...</span>
          </div>
        ) : error ? (
          <div className="p-4 border border-red-300 bg-red-50 rounded-md flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <div>
              <h4 className="font-semibold text-red-700">Error loading availability</h4>
              <p className="text-red-600 text-sm">{error.message || 'Please try again.'}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={reloadWeeklyAvailability}
              >
                Retry
              </Button>
            </div>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
            <TabsList className="mb-4 grid grid-cols-7 h-auto">
              {dayTabs.map(day => (
                <TabsTrigger 
                  key={day.id} 
                  value={day.id}
                  className="py-2"
                >
                  {day.label}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {dayTabs.map(day => (
              <TabsContent key={day.id} value={day.id} className="space-y-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">{day.label} Availability</h3>
                  
                  {weeklyAvailability[day.id].length === 0 ? (
                    <div className="text-gray-500 text-center py-4 border border-dashed border-gray-300 rounded-md">
                      No availability set for {day.label}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {weeklyAvailability[day.id].map((slot, index) => (
                        <div 
                          key={slot.id || index} 
                          className="p-3 border border-gray-200 rounded-md flex justify-between items-center hover:bg-gray-50"
                        >
                          <div>
                            <span className="font-medium">
                              {formatTime12Hour(slot.startTime)} - {formatTime12Hour(slot.endTime)}
                            </span>
                            {slot.isRecurring && (
                              <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                Recurring
                              </span>
                            )}
                          </div>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleEditSlot(slot)}
                          >
                            Edit
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="p-4 border border-gray-200 rounded-md mt-4">
                    <h4 className="font-medium mb-3">Add New Availability Slot</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`start-time-${day.id}`}>Start Time</Label>
                        <select 
                          id={`start-time-${day.id}`}
                          value={newSlotStartTime}
                          onChange={(e) => setNewSlotStartTime(e.target.value)}
                          className="w-full border border-gray-300 rounded-md p-2 mt-1"
                          disabled={isAddingSlot}
                        >
                          {timeOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>
                              {opt.display}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label htmlFor={`end-time-${day.id}`}>End Time</Label>
                        <select 
                          id={`end-time-${day.id}`}
                          value={newSlotEndTime}
                          onChange={(e) => setNewSlotEndTime(e.target.value)}
                          className="w-full border border-gray-300 rounded-md p-2 mt-1"
                          disabled={isAddingSlot}
                        >
                          {timeOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>
                              {opt.display}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <Button 
                      onClick={handleAddSlot} 
                      className="mt-4 w-full"
                      disabled={isAddingSlot}
                    >
                      {isAddingSlot ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Availability
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
        
        {isEditing && editingSlot && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold mb-4">Edit Availability Slot</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-start-time">Start Time</Label>
                  <select 
                    id="edit-start-time"
                    value={editStartTime}
                    onChange={(e) => setEditStartTime(e.target.value)}
                    className="w-full border border-gray-300 rounded-md p-2 mt-1"
                    disabled={isSaving || isDeleting}
                  >
                    {timeOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.display}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="edit-end-time">End Time</Label>
                  <select 
                    id="edit-end-time"
                    value={editEndTime}
                    onChange={(e) => setEditEndTime(e.target.value)}
                    className="w-full border border-gray-300 rounded-md p-2 mt-1"
                    disabled={isSaving || isDeleting}
                  >
                    {timeOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.display}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {editingSlot.isRecurring && (
                <div className="mt-4 p-2 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800">
                  <Calendar className="h-4 w-4 inline-block mr-1" />
                  This is a recurring availability slot. Changes will apply to all future occurrences.
                </div>
              )}
              
              <div className="flex justify-between mt-6">
                <Button 
                  variant="destructive"
                  onClick={handleDeleteSlot}
                  disabled={isSaving || isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      Removing...
                    </>
                  ) : 'Remove'}
                </Button>
                
                <div className="space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditing(false)}
                    disabled={isSaving || isDeleting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSaveSlot}
                    disabled={isSaving || isDeleting}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Saving...
                      </>
                    ) : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={handleCloseDialog}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
