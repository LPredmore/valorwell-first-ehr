
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAvailability } from './AvailabilityContext';
import { CalendarClock, RefreshCw, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import WeeklyAvailabilitySlot, { WeeklyAvailabilitySlotProps } from './WeeklyAvailabilitySlot';
import GoogleCalendarConnect from './GoogleCalendarConnect';

interface NewAvailabilityPanelProps {
  clinicianId: string;
}

const dayIndexToName = (dayIndex: number): string => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayIndex];
};

const extractAvailabilityProps = (event: any): WeeklyAvailabilitySlotProps | null => {
  if (!event || !event.extendedProps || event.extendedProps.eventType !== 'availability') {
    return null;
  }

  try {
    const availabilityBlock = event.extendedProps?.availabilityBlock;
    if (!availabilityBlock) return null;

    // Extract day index from the event
    let dayIndex = 0;
    
    if (availabilityBlock.dayOfWeek) {
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      dayIndex = dayNames.indexOf(availabilityBlock.dayOfWeek.toLowerCase());
    } else if (event.start && event.start instanceof Date) {
      dayIndex = event.start.getDay(); // 0 = Sunday, 1 = Monday, etc.
    }
    
    if (dayIndex < 0) dayIndex = 0; // Fallback to Sunday if invalid

    return {
      dayIndex,
      dayName: dayIndexToName(dayIndex),
      eventId: event.id,
      startTime: availabilityBlock.startTime,
      endTime: availabilityBlock.endTime,
      isGoogleEvent: !!event.extendedProps?.isGoogleEvent || !!event.extendedProps?.googleEventId
    };
  } catch (error) {
    console.error('Error extracting availability props:', error, event);
    return null;
  }
};

const NewAvailabilityPanel: React.FC<NewAvailabilityPanelProps> = ({ clinicianId }) => {
  const [selectedDay, setSelectedDay] = useState<string>('1'); // Default to Monday
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('10:00');
  const [isAdding, setIsAdding] = useState(false);

  const { 
    events, 
    isLoading, 
    refreshEvents, 
    addAvailabilitySlot, 
    hasNoEvents,
    error
  } = useAvailability();
  const { toast } = useToast();

  // Filter for availability events only
  const availabilityEvents = events.filter(
    event => event.extendedProps?.eventType === 'availability'
  );

  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const hourStr = hour.toString().padStart(2, '0');
        const minuteStr = minute.toString().padStart(2, '0');
        options.push(`${hourStr}:${minuteStr}`);
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  const handleAddSlot = async () => {
    try {
      setIsAdding(true);
      
      // Basic validation
      if (startTime >= endTime) {
        toast({
          title: "Invalid Time Range",
          description: "End time must be after start time",
          variant: "destructive"
        });
        return;
      }
      
      await addAvailabilitySlot(parseInt(selectedDay), startTime, endTime);
      
      // Reset form to default values
      setStartTime('09:00');
      setEndTime('10:00');
      
    } catch (error) {
      console.error('Error adding availability slot:', error);
      toast({
        title: "Error",
        description: "Failed to add availability slot. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-semibold flex items-center">
            <CalendarClock className="h-5 w-5 mr-2" /> 
            Availability Management
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => refreshEvents()}
            disabled={isLoading}
            title="Refresh Availability"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Error state */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <p className="text-red-700 text-sm font-medium">Error loading availability</p>
            </div>
            <p className="text-red-600 text-sm mt-1">{error.message}</p>
          </div>
        )}
        
        {/* Show message if no events are found */}
        {hasNoEvents && !isLoading && !error && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-amber-600 mr-2" />
              <p className="text-amber-700 text-sm font-medium">No availability found</p>
            </div>
            <p className="text-amber-600 text-sm mt-1">
              No availability slots have been set up yet. Use the form below to add your weekly availability.
            </p>
          </div>
        )}

        {/* Add new slot form */}
        <div className="space-y-4 mb-8">
          <h3 className="text-md font-medium">Add Weekly Availability Slot</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="day">Day of Week</Label>
              <Select value={selectedDay} onValueChange={setSelectedDay}>
                <SelectTrigger id="day">
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Sunday</SelectItem>
                  <SelectItem value="1">Monday</SelectItem>
                  <SelectItem value="2">Tuesday</SelectItem>
                  <SelectItem value="3">Wednesday</SelectItem>
                  <SelectItem value="4">Thursday</SelectItem>
                  <SelectItem value="5">Friday</SelectItem>
                  <SelectItem value="6">Saturday</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="start-time">Start Time</Label>
              <Select value={startTime} onValueChange={setStartTime}>
                <SelectTrigger id="start-time">
                  <SelectValue placeholder="Select start time" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map(time => (
                    <SelectItem key={`start-${time}`} value={time}>{time}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-time">End Time</Label>
              <Select value={endTime} onValueChange={setEndTime}>
                <SelectTrigger id="end-time">
                  <SelectValue placeholder="Select end time" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map(time => (
                    <SelectItem key={`end-${time}`} value={time}>{time}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={handleAddSlot} 
            disabled={isLoading || isAdding}
            className="mt-2"
          >
            {isAdding ? "Adding..." : "Add Availability Slot"}
          </Button>
        </div>

        {/* Current slots */}
        <div>
          <h3 className="text-md font-medium mb-4">Current Weekly Availability</h3>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="flex flex-col items-center">
                <RefreshCw className="h-6 w-6 animate-spin text-gray-500" />
                <p className="text-sm text-gray-500 mt-2">Loading availability...</p>
              </div>
            </div>
          ) : availabilityEvents.length === 0 ? (
            <div className="text-center py-8 border rounded-md bg-gray-50">
              <p className="text-gray-500">No availability slots set up yet.</p>
              <p className="text-gray-400 text-sm mt-1">Add slots using the form above.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {availabilityEvents.map(event => {
                const slotProps = extractAvailabilityProps(event);
                if (!slotProps) return null;
                
                return <WeeklyAvailabilitySlot 
                  key={event.id} 
                  {...slotProps}
                />;
              })}
            </div>
          )}
        </div>
        
        {/* Google Calendar Integration Section */}
        <div className="mt-8 pt-4 border-t border-gray-200">
          <GoogleCalendarConnect />
        </div>
      </CardContent>
    </Card>
  );
};

export default NewAvailabilityPanel;
