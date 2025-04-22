import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2, Calendar } from 'lucide-react';
import { AvailabilityService } from '@/services/availabilityService';
import { WeeklyAvailability, AvailabilitySlot } from '@/types/appointment';
import { formatTimeZoneDisplay } from '@/utils/timeZoneUtils';
import { useUserTimeZone } from '@/hooks/useUserTimeZone';
import { formatTime12Hour } from '@/utils/timeZoneUtils';
import { DateTime } from 'luxon';

interface WeeklyAvailabilityDialogProps {
  isOpen: boolean;
  onClose: () => void;
  clinicianId: string | null;
  onAvailabilityUpdated: () => void;
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

const WeeklyAvailabilityDialog: React.FC<WeeklyAvailabilityDialogProps> = ({
  isOpen,
  onClose,
  clinicianId,
  onAvailabilityUpdated
}) => {
  const { toast } = useToast();
  const { timeZone } = useUserTimeZone(clinicianId);
  const [activeTab, setActiveTab] = useState('monday');
  const [isLoading, setIsLoading] = useState(false);
  const [weeklyAvailability, setWeeklyAvailability] = useState<WeeklyAvailability>({
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: []
  });
  
  const [newSlotStartTime, setNewSlotStartTime] = useState('09:00');
  const [newSlotEndTime, setNewSlotEndTime] = useState('10:00');
  const [isAddingSlot, setIsAddingSlot] = useState(false);

  useEffect(() => {
    const fetchWeeklyAvailability = async () => {
      if (!clinicianId || !isOpen) return;
      
      setIsLoading(true);
      try {
        const availability = await AvailabilityService.getWeeklyAvailability(clinicianId);
        setWeeklyAvailability(availability);
      } catch (error) {
        console.error('Error fetching weekly availability:', error);
        toast({
          title: 'Error',
          description: 'Failed to load availability settings',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeeklyAvailability();
  }, [clinicianId, isOpen, toast]);

  const handleAddSlot = async () => {
    if (!clinicianId) return;
    
    setIsAddingSlot(true);
    try {
      const today = DateTime.now();
      const dayIndex = dayTabs.findIndex(day => day.id === activeTab);
      const targetDate = today.set({ weekday: ((dayIndex + 1) % 7 || 7) as WeekdayNumbers });
      
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
      
      const slotId = await AvailabilityService.createAvailabilitySlot(
        clinicianId,
        {
          startTime: startDateTime.toISO(),
          endTime: endDateTime.toISO(),
          title: 'Available',
          recurring: false
        }
      );

      if (slotId) {
        toast({
          title: 'Success',
          description: 'Availability slot added successfully'
        });
        
        setWeeklyAvailability(prev => ({
          ...prev,
          [activeTab]: [
            ...prev[activeTab],
            {
              startTime: newSlotStartTime,
              endTime: newSlotEndTime,
              dayOfWeek: activeTab,
              isRecurring: false
            }
          ]
        }));
        
        setNewSlotStartTime('09:00');
        setNewSlotEndTime('10:00');
        
        onAvailabilityUpdated();
      } else {
        throw new Error('Failed to add availability slot');
      }
    } catch (error) {
      console.error('Error adding availability slot:', error);
      toast({
        title: 'Error',
        description: 'Failed to add availability slot',
        variant: 'destructive'
      });
    } finally {
      setIsAddingSlot(false);
    }
  };

  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const formattedHour = hour.toString().padStart(2, '0');
        const formattedMinute = minute.toString().padStart(2, '0');
        options.push(`${formattedHour}:${formattedMinute}`);
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Weekly Availability
            {timeZone && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({formatTimeZoneDisplay(timeZone)})
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid grid-cols-7">
              {dayTabs.map(day => (
                <TabsTrigger key={day.id} value={day.id}>
                  {day.label.substring(0, 3)}
                </TabsTrigger>
              ))}
            </TabsList>

            {dayTabs.map(day => (
              <TabsContent key={day.id} value={day.id} className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">{day.label} Availability</h3>
                </div>

                <div className="space-y-2">
                  {weeklyAvailability[day.id].length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      No availability set for {day.label}
                    </div>
                  ) : (
                    weeklyAvailability[day.id].map((slot, index) => (
                      <div 
                        key={`${day.id}-${index}`}
                        className="flex justify-between items-center border p-3 rounded-md"
                      >
                        <div>
                          <span className="font-medium">
                            {formatTime12Hour(`2000-01-01T${slot.startTime}`)} - {formatTime12Hour(`2000-01-01T${slot.endTime}`)}
                          </span>
                          {slot.isRecurring && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                              Recurring
                            </span>
                          )}
                        </div>
                        <Button size="sm" variant="ghost" className="p-1 h-auto">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>

                <div className="border p-4 rounded-md">
                  <h4 className="text-sm font-medium mb-3">Add Availability Slot</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs text-gray-500">Start Time</label>
                      <select 
                        className="w-full border border-gray-300 rounded-md p-2"
                        value={newSlotStartTime}
                        onChange={(e) => setNewSlotStartTime(e.target.value)}
                      >
                        {timeOptions.map(time => (
                          <option key={`start-${time}`} value={time}>
                            {formatTime12Hour(`2000-01-01T${time}`)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-gray-500">End Time</label>
                      <select 
                        className="w-full border border-gray-300 rounded-md p-2"
                        value={newSlotEndTime}
                        onChange={(e) => setNewSlotEndTime(e.target.value)}
                      >
                        {timeOptions.map(time => (
                          <option key={`end-${time}`} value={time}>
                            {formatTime12Hour(`2000-01-01T${time}`)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <Button 
                    onClick={handleAddSlot}
                    disabled={isAddingSlot}
                    className="mt-4 w-full"
                  >
                    {isAddingSlot ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Slot
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}

        <DialogFooter>
          <Button 
            type="button" 
            onClick={onClose}
            className="w-full"
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WeeklyAvailabilityDialog;
