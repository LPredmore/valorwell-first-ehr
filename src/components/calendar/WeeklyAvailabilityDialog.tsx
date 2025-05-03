
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { TimeZoneService } from '@/utils/timezone';
import { useAvailability } from '@/hooks/useAvailability';
import { DayOfWeek, WeeklyAvailability as WeeklyAvailType } from '@/types/availability';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface WeeklyAvailabilityDialogProps {
  clinicianId?: string;
  onAvailabilityUpdated?: (availability: WeeklyAvailType) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const dayTabs = [
  { id: 'monday', label: 'Mon' },
  { id: 'tuesday', label: 'Tue' },
  { id: 'wednesday', label: 'Wed' },
  { id: 'thursday', label: 'Thu' },
  { id: 'friday', label: 'Fri' },
  { id: 'saturday', label: 'Sat' },
  { id: 'sunday', label: 'Sun' },
];

const WeeklyAvailabilityDialog: React.FC<WeeklyAvailabilityDialogProps> = ({
  clinicianId,
  onAvailabilityUpdated,
  isOpen = false,
  onClose = () => {}
}) => {
  const { toast } = useToast();
  const { createSlot, weeklyAvailability, deleteSlot, refreshAvailability } = useAvailability(clinicianId || null);

  const [activeTab, setActiveTab] = useState<DayOfWeek>('monday');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [timeZone, setTimeZone] = useState(TimeZoneService.getUserTimeZone());
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && clinicianId) {
      refreshAvailability();
    }
  }, [isOpen, clinicianId, refreshAvailability]);

  const handleAddAvailability = async () => {
    if (!clinicianId) {
      toast({
        title: 'Error',
        description: 'Clinician ID is required',
        variant: 'destructive'
      });
      return;
    }

    if (!startTime || !endTime) {
      toast({
        title: 'Error',
        description: 'Please select both start and end times',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const result = await createSlot(
        activeTab,
        startTime,
        endTime,
        true, // Recurring availability
        undefined, // No recurrence rule for now
        timeZone
      );

      if (result.success) {
        toast({
          title: 'Success',
          description: `Availability added for ${activeTab}`,
        });
        
        await refreshAvailability();
        setIsAdding(false);
        setStartTime('09:00');
        setEndTime('17:00');
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to create availability',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error creating availability:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    try {
      const result = await deleteSlot(slotId);
      
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Availability removed',
        });
        
        await refreshAvailability();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to remove availability',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error deleting availability slot:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive'
      });
    }
  };

  // Format time for display
  const formatTimeDisplay = (time: string): string => {
    try {
      const [hours, minutes] = time.split(':').map(Number);
      const hour = hours % 12 || 12;
      const ampm = hours >= 12 ? 'PM' : 'AM';
      return `${hour}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    } catch (e) {
      return time;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Weekly Availability</DialogTitle>
          <DialogDescription>
            Set your recurring weekly availability. These time slots will appear as available on your calendar.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as DayOfWeek)} className="w-full">
          <TabsList className="grid grid-cols-7 mb-4">
            {dayTabs.map(day => (
              <TabsTrigger key={day.id} value={day.id} className="text-xs">
                {day.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {dayTabs.map(day => (
            <TabsContent key={day.id} value={day.id} className="mt-0">
              <Card>
                <CardContent className="pt-4">
                  <h3 className="font-semibold mb-4 capitalize">{day.id}</h3>
                  
                  {/* List of availability slots */}
                  {weeklyAvailability && weeklyAvailability[day.id]?.length > 0 ? (
                    <div className="space-y-2 mb-4">
                      {weeklyAvailability[day.id].map((slot, index) => (
                        <div key={`${slot.id || index}`} className="flex items-center justify-between p-2 bg-muted rounded-md">
                          <div>
                            <Badge variant="outline" className="mr-2">Recurring</Badge>
                            <span className="text-sm">
                              {formatTimeDisplay(slot.startTime)} - {formatTimeDisplay(slot.endTime)}
                            </span>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => slot.id && handleDeleteSlot(slot.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm mb-4">No availability set for this day.</p>
                  )}
                  
                  {!isAdding ? (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setIsAdding(true)}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Availability
                    </Button>
                  ) : (
                    <div className={cn("space-y-4")}>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="startTime">Start Time</Label>
                          <Input 
                            id="startTime"
                            type="time" 
                            value={startTime} 
                            onChange={(e) => setStartTime(e.target.value)} 
                          />
                        </div>
                        <div>
                          <Label htmlFor="endTime">End Time</Label>
                          <Input 
                            id="endTime"
                            type="time" 
                            value={endTime} 
                            onChange={(e) => setEndTime(e.target.value)} 
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="timezone">Time Zone</Label>
                        <Select 
                          value={timeZone} 
                          onValueChange={setTimeZone}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select timezone" />
                          </SelectTrigger>
                          <SelectContent>
                            {TimeZoneService.TIMEZONE_OPTIONS.map((tz) => (
                              <SelectItem key={tz.value} value={tz.value}>
                                {tz.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex justify-end gap-2 pt-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setIsAdding(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          size="sm"
                          onClick={handleAddAvailability}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? 'Adding...' : 'Add'}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
        
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WeeklyAvailabilityDialog;
