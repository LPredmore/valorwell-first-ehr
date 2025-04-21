
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarClock, Plus } from 'lucide-react';
import { AvailabilityProvider, useAvailability } from './AvailabilityContext';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import WeeklyAvailabilitySlot from './WeeklyAvailabilitySlot';
import { extractDayCodes, dayCodeToNumber } from '@/utils/rruleUtils';
import GoogleCalendarConnect from './GoogleCalendarConnect';

interface NewAvailabilityPanelProps {
  clinicianId: string | null;
}

const WeeklyAvailabilityContent = () => {
  const { events, isLoading, addAvailabilitySlot } = useAvailability();
  const [weeklySlots, setWeeklySlots] = useState<Record<number, any[]>>({
    0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: []
  });
  const [enabledDays, setEnabledDays] = useState<boolean[]>([false, true, true, true, true, true, false]);
  
  // Process events into weekly slots
  useEffect(() => {
    if (!events.length) return;
    
    const weeklySlotsByDay: Record<number, any[]> = {
      0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: []
    };
    
    events.forEach(event => {
      if (event.extendedProps?.eventType === 'availability' && 
          event.extendedProps?.recurrenceRule?.rrule?.includes('FREQ=WEEKLY')) {
        const dayCodes = extractDayCodes(event.extendedProps.recurrenceRule.rrule);
        if (dayCodes && dayCodes.length > 0) {
          dayCodes.forEach(dayCode => {
            const dayIndex = dayCodeToNumber(dayCode);
            if (dayIndex !== undefined) {
              const startTime = new Date(event.start).toTimeString().substring(0, 5);
              const endTime = new Date(event.end).toTimeString().substring(0, 5);
              
              weeklySlotsByDay[dayIndex].push({
                id: event.id,
                startTime,
                endTime,
                isGoogleEvent: !!event.extendedProps?.googleEventId
              });
              
              // Ensure this day is enabled
              const newEnabledDays = [...enabledDays];
              newEnabledDays[dayIndex] = true;
              setEnabledDays(newEnabledDays);
            }
          });
        }
      }
    });
    
    setWeeklySlots(weeklySlotsByDay);
  }, [events]);
  
  const handleToggleDay = (dayIndex: number, enabled: boolean) => {
    const newEnabledDays = [...enabledDays];
    newEnabledDays[dayIndex] = enabled;
    setEnabledDays(newEnabledDays);
  };
  
  const handleAddTimeSlot = (dayIndex: number) => {
    // Default values
    const startTime = '09:00';
    const endTime = '17:00';
    
    // Create a new weekly slot through the context
    addAvailabilitySlot(dayIndex, startTime, endTime);
  };
  
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  return (
    <div className="space-y-6">
      {Array.from({ length: 7 }, (_, i) => (
        <div key={i} className="border rounded-lg">
          <div className="p-4 border-b flex justify-between items-center">
            <div className="flex items-center">
              <Switch 
                id={`day-${i}`}
                checked={enabledDays[i]}
                onCheckedChange={(checked) => handleToggleDay(i, checked)}
              />
              <Label 
                htmlFor={`day-${i}`} 
                className={`ml-2 font-medium ${!enabledDays[i] ? 'text-gray-500' : ''}`}
              >
                {dayNames[i]}
              </Label>
            </div>
          </div>
          
          {enabledDays[i] && (
            <div className="p-4 space-y-4">
              {/* Display existing slots */}
              {weeklySlots[i]?.map((slot) => (
                <WeeklyAvailabilitySlot
                  key={slot.id}
                  eventId={slot.id}
                  dayIndex={i}
                  dayName={dayNames[i]}
                  startTime={slot.startTime}
                  endTime={slot.endTime}
                  isGoogleEvent={slot.isGoogleEvent}
                />
              ))}
              
              {/* Add new slot button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddTimeSlot(i)}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Time Slot
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const NewAvailabilityPanel: React.FC<NewAvailabilityPanelProps> = ({ clinicianId }) => {
  const [activeTab, setActiveTab] = useState<string>('weekly');
  
  return (
    <AvailabilityProvider clinicianId={clinicianId}>
      <div className="p-4 bg-white rounded-lg shadow">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Availability</h2>
        </div>

        <div className="mb-4 flex justify-between items-center">
          <Badge variant="outline" className="text-sm">
            Manage Your Availability
          </Badge>
        </div>

        <GoogleCalendarConnect className="mb-6" />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="weekly">Weekly Schedule</TabsTrigger>
            <TabsTrigger value="exceptions">Exceptions</TabsTrigger>
          </TabsList>

          <TabsContent value="weekly">
            <WeeklyAvailabilityContent />
          </TabsContent>

          <TabsContent value="exceptions">
            {/* Exception management will be implemented in the next phase */}
            <div className="text-center p-8 text-gray-500">
              <CalendarClock className="h-12 w-12 mx-auto mb-4" />
              <p className="text-lg font-medium">Coming Soon</p>
              <p>Exception management will be available in the next update.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AvailabilityProvider>
  );
};

export default NewAvailabilityPanel;
