import { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/use-toast';
import { TimeInput } from '@/components/ui/time-input';
import { PlusCircle, Trash2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type TimeSlot = {
  id: string;
  startTime: string;
  endTime: string;
};

type DaySchedule = {
  day: string;
  enabled: boolean;
  timeSlots: TimeSlot[];
};

type AvailabilitySettings = {
  timeGranularity: 'hour' | 'half_hour';
  minDaysAhead: number;
  maxDaysAhead: number;
  defaultStartTime: string;
  defaultEndTime: string;
};

const defaultSettings: AvailabilitySettings = {
  timeGranularity: 'hour',
  minDaysAhead: 2,
  maxDaysAhead: 60,
  defaultStartTime: '09:00',
  defaultEndTime: '17:00',
};

const defaultWeekSchedule: DaySchedule[] = [
  { day: 'Monday', enabled: false, timeSlots: [] },
  { day: 'Tuesday', enabled: false, timeSlots: [] },
  { day: 'Wednesday', enabled: false, timeSlots: [] },
  { day: 'Thursday', enabled: false, timeSlots: [] },
  { day: 'Friday', enabled: false, timeSlots: [] },
  { day: 'Saturday', enabled: false, timeSlots: [] },
  { day: 'Sunday', enabled: false, timeSlots: [] },
];

function AvailabilityPanel() {
  const { toast } = useToast();
  const { userId } = useUser();
  
  const [activeTab, setActiveTab] = useState('weekly');
  const [weekSchedule, setWeekSchedule] = useState<DaySchedule[]>(defaultWeekSchedule);
  const [settings, setSettings] = useState<AvailabilitySettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [singleDateTableExists, setSingleDateTableExists] = useState(false);
  const [singleDateTableChecked, setSingleDateTableChecked] = useState(false);

  // Fetch availability data when component mounts
  useEffect(() => {
    if (userId) {
      fetchAvailability();
    }
  }, [userId]);

  // Check if availability_single_date table exists
  useEffect(() => {
    if (userId && !singleDateTableChecked) {
      checkSingleDateTableExists();
    }
  }, [userId, singleDateTableChecked]);

  // Check if the availability_single_date table exists using the RPC function
  const checkSingleDateTableExists = async () => {
    try {
      console.log('[AvailabilityPanel] Checking if availability_single_date table exists');
      const { data: tableExists, error: rpcError } = await supabase
        .rpc('check_table_exists', { table_name: 'availability_single_date' });
      
      if (rpcError) {
        console.error('[AvailabilityPanel] Error checking if table exists:', rpcError);
        setSingleDateTableExists(false);
      } else {
        console.log('[AvailabilityPanel] Table exists:', tableExists);
        setSingleDateTableExists(!!tableExists);
      }
      setSingleDateTableChecked(true);
    } catch (error) {
      console.error('[AvailabilityPanel] Error checking table existence:', error);
      setSingleDateTableExists(false);
      setSingleDateTableChecked(true);
    }
  };

  const fetchAvailability = async () => {
    setIsLoading(true);
    try {
      console.log('[AvailabilityPanel] Fetching availability for clinician:', userId);
      
      // Fetch weekly availability
      const { data: availabilityData, error: availabilityError } = await supabase
        .from('availability')
        .select('*')
        .eq('clinician_id', userId);
      
      if (availabilityError) {
        throw availabilityError;
      }
      
      console.log('[AvailabilityPanel] Retrieved', availabilityData?.length || 0, 'availability records:', availabilityData);
      
      // Fetch availability settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('availability_settings')
        .select('*')
        .eq('clinician_id', userId)
        .single();
      
      if (settingsError && settingsError.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
        throw settingsError;
      }
      
      console.log('[AvailabilityPanel] Retrieved settings:', settingsData);
      
      // Process and set the data
      if (availabilityData && availabilityData.length > 0) {
        const processedSchedule = processAvailabilityData(availabilityData);
        setWeekSchedule(processedSchedule);
      }
      
      if (settingsData) {
        const processedSettings: AvailabilitySettings = {
          timeGranularity: settingsData.time_granularity || defaultSettings.timeGranularity,
          minDaysAhead: settingsData.min_days_ahead || defaultSettings.minDaysAhead,
          maxDaysAhead: settingsData.max_days_ahead || defaultSettings.maxDaysAhead,
          defaultStartTime: settingsData.default_start_time || defaultSettings.defaultStartTime,
          defaultEndTime: settingsData.default_end_time || defaultSettings.defaultEndTime,
        };
        
        console.log('[AvailabilityPanel] Updated settings state:', processedSettings);
        setSettings(processedSettings);
      }
    } catch (error) {
      console.error('[AvailabilityPanel] Error fetching availability:', error);
      toast({
        title: "Error loading availability",
        description: "There was a problem loading your availability settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const processAvailabilityData = (data: any[]): DaySchedule[] => {
    const newSchedule = [...defaultWeekSchedule];
    
    data.forEach(item => {
      const dayIndex = newSchedule.findIndex(d => d.day.toLowerCase() === item.day_of_week.toLowerCase());
      if (dayIndex !== -1) {
        // If day exists in our schedule
        newSchedule[dayIndex].enabled = true;
        
        // Add time slot if it doesn't already exist
        const timeSlotExists = newSchedule[dayIndex].timeSlots.some(
          slot => slot.startTime === item.start_time && slot.endTime === item.end_time
        );
        
        if (!timeSlotExists) {
          newSchedule[dayIndex].timeSlots.push({
            id: item.id,
            startTime: item.start_time,
            endTime: item.end_time,
          });
        }
      }
    });
    
    return newSchedule;
  };

  const validateTimeSlot = (startTime: string, endTime: string): boolean => {
    // Convert times to minutes for easier comparison
    const startMinutes = convertTimeToMinutes(startTime);
    const endMinutes = convertTimeToMinutes(endTime);
    
    // Check if end time is after start time
    if (endMinutes <= startMinutes) {
      toast({
        title: "Invalid time slot",
        description: "End time must be after start time",
        variant: "destructive",
      });
      return false;
    }
    
    // Check if the slot is at least 30 minutes
    if (endMinutes - startMinutes < 30) {
      toast({
        title: "Invalid time slot",
        description: "Time slots must be at least 30 minutes",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };

  const convertTimeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const addTimeSlot = (dayIndex: number) => {
    const newSchedule = [...weekSchedule];
    const { defaultStartTime, defaultEndTime } = settings;
    
    if (!validateTimeSlot(defaultStartTime, defaultEndTime)) {
      return;
    }
    
    newSchedule[dayIndex].timeSlots.push({
      id: `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      startTime: defaultStartTime,
      endTime: defaultEndTime,
    });
    
    setWeekSchedule(newSchedule);
  };

  const removeTimeSlot = (dayIndex: number, slotIndex: number) => {
    const newSchedule = [...weekSchedule];
    newSchedule[dayIndex].timeSlots.splice(slotIndex, 1);
    setWeekSchedule(newSchedule);
  };

  const updateTimeSlot = (dayIndex: number, slotIndex: number, field: 'startTime' | 'endTime', value: string) => {
    const newSchedule = [...weekSchedule];
    newSchedule[dayIndex].timeSlots[slotIndex][field] = value;
    setWeekSchedule(newSchedule);
  };

  const toggleDayEnabled = (dayIndex: number, enabled: boolean) => {
    const newSchedule = [...weekSchedule];
    newSchedule[dayIndex].enabled = enabled;
    
    // If enabling a day with no time slots, add a default one
    if (enabled && newSchedule[dayIndex].timeSlots.length === 0) {
      newSchedule[dayIndex].timeSlots.push({
        id: `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        startTime: settings.defaultStartTime,
        endTime: settings.defaultEndTime,
      });
    }
    
    setWeekSchedule(newSchedule);
  };

  const updateSettings = (field: keyof AvailabilitySettings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const saveAvailability = async () => {
    setIsSaving(true);
    try {
      // Validate all time slots before saving
      let isValid = true;
      weekSchedule.forEach(day => {
        if (day.enabled) {
          day.timeSlots.forEach(slot => {
            if (!validateTimeSlot(slot.startTime, slot.endTime)) {
              isValid = false;
            }
          });
        }
      });
      
      if (!isValid) {
        throw new Error("There are invalid time slots. Please fix them before saving.");
      }
      
      // Check if availability_single_date table exists when in single day tab
      if (activeTab === 'single-day' && !singleDateTableChecked) {
        await checkSingleDateTableExists();
      }
      
      // Save weekly availability
      if (activeTab === 'weekly') {
        // First, get existing records to determine what to delete
        const { data: existingAvailability, error: fetchError } = await supabase
          .from('availability')
          .select('id, day_of_week')
          .eq('clinician_id', userId);
        
        if (fetchError) throw fetchError;
        
        // Prepare data for upsert
        const availabilityRecords = [];
        
        weekSchedule.forEach(day => {
          if (day.enabled && day.timeSlots.length > 0) {
            day.timeSlots.forEach(slot => {
              availabilityRecords.push({
                id: slot.id.startsWith('new-') ? undefined : slot.id,
                clinician_id: userId,
                day_of_week: day.day,
                start_time: slot.startTime,
                end_time: slot.endTime,
              });
            });
          }
        });
        
        // Find IDs to delete (records that exist but aren't in the new data)
        const newSlotIds = availabilityRecords
          .filter(record => record.id !== undefined)
          .map(record => record.id);
        
        const idsToDelete = existingAvailability
          ?.filter(record => !newSlotIds.includes(record.id))
          .map(record => record.id) || [];
        
        // Delete removed records
        if (idsToDelete.length > 0) {
          const { error: deleteError } = await supabase
            .from('availability')
            .delete()
            .in('id', idsToDelete);
          
          if (deleteError) throw deleteError;
        }
        
        // Upsert new/updated records
        if (availabilityRecords.length > 0) {
          const { error: upsertError } = await supabase
            .from('availability')
            .upsert(availabilityRecords, { onConflict: 'id' });
          
          if (upsertError) throw upsertError;
        }
        
        // Save settings
        const { error: settingsError } = await supabase
          .from('availability_settings')
          .upsert({
            clinician_id: userId,
            time_granularity: settings.timeGranularity,
            min_days_ahead: settings.minDaysAhead,
            max_days_ahead: settings.maxDaysAhead,
            default_start_time: settings.defaultStartTime,
            default_end_time: settings.defaultEndTime,
          }, { onConflict: 'clinician_id' });
        
        if (settingsError) throw settingsError;
      }
      // Save single day availability
      else if (activeTab === 'single-day' && singleDateTableExists) {
        // Check if the table exists before attempting to save
        const { data: tableExists, error: rpcError } = await supabase
          .rpc('check_table_exists', { table_name: 'availability_single_date' });
        
        if (rpcError) {
          console.error('[AvailabilityPanel] Error checking if table exists:', rpcError);
          throw new Error("Could not verify if the single date availability table exists.");
        }
        
        if (!tableExists) {
          throw new Error("The single date availability table does not exist. Please contact support.");
        }
        
        // Single day availability saving logic would go here
        // This is a placeholder for future implementation
        console.log('[AvailabilityPanel] Single day availability saving not yet implemented');
      }
      
      toast({
        title: "Availability saved",
        description: "Your availability settings have been updated successfully.",
      });
      
      // Refresh data
      fetchAvailability();
    } catch (error) {
      console.error('[AvailabilityPanel] Error saving availability:', error);
      toast({
        title: "Error saving availability",
        description: error instanceof Error ? error.message : "There was a problem saving your availability settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Availability</h2>
        <div className="flex items-center">
          <Button 
            variant="default" 
            onClick={saveAvailability} 
            disabled={isLoading || isSaving}
            className="ml-2"
          >
            {isSaving ? <Spinner className="mr-2 h-4 w-4" /> : null}
            Save Availability
          </Button>
        </div>
      </div>
      
      <div className="mb-4 flex justify-between items-center">
        <Badge variant="outline" className="text-sm">
          Enable Availability
        </Badge>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="weekly">Weekly Schedule</TabsTrigger>
          <TabsTrigger 
            value="single-day" 
            disabled={!singleDateTableExists}
            className={!singleDateTableExists ? "opacity-50 cursor-not-allowed" : ""}
          >
            Single Day
            {!singleDateTableExists && (
              <Badge variant="outline" className="ml-2 text-xs bg-red-50 text-red-500 border-red-200">
                Unavailable
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Spinner className="h-8 w-8" />
            <span className="ml-3">Loading availability settings...</span>
          </div>
        ) : (
          <>
            <TabsContent value="weekly" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Scheduling Settings</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Time Granularity</h4>
                      <RadioGroup 
                        value={settings.timeGranularity} 
                        onValueChange={(value) => updateSettings('timeGranularity', value)}
                        className="flex flex-col space-y-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="hour" id="hour" />
                          <Label htmlFor="hour">Hour marks only (e.g., 1:00, 2:00)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="half_hour" id="half_hour" />
                          <Label htmlFor="half_hour">Hour and half-hour marks (e.g., 1:00, 1:30)</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">How soon can clients schedule with you?</h4>
                      <Select 
                        value={settings.minDaysAhead.toString()} 
                        onValueChange={(value) => updateSettings('minDaysAhead', parseInt(value))}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select minimum days ahead" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Same day</SelectItem>
                          <SelectItem value="1">1 day in advance</SelectItem>
                          <SelectItem value="2">2 days in advance</SelectItem>
                          <SelectItem value="3">3 days in advance</SelectItem>
                          <SelectItem value="7">1 week in advance</SelectItem>
                          <SelectItem value="14">2 weeks in advance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Default working hours</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="defaultStartTime">Start Time</Label>
                          <TimeInput
                            id="defaultStartTime"
                            value={settings.defaultStartTime}
                            onChange={(value) => updateSettings('defaultStartTime', value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="defaultEndTime">End Time</Label>
                          <TimeInput
                            id="defaultEndTime"
                            value={settings.defaultEndTime}
                            onChange={(value) => updateSettings('defaultEndTime', value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Weekly Schedule</h3>
                  
                  <div className="space-y-6">
                    {weekSchedule.map((day, dayIndex) => (
                      <div key={day.day} className="border rounded-md p-4">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="font-medium">{day.day}</h4>
                          <Switch
                            checked={day.enabled}
                            onCheckedChange={(checked) => toggleDayEnabled(dayIndex, checked)}
                          />
                        </div>
                        
                        {day.enabled && (
                          <div className="space-y-4">
                            {day.timeSlots.map((slot, slotIndex) => (
                              <div key={slot.id} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
                                <div>
                                  <Label htmlFor={`${day.day}-${slotIndex}-start`}>Start Time</Label>
                                  <TimeInput
                                    id={`${day.day}-${slotIndex}-start`}
                                    value={slot.startTime}
                                    onChange={(value) => updateTimeSlot(dayIndex, slotIndex, 'startTime', value)}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor={`${day.day}-${slotIndex}-end`}>End Time</Label>
                                  <TimeInput
                                    id={`${day.day}-${slotIndex}-end`}
                                    value={slot.endTime}
                                    onChange={(value) => updateTimeSlot(dayIndex, slotIndex, 'endTime', value)}
                                  />
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeTimeSlot(dayIndex, slotIndex)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addTimeSlot(dayIndex)}
                              className="w-full"
                            >
                              <PlusCircle className="h-4 w-4 mr-2" />
                              Add Time Slot
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="single-day" className="space-y-6">
              {!singleDateTableExists ? (
                <div className="flex items-center p-4 border rounded-md bg-amber-50 text-amber-800">
                  <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Single day availability is not available</p>
                    <p className="text-sm">The required database table does not exist. Please contact support.</p>
                  </div>
                </div>
              ) : (
                <div className="p-4 border rounded-md">
                  <p>Single day availability settings will be implemented soon.</p>
                </div>
              )}
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}

// Add default export for compatibility with existing imports
export default AvailabilityPanel;
// Also keep named export for future use
export { AvailabilityPanel };
