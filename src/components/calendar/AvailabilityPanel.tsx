
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Clock, Plus, X, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
}

interface DaySchedule {
  day: string;
  isOpen: boolean;
  timeSlots: TimeSlot[];
}

const AvailabilityPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('set');
  const [availabilityEnabled, setAvailabilityEnabled] = useState(true);
  
  // Initialize a schedule for each day of the week
  const [weekSchedule, setWeekSchedule] = useState<DaySchedule[]>([
    { day: 'Monday', isOpen: true, timeSlots: [{ id: 'mon-1', startTime: '09:00', endTime: '17:00' }] },
    { day: 'Tuesday', isOpen: true, timeSlots: [{ id: 'tue-1', startTime: '09:00', endTime: '17:00' }] },
    { day: 'Wednesday', isOpen: true, timeSlots: [{ id: 'wed-1', startTime: '09:00', endTime: '17:00' }] },
    { day: 'Thursday', isOpen: true, timeSlots: [{ id: 'thu-1', startTime: '09:00', endTime: '17:00' }] },
    { day: 'Friday', isOpen: true, timeSlots: [{ id: 'fri-1', startTime: '09:00', endTime: '17:00' }] },
    { day: 'Saturday', isOpen: false, timeSlots: [] },
    { day: 'Sunday', isOpen: false, timeSlots: [] },
  ]);
  
  // Toggle day collapsible
  const toggleDayOpen = (dayIndex: number) => {
    setWeekSchedule(prev => {
      const updated = [...prev];
      updated[dayIndex] = {
        ...updated[dayIndex],
        isOpen: !updated[dayIndex].isOpen
      };
      return updated;
    });
  };
  
  // Add a new time slot to a specific day
  const addTimeSlot = (dayIndex: number) => {
    setWeekSchedule(prev => {
      const updated = [...prev];
      const day = updated[dayIndex];
      const newId = `${day.day.toLowerCase().substring(0,3)}-${day.timeSlots.length + 1}`;
      
      updated[dayIndex] = {
        ...day,
        timeSlots: [
          ...day.timeSlots, 
          { 
            id: newId, 
            startTime: '09:00', 
            endTime: '17:00' 
          }
        ]
      };
      
      return updated;
    });
  };
  
  // Delete a time slot from a specific day
  const deleteTimeSlot = (dayIndex: number, slotId: string) => {
    setWeekSchedule(prev => {
      const updated = [...prev];
      const day = updated[dayIndex];
      
      updated[dayIndex] = {
        ...day,
        timeSlots: day.timeSlots.filter(slot => slot.id !== slotId)
      };
      
      return updated;
    });
  };
  
  // Update time slot time
  const updateTimeSlot = (dayIndex: number, slotId: string, field: 'startTime' | 'endTime', value: string) => {
    setWeekSchedule(prev => {
      const updated = [...prev];
      const day = updated[dayIndex];
      
      updated[dayIndex] = {
        ...day,
        timeSlots: day.timeSlots.map(slot => 
          slot.id === slotId ? { ...slot, [field]: value } : slot
        )
      };
      
      return updated;
    });
  };
  
  // Toggle availability for a day
  const toggleDayAvailability = (dayIndex: number) => {
    setWeekSchedule(prev => {
      const updated = [...prev];
      updated[dayIndex] = {
        ...updated[dayIndex],
        isOpen: !updated[dayIndex].isOpen
      };
      return updated;
    });
  };
  
  // Generate time options for select
  const timeOptions = Array.from({ length: 24 * 4 }, (_, i) => {
    const hour = Math.floor(i / 4);
    const minute = (i % 4) * 15;
    const hourFormatted = hour.toString().padStart(2, '0');
    const minuteFormatted = minute.toString().padStart(2, '0');
    return `${hourFormatted}:${minuteFormatted}`;
  });
  
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Availability
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm">Enabled</span>
            <Switch 
              checked={availabilityEnabled} 
              onCheckedChange={setAvailabilityEnabled} 
            />
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="set">Set Hours</TabsTrigger>
            <TabsTrigger value="share">Share Link</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      
      <CardContent>
        {activeTab === 'set' && (
          <div className="space-y-4">
            <div className="space-y-2">
              {weekSchedule.map((day, index) => (
                <Collapsible 
                  key={day.day} 
                  open={day.isOpen}
                  onOpenChange={() => toggleDayOpen(index)}
                  className="border rounded-md overflow-hidden"
                >
                  <div className="flex items-center justify-between p-3 bg-gray-50">
                    <div className="flex items-center gap-2">
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          {day.isOpen ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      <Badge variant="outline" className="font-medium">
                        {day.day}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => addTimeSlot(index)}
                        className="h-8 w-8 p-0"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <CollapsibleContent>
                    <div className="p-3 space-y-2">
                      {day.timeSlots.length === 0 ? (
                        <div className="text-sm text-gray-500 text-center py-2">
                          No time slots added. Click the + button to add one.
                        </div>
                      ) : (
                        day.timeSlots.map((slot) => (
                          <div key={slot.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                            <div className="grid grid-cols-2 gap-2 flex-1">
                              <Select
                                value={slot.startTime}
                                onValueChange={(value) => updateTimeSlot(index, slot.id, 'startTime', value)}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue placeholder="Start time" />
                                </SelectTrigger>
                                <SelectContent>
                                  {timeOptions.map((time) => (
                                    <SelectItem key={`start-${time}`} value={time}>
                                      {time}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              
                              <Select
                                value={slot.endTime}
                                onValueChange={(value) => updateTimeSlot(index, slot.id, 'endTime', value)}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue placeholder="End time" />
                                </SelectTrigger>
                                <SelectContent>
                                  {timeOptions.map((time) => (
                                    <SelectItem key={`end-${time}`} value={time}>
                                      {time}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteTimeSlot(index, slot.id)}
                              className="h-8 w-8 p-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
            
            <Button className="w-full">
              Save Availability
            </Button>
          </div>
        )}
        
        {activeTab === 'share' && (
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              Share this link with your clients so they can book appointments during your available hours.
            </div>
            
            <div className="flex gap-2 p-2 border rounded-md">
              <div className="text-sm flex-1 truncate">
                https://valorwell.app/book/clinician123
              </div>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            
            <Button className="w-full">
              Generate New Link
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AvailabilityPanel;
