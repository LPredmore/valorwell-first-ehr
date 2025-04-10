import { useState, useEffect } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
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

export function AvailabilityPanel() {
  const supabase = useSupabaseClient();
  const user = useUser();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [singleDateTableExists, setSingleDateTableExists] = useState<boolean>(true);
  
  const [clinicianId, setClinicianId] = useState<string | null>(null);
  const [settings, setSettings] = useState<AvailabilitySettings>(defaultSettings);
  const [weekSchedule, setWeekSchedule] = useState<DaySchedule[]>(defaultWeekSchedule);
  
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [singleDateTimeSlots, setSingleDateTimeSlots] = useState<TimeSlot[]>([]);
  const [existingSingleAvailability, setExistingSingleAvailability] = useState<Record<string, TimeSlot[]>>({});
  
  const [newStartTime, setNewStartTime] = useState('09:00');
  const [newEndTime, setNewEndTime] = useState('17:00');
  
  useEffect(() => {
    const fetchClinicianId = async () => {
      if (!user) return;
      
      try {
        // Get the clinician ID for the current user
        const { data: clinicianData, error: clinicianError } = await supabase
          .from('clinicians')
          .select('id')
          .eq('user_id', user.id)
          .single();
        
        if (clinicianError) {
          console.error('[AvailabilityPanel] Error fetching clinician:', clinicianError);
          setError(clinicianError);
          setIsLoading(false);
          return;
        }
        
        if (clinicianData) {
          setClinicianId(clinicianData.id);
          fetchAvailability(clinicianData.id);
        }
      } catch (error) {
        console.error('[AvailabilityPanel] Error fetching current user clinician ID:', error);
        setError(error as Error);
        setIsLoading(false);
      }
    };
    
    fetchClinicianId();
  }, [user, supabase]);
  
  const fetchAvailability = async (clinicianId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch availability settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('availability_settings')
        .select('*')
        .eq('clinician_id', clinicianId)
        .single();
      
      if (settingsData) {
        console.log('[AvailabilityPanel] Retrieved settings:', settingsData);
        setSettings({
          timeGranularity: settingsData.time_granularity || defaultSettings.timeGranularity,
          minDaysAhead: settingsData.min_days_ahead || defaultSettings.minDaysAhead,
          maxDaysAhead: settingsData.max_days_ahead || defaultSettings.maxDaysAhead,
          defaultStartTime: settingsData.default_start_time || defaultSettings.defaultStartTime,
          defaultEndTime: settingsData.default_end_time || defaultSettings.defaultEndTime,
        });
        console.log('[AvailabilityPanel] Updated settings state:', {
          timeGranularity: settingsData.time_granularity || defaultSettings.timeGranularity,
          minDaysAhead: settingsData.min_days_ahead || defaultSettings.minDaysAhead,
          maxDaysAhead: settingsData.max_days_ahead || defaultSettings.maxDaysAhead,
          defaultStartTime: settingsData.default_start_time || defaultSettings.defaultStartTime,
          defaultEndTime: settingsData.default_end_time || defaultSettings.defaultEndTime,
        });
      } else if (settingsError) {
        console.error('[AvailabilityPanel] Error fetching availability settings:', settingsError);
      }
      
      // Fetch weekly availability
      console.log('[AvailabilityPanel] Fetching availability for clinician:', clinicianId);
      const { data: availabilityData, error: availabilityError } = await supabase
        .from('availability')
        .select('*')
        .eq('clinician_id', clinicianId);
      
      if (availabilityData) {
        console.log('[AvailabilityPanel] Retrieved', availabilityData.length, 'availability records:', availabilityData);
        
        // Initialize a new week schedule
        const newWeekSchedule = [...defaultWeekSchedule];
        
        // Update the week schedule with the fetched data
        availabilityData.forEach(item => {
          const dayIndex = getDayIndex(item.day_of_week);
          if (dayIndex !== -1) {
            newWeekSchedule[dayIndex] = {
              ...newWeekSchedule[dayIndex],
              enabled: true,
              timeSlots: [
                ...newWeekSchedule[dayIndex].timeSlots,
                {
                  id: item.id,
                  startTime: item.start_time,
                  endTime: item.end_time,
                }
              ]
            };
          }
        });
        
        setWeekSchedule(newWeekSchedule);
      } else if (availabilityError) {
        console.error('[AvailabilityPanel] Error fetching availability:', availabilityError);
      }
      
      // Check if availability_single_date table exists using the RPC function
      const { data: tableExists, error: rpcError } = await supabase
        .rpc('check_table_exists', { table_name: 'availability_single_date' });
      
      if (rpcError) {
        console.error('[AvailabilityPanel] Error checking if table exists via RPC:', rpcError);
        setSingleDateTableExists(false);
      } else {
        console.log('[AvailabilityPanel] Table exists check result:', tableExists);
        setSingleDateTableExists(tableExists === true);
        
        if (tableExists === true) {
          // Fetch single date availability if the table exists
          const { data: singleDateData, error: singleDateError } = await supabase
            .from('availability_single_date')
            .select('*')
            .eq('clinician_id', clinicianId);
          
          if (singleDateData) {
            console.log('[AvailabilityPanel] Retrieved single date availability:', singleDateData);
            
            // Group by date
            const groupedByDate: Record<string, TimeSlot[]> = {};
            singleDateData.forEach(item => {
              const dateStr = item.date;
              if (!groupedByDate[dateStr]) {
                groupedByDate[dateStr] = [];
              }
              
              groupedByDate[dateStr].push({
                id: item.id,
                startTime: item.start_time,
                endTime: item.end_time,
              });
            });
            
            setExistingSingleAvailability(groupedByDate);
          } else if (singleDateError) {
            console.error('[AvailabilityPanel] Error fetching single date availability:', singleDateError);
          }
        } else {
          console.warn('[AvailabilityPanel] availability_single_date table does not exist');
          setSingleDateTableExists(false);
          setExistingSingleAvailability({});
          setSingleDateTimeSlots([]);
          
          // Show a warning toast
          toast({
            title: "Warning",
            description: "Single date availability feature is not fully configured. Please contact support.",
            variant: "default"
          });
        }
      }
    } catch (error) {
      console.error('[AvailabilityPanel] Error in fetchAvailability:', error);
      setError(error as Error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const saveAvailability = async () => {
    if (!clinicianId) return;
    
    setIsSaving(true);
    
    try {
      // Save weekly availability
      // First, delete all existing availability for this clinician
      const { error: deleteError } = await supabase
        .from('availability')
        .delete()
        .eq('clinician_id', clinicianId);
      
      if (deleteError) {
        console.error('[AvailabilityPanel] Error deleting existing availability:', deleteError);
        toast({
          title: "Error",
          description: "Failed to update availability. Please try again.",
          variant: "destructive"
        });
        setIsSaving(false);
        return;
      }
      
      // Then, insert new availability records
      const availabilityRecords = weekSchedule
        .filter(day => day.enabled)
        .flatMap(day => 
          day.timeSlots.map(slot => ({
            clinician_id: clinicianId,
            day_of_week: day.day.toLowerCase(),
            start_time: slot.startTime,
            end_time: slot.endTime
          }))
        );
      
      if (availabilityRecords.length > 0) {
        const { error: insertError } = await supabase
          .from('availability')
          .insert(availabilityRecords);
        
        if (insertError) {
          console.error('[AvailabilityPanel] Error inserting availability:', insertError);
          toast({
            title: "Error",
            description: "Failed to save availability. Please try again.",
            variant: "destructive"
          });
          setIsSaving(false);
          return;
        }
      }
      
      // Save availability settings
      const { error: settingsError } = await supabase
        .from('availability_settings')
        .upsert({
          clinician_id: clinicianId,
          time_granularity: settings.timeGranularity,
          min_days_ahead: settings.minDaysAhead,
          max_days_ahead: settings.maxDaysAhead,
          default_start_time: settings.defaultStartTime,
          default_end_time: settings.defaultEndTime
        });
      
      if (settingsError) {
        console.error('[AvailabilityPanel] Error saving settings:', settingsError);
        toast({
          title: "Error",
          description: "Failed to save settings. Please try again.",
          variant: "destructive"
        });
        setIsSaving(false);
        return;
      }
      
      // Save single date availability if the table exists and a date is selected
      if (selectedDate && singleDateTimeSlots.length > 0) {
        // Check if availability_single_date table exists using the RPC function
        const { data: tableExists, error: rpcError } = await supabase
          .rpc('check_table_exists', { table_name: 'availability_single_date' });
        
        if (rpcError) {
          console.error('[AvailabilityPanel] Error checking if table exists via RPC:', rpcError);
          toast({
            title: "Error",
            description: "Could not verify database configuration. Please contact support.",
            variant: "destructive"
          });
          setIsSaving(false);
          return;
        }
        
        if (!tableExists) {
          console.warn('[AvailabilityPanel] Cannot save single date availability - table does not exist');
          toast({
            title: "Warning",
            description: "Single date availability feature is not fully configured. Weekly availability has been saved.",
            variant: "default"
          });
          setIsSaving(false);
          return;
        }
        
        // Delete existing single date availability for this date
        const { error: deleteSingleError } = await supabase
          .from('availability_single_date')
          .delete()
          .eq('clinician_id', clinicianId)
          .eq('date', selectedDate);
        
        if (deleteSingleError) {
          console.error('[AvailabilityPanel] Error deleting existing single date availability:', deleteSingleError);
          toast({
            title: "Error",
            description: "Failed to update single date availability. Please try again.",
            variant: "destructive"
          });
          setIsSaving(false);
          return;
        }
        
        // Insert new single date availability records
        const singleDateRecords = singleDateTimeSlots.map(slot => ({
          clinician_id: clinicianId,
          date: selectedDate,
          start_time: slot.startTime,
          end_time: slot.endTime
        }));
        
        const { error: insertSingleError } = await supabase
          .from('availability_single_date')
          .insert(singleDateRecords);
        
        if (insertSingleError) {
          console.error('[AvailabilityPanel] Error inserting single date availability:', insertSingleError);
          toast({
            title: "Error",
            description: "Failed to save single date availability. Please try again.",
            variant: "destructive"
          });
          setIsSaving(false);
          return;
        }
        
        // Update the existing single availability state
        setExistingSingleAvailability(prev => ({
          ...prev,
          [selectedDate]: [...singleDateTimeSlots]
        }));
      }
      
      toast({
        title: "Availability Saved",
        description: "Your availability has been updated successfully.",
      });
    } catch (error) {
      console.error('[AvailabilityPanel] Error saving availability:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const validateTimeSlot = (startTime: string, endTime: string, existingSlots: TimeSlot[]): boolean => {
    // Check if end time is after start time
    if (startTime >= endTime) {
      toast({
        title: "Invalid Time Slot",
        description: "End time must be after start time.",
        variant: "destructive"
      });
      return false;
    }
    
    // Check for overlaps with existing slots
    for (const slot of existingSlots) {
      if (
        (startTime >= slot.startTime && startTime < slot.endTime) ||
        (endTime > slot.startTime && endTime <= slot.endTime) ||
        (startTime <= slot.startTime && endTime >= slot.endTime)
      ) {
        toast({
          title: "Overlapping Time Slot",
          description: `This time slot overlaps with an existing slot (${slot.startTime} - ${slot.endTime}).`,
          variant: "destructive"
        });
        return false;
      }
    }
    
    return true;
  };
  
  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    
    // If we have existing availability for this date, load it
    if (existingSingleAvailability[date]) {
      setSingleDateTimeSlots(existingSingleAvailability[date]);
    } else {
      setSingleDateTimeSlots([]);
    }
  };
  
  const addTimeSlot = (dayIndex: number) => {
    const newStartTime = settings.defaultStartTime;
    const newEndTime = settings.defaultEndTime;
    
    setWeekSchedule(prev => {
      const updated = [...prev];
      const day = updated[dayIndex];
      
      if (!validateTimeSlot(newStartTime, newEndTime, day.timeSlots)) {
        return prev; // Return unchanged if validation fails
      }
      
      updated[dayIndex] = {
        ...day,
        timeSlots: [
          ...day.timeSlots,
          {
            id: crypto.randomUUID(),
            startTime: newStartTime,
            endTime: newEndTime
          }
        ]
      };
      return updated;
    });
  };
  
  const updateTimeSlot = (dayIndex: number, slotIndex: number, field: 'startTime' | 'endTime', value: string) => {
    setWeekSchedule(prev => {
      const updated = [...prev];
      const day = updated[dayIndex];
      const slots = [...day.timeSlots];
      const updatedSlot = {
        ...slots[slotIndex],
        [field]: value
      };
      
      // Create a list of other slots to check for overlaps
      const otherSlots = slots.filter((_, i) => i !== slotIndex);
      
      if (!validateTimeSlot(
        field === 'startTime' ? value : slots[slotIndex].startTime,
        field === 'endTime' ? value : slots[slotIndex].endTime,
        otherSlots
      )) {
        return prev; // Return unchanged if validation fails
      }
      
      slots[slotIndex] = updatedSlot;
      updated[dayIndex] = {
        ...day,
        timeSlots: slots
      };
      return updated;
    });
  };
  
  const deleteTimeSlot = (dayIndex: number, slotIndex: number) => {
    setWeekSchedule(prev => {
      const updated = [...prev];
      const day = updated[dayIndex];
      const slots = [...day.timeSlots];
      slots.splice(slotIndex, 1);
      updated[dayIndex] = {
        ...day,
        timeSlots: slots
      };
      return updated;
    });
  };
  
  const addSingleDateTimeSlot = () => {
    if (!validateTimeSlot(newStartTime, newEndTime, singleDateTimeSlots)) {
      return; // Return if validation fails
    }
    
    setSingleDateTimeSlots(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        startTime: newStartTime,
        endTime: newEndTime
      }
    ]);
  };
  
  const updateSingleDateTimeSlot = (id: string, field: 'startTime' | 'endTime', value: string) => {
    setSingleDateTimeSlots(prev => {
      const slotIndex = prev.findIndex(slot => slot.id === id);
      if (slotIndex === -1) return prev;
      
      const updatedSlot = {
        ...prev[slotIndex],
        [field]: value
      };
      
      // Create a list of other slots to check for overlaps
      const otherSlots = prev.filter(slot => slot.id !== id);
      
      if (!validateTimeSlot(
        field === 'startTime' ? value : prev[slotIndex].startTime,
        field === 'endTime' ? value : prev[slotIndex].endTime,
        otherSlots
      )) {
        return prev; // Return unchanged if validation fails
      }
      
      const updated = [...prev];
      updated[slotIndex] = updatedSlot;
      return updated;
    });
  };
  
  const deleteSingleDateTimeSlot = (id: string) => {
    setSingleDateTimeSlots(prev => prev.filter(slot => slot.id !== id));
  };
  
  const handleMinDaysAheadChange = (value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0) {
      setSettings(prev => ({
        ...prev,
        minDaysAhead: numValue
      }));
    }
  };
  
  const handleMaxDaysAheadChange = (value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0) {
      setSettings(prev => ({
        ...prev,
        maxDaysAhead: numValue
      }));
    }
  };
  
  const toggleDayEnabled = (dayIndex: number, enabled: boolean) => {
    setWeekSchedule(prev => {
      const updated = [...prev];
      updated[dayIndex] = {
        ...updated[dayIndex],
        enabled
      };
      return updated;
    });
  };
  
  const getDayIndex = (day: string): number => {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    return days.indexOf(day.toLowerCase());
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <Spinner size="lg" />
        <p className="text-muted-foreground">Loading availability settings...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h3 className="text-lg font-semibold">Error Loading Availability</h3>
        <p className="text-muted-foreground">{error.message}</p>
        <Button onClick={() => fetchAvailability(clinicianId!)}>Retry</Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <span className="inline-block w-6 h-6">⏱️</span> Availability
          <Badge variant="outline" className="ml-2">
            Enable Availability
          </Badge>
        </h2>
      </div>
      
      <Tabs defaultValue="weekly">
        <TabsList>
          <TabsTrigger value="weekly">Weekly Schedule</TabsTrigger>
          <TabsTrigger value="single" disabled={!singleDateTableExists}>
            Single Day
            {!singleDateTableExists && (
              <Badge variant="outline" className="ml-2 bg-muted">
                Unavailable
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="weekly" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Scheduling Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Allow clients to schedule appointments on:</h4>
                  <div className="space-y-2">
                    {weekSchedule.map((day, index) => (
                      <div key={day.day} className="flex items-center space-x-2">
                        <Switch
                          id={`day-${index}`}
                          checked={day.enabled}
                          onCheckedChange={(checked) => toggleDayEnabled(index, checked)}
                        />
                        <Label htmlFor={`day-${index}`}>{day.day}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Time slot granularity:</h4>
                  <RadioGroup
                    value={settings.timeGranularity}
                    onValueChange={(value) => 
                      setSettings(prev => ({ ...prev, timeGranularity: value as 'hour' | 'half_hour' }))
                    }
                    className="space-y-2"
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
                
                <div className="space-y-2">
                  <h4 className="font-medium">How soon can clients schedule with you?</h4>
                  <Select
                    value={settings.minDaysAhead.toString()}
                    onValueChange={handleMinDaysAheadChange}
                  >
                    <SelectTrigger>
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
                
                <div className="space-y-2">
                  <h4 className="font-medium">Default working hours:</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="default-start-time">Start Time</Label>
                      <TimeInput
                        id="default-start-time"
                        value={settings.defaultStartTime}
                        onChange={(value) => 
                          setSettings(prev => ({ ...prev, defaultStartTime: value }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="default-end-time">End Time</Label>
                      <TimeInput
                        id="default-end-time"
                        value={settings.defaultEndTime}
                        onChange={(value) => 
                          setSettings(prev => ({ ...prev, defaultEndTime: value }))
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Weekly Schedule</h3>
              
              <div className="space-y-6">
                {weekSchedule.map((day, dayIndex) => (
                  <div 
                    key={day.day}
                    className={cn(
                      "border rounded-md p-4 space-y-4",
                      !day.enabled && "opacity-50"
                    )}
                  >
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold">{day.day}</h4>
                      <Switch
                        checked={day.enabled}
                        onCheckedChange={(checked) => toggleDayEnabled(dayIndex, checked)}
                      />
                    </div>
                    
                    {day.enabled && (
                      <>
                        <div className="space-y-3">
                          {day.timeSlots.map((slot, slotIndex) => (
                            <div key={slot.id} className="flex items-center space-x-2">
                              <TimeInput
                                value={slot.startTime}
                                onChange={(value) => updateTimeSlot(dayIndex, slotIndex, 'startTime', value)}
                                className="w-24"
                              />
                              <span>-</span>
                              <TimeInput
                                value={slot.endTime}
                                onChange={(value) => updateTimeSlot(dayIndex, slotIndex, 'endTime', value)}
                                className="w-24"
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteTimeSlot(dayIndex, slotIndex)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addTimeSlot(dayIndex)}
                          className="flex items-center"
                        >
                          <PlusCircle className="h-4 w-4 mr-2" />
                          Add Time Slot
                        </Button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="single" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Select Date</h3>
              <div>
                <Label htmlFor="single-date">Date</Label>
                <input
                  type="date"
                  id="single-date"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              
              {selectedDate && (
                <div className="space-y-4">
                  <h4 className="font-medium">Add Time Slot</h4>
                  <div className="flex items-center space-x-2">
                    <TimeInput
                      value={newStartTime}
                      onChange={setNewStartTime}
                      className="w-24"
                    />
                    <span>-</span>
                    <TimeInput
                      value={newEndTime}
                      onChange={setNewEndTime}
                      className="w-24"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addSingleDateTimeSlot}
                      className="flex items-center"
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Time Slots</h3>
              
              {selectedDate ? (
                <div className="border rounded-md p-4 space-y-4">
                  <h4 className="font-semibold">{new Date(selectedDate).toLocaleDateString()}</h4>
                  
                  <div className="space-y-3">
                    {singleDateTimeSlots.length > 0 ? (
                      singleDateTimeSlots.map((slot) => (
                        <div key={slot.id} className="flex items-center space-x-2">
                          <TimeInput
                            value={slot.startTime}
                            onChange={(value) => updateSingleDateTimeSlot(slot.id, 'startTime', value)}
                            className="w-24"
                          />
                          <span>-</span>
                          <TimeInput
                            value={slot.endTime}
                            onChange={(value) => updateSingleDateTimeSlot(slot.id, 'endTime', value)}
                            className="w-24"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteSingleDateTimeSlot(slot.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground">No time slots added yet.</p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Select a date to manage time slots.</p>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      <Button 
        onClick={saveAvailability} 
        disabled={isSaving}
        className="w-full md:w-auto"
      >
        {isSaving ? <Spinner className="mr-2" size="sm" /> : null}
        Save Availability
      </Button>
    </div>
  );
}
