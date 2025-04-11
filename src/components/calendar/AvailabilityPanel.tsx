
import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/context/UserContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Spinner } from '@/components/ui/spinner';
import { TimeInput } from '@/components/ui/time-input';
import { Card, CardContent } from '@/components/ui/card';
import { PlusCircle, Trash2, CalendarIcon, Clock, Ban } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, parseISO, isValid, isBefore } from 'date-fns';
import { cn } from '@/lib/utils';
import TimeBlocksManager from './availability/TimeBlocksManager';
import SingleDayAvailabilityManager from './availability/SingleDayAvailabilityManager';

interface TimeSlot {
  id: string;
  day: number;
  startTime: string;
  endTime: string;
}

interface DaySchedule {
  day: number;
  name: string;
  enabled: boolean;
  timeSlots: TimeSlot[];
}

interface AvailabilitySettings {
  timeGranularity: string;
  minDaysAhead: number;
  maxDaysAhead: number;
  defaultStartTime: string;
  defaultEndTime: string;
}

export default function AvailabilityPanel() {
  const { userId } = useUser();
  
  const [activeTab, setActiveTab] = useState<string>('weekly');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [singleDateTableExists, setSingleDateTableExists] = useState<boolean>(false);
  const [timeBlocksTableExists, setTimeBlocksTableExists] = useState<boolean>(false);
  const [weekSchedule, setWeekSchedule] = useState<DaySchedule[]>([
    { day: 0, name: 'Sunday', enabled: false, timeSlots: [] },
    { day: 1, name: 'Monday', enabled: false, timeSlots: [] },
    { day: 2, name: 'Tuesday', enabled: false, timeSlots: [] },
    { day: 3, name: 'Wednesday', enabled: false, timeSlots: [] },
    { day: 4, name: 'Thursday', enabled: false, timeSlots: [] },
    { day: 5, name: 'Friday', enabled: false, timeSlots: [] },
    { day: 6, name: 'Saturday', enabled: false, timeSlots: [] },
  ]);
  
  const [settings, setSettings] = useState<AvailabilitySettings>({
    timeGranularity: 'hour',
    minDaysAhead: 2,
    maxDaysAhead: 30,
    defaultStartTime: '09:00',
    defaultEndTime: '17:00',
  });

  const { toast } = useToast();
  
  useEffect(() => {
    if (userId) {
      console.log('[AvailabilityPanel] userId detected, fetching data');
      fetchAvailability();
      checkRequiredTablesExist();
    }
  }, [userId]);
  
  const checkRequiredTablesExist = async () => {
    try {
      // Check if single_day_availability table exists
      const { data: singleDayExists, error: singleDayError } = await supabase
        .rpc('check_table_exists', { 
          check_table_name: 'single_day_availability' 
        });
      
      if (singleDayError) {
        console.error('[AvailabilityPanel] Error checking if single_day_availability table exists:', singleDayError);
      } else {
        console.log('[AvailabilityPanel] single_day_availability table exists:', !!singleDayExists);
        setSingleDateTableExists(!!singleDayExists);
      }

      // Check if time_blocks table exists
      const { data: timeBlocksExists, error: timeBlocksError } = await supabase
        .rpc('check_table_exists', { 
          check_table_name: 'time_blocks' 
        });
      
      if (timeBlocksError) {
        console.error('[AvailabilityPanel] Error checking if time_blocks table exists:', timeBlocksError);
      } else {
        console.log('[AvailabilityPanel] time_blocks table exists:', !!timeBlocksExists);
        setTimeBlocksTableExists(!!timeBlocksExists);
      }
    } catch (error) {
      console.error('[AvailabilityPanel] Error checking if tables exist:', error);
      setSingleDateTableExists(false);
      setTimeBlocksTableExists(false);
    }
  };
  
  const fetchAvailability = async () => {
    setIsLoading(true);
    try {
      console.log('[AvailabilityPanel] Fetching clinician data...');
      
      // Fetch clinician data which now includes availability in columns
      const { data: clinicianData, error: clinicianError } = await supabase
        .from('clinicians')
        .select(`
          id,
          clinician_mondaystart1, clinician_mondayend1,
          clinician_mondaystart2, clinician_mondayend2,
          clinician_mondaystart3, clinician_mondayend3,
          clinician_tuesdaystart1, clinician_tuesdayend1,
          clinician_tuesdaystart2, clinician_tuesdayend2,
          clinician_tuesdaystart3, clinician_tuesdayend3,
          clinician_wednesdaystart1, clinician_wednesdayend1,
          clinician_wednesdaystart2, clinician_wednesdayend2,
          clinician_wednesdaystart3, clinician_wednesdayend3,
          clinician_thursdaystart1, clinician_thursdayend1,
          clinician_thursdaystart2, clinician_thursdayend2,
          clinician_thursdaystart3, clinician_thursdayend3,
          clinician_fridaystart1, clinician_fridayend1,
          clinician_fridaystart2, clinician_fridayend2,
          clinician_fridaystart3, clinician_fridayend3,
          clinician_saturdaystart1, clinician_saturdayend1,
          clinician_saturdaystart2, clinician_saturdayend2,
          clinician_saturdaystart3, clinician_saturdayend3,
          clinician_sundaystart1, clinician_sundayend1,
          clinician_sundaystart2, clinician_sundayend2,
          clinician_sundaystart3, clinician_sundayend3
        `)
        .eq('id', userId)
        .single();
      
      if (clinicianError) {
        console.error('[AvailabilityPanel] Error fetching clinician data:', clinicianError);
        throw clinicianError;
      }
      
      // Fetch availability settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('availability_settings')
        .select('*')
        .eq('clinician_id', userId)
        .single();
      
      if (settingsError && settingsError.code !== 'PGRST116') {
        console.error('[AvailabilityPanel] Error fetching availability settings:', settingsError);
        throw settingsError;
      }
      
      if (settingsData) {
        setSettings({
          timeGranularity: settingsData.time_granularity || 'hour',
          minDaysAhead: settingsData.min_days_ahead || 2,
          maxDaysAhead: settingsData.max_days_ahead || 30,
          defaultStartTime: settingsData.default_start_time?.slice(0, 5) || '09:00',
          defaultEndTime: settingsData.default_end_time?.slice(0, 5) || '17:00',
        });
      }
      
      // Process the clinician data to update weekly schedule
      if (clinicianData) {
        const newSchedule = [...weekSchedule];
        
        // Process each day
        processDay(clinicianData, newSchedule, 'sunday', 0);
        processDay(clinicianData, newSchedule, 'monday', 1);
        processDay(clinicianData, newSchedule, 'tuesday', 2);
        processDay(clinicianData, newSchedule, 'wednesday', 3);
        processDay(clinicianData, newSchedule, 'thursday', 4);
        processDay(clinicianData, newSchedule, 'friday', 5);
        processDay(clinicianData, newSchedule, 'saturday', 6);
        
        setWeekSchedule(newSchedule);
      }
      
      console.log('[AvailabilityPanel] Availability data loaded successfully');
    } catch (error) {
      console.error('[AvailabilityPanel] Error fetching availability:', error);
      toast({
        title: "Error loading availability",
        description: "There was a problem loading your availability settings. Please refresh the page and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      console.log('[AvailabilityPanel] isLoading set to false');
    }
  };

  // Helper function to process availability for a specific day
  const processDay = (clinicianData: any, schedule: DaySchedule[], dayName: string, dayIndex: number) => {
    const day = schedule[dayIndex];
    day.timeSlots = [];

    // Check if any slots exist for this day
    let hasSlots = false;
    
    // Process up to 3 slots per day
    for (let slot = 1; slot <= 3; slot++) {
      const startKey = `clinician_${dayName}start${slot}`;
      const endKey = `clinician_${dayName}end${slot}`;
      
      if (clinicianData[startKey] && clinicianData[endKey]) {
        hasSlots = true;
        
        day.timeSlots.push({
          id: `${dayName}-${slot}`,
          day: dayIndex,
          startTime: clinicianData[startKey].slice(0, 5), // Format as 'HH:MM'
          endTime: clinicianData[endKey].slice(0, 5), // Format as 'HH:MM'
        });
      }
    }
    
    day.enabled = hasSlots;
  };

  const validateTimeSlot = (startTime: string, endTime: string): boolean => {
    if (!startTime || !endTime) return false;
    
    const start = parseISO(`2000-01-01T${startTime}`);
    const end = parseISO(`2000-01-01T${endTime}`);
    
    return isValid(start) && isValid(end) && isBefore(start, end);
  };
  
  const toggleDayEnabled = (dayIndex: number, enabled: boolean) => {
    const newSchedule = [...weekSchedule];
    newSchedule[dayIndex].enabled = enabled;
    
    if (enabled && newSchedule[dayIndex].timeSlots.length === 0) {
      newSchedule[dayIndex].timeSlots.push({
        id: `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        day: dayIndex,
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
    console.log('[AvailabilityPanel] Save button clicked');
    
    if (!userId) {
      console.error('[AvailabilityPanel] Cannot save: No user ID available');
      toast({
        title: "Error saving availability",
        description: "User information is not available. Please refresh the page and try again.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSaving(true);
    try {
      console.log('[AvailabilityPanel] Starting save operation...');
      
      let isValid = true;
      weekSchedule.forEach(day => {
        if (day.enabled) {
          day.timeSlots.forEach(slot => {
            if (!validateTimeSlot(slot.startTime, slot.endTime)) {
              isValid = false;
              console.error(`[AvailabilityPanel] Invalid time slot: ${day.name}, ${slot.startTime} - ${slot.endTime}`);
            }
          });
        }
      });
      
      if (!isValid) {
        throw new Error("There are invalid time slots. Please fix them before saving.");
      }
      
      if (activeTab === 'weekly') {
        console.log('[AvailabilityPanel] Saving weekly availability...');
        
        // Prepare data object for updating clinician
        const updateData: Record<string, any> = {};
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        
        // First, clear all slots by setting them to null
        dayNames.forEach(dayName => {
          for (let slot = 1; slot <= 3; slot++) {
            updateData[`clinician_${dayName}start${slot}`] = null;
            updateData[`clinician_${dayName}end${slot}`] = null;
          }
        });
        
        // Then set the enabled slots
        weekSchedule.forEach(day => {
          const dayName = dayNames[day.day];
          
          if (day.enabled && day.timeSlots.length > 0) {
            day.timeSlots.forEach((slot, index) => {
              // Only handle up to 3 slots per day
              if (index < 3) {
                const slotNum = index + 1;
                updateData[`clinician_${dayName}start${slotNum}`] = slot.startTime;
                updateData[`clinician_${dayName}end${slotNum}`] = slot.endTime;
              }
            });
          }
        });
        
        // Update the clinician record with the new availability data
        const { error: updateError } = await supabase
          .from('clinicians')
          .update(updateData)
          .eq('id', userId);
        
        if (updateError) {
          console.error('[AvailabilityPanel] Error updating clinician availability:', updateError);
          throw updateError;
        }
        
        console.log('[AvailabilityPanel] Successfully updated clinician availability');
        
        // Save settings
        const { data: existingSettings, error: checkError } = await supabase
          .from('availability_settings')
          .select('id')
          .eq('clinician_id', userId)
          .maybeSingle();
        
        if (checkError && checkError.code !== 'PGRST116') {
          console.error('[AvailabilityPanel] Error checking existing settings:', checkError);
          throw checkError;
        }
        
        const settingsData = {
          clinician_id: userId,
          time_granularity: settings.timeGranularity,
          min_days_ahead: settings.minDaysAhead,
          max_days_ahead: settings.maxDaysAhead,
          default_start_time: settings.defaultStartTime,
          default_end_time: settings.defaultEndTime,
        };
        
        if (existingSettings) {
          const { error: updateError } = await supabase
            .from('availability_settings')
            .update(settingsData)
            .eq('id', existingSettings.id);
            
          if (updateError) {
            console.error('[AvailabilityPanel] Error updating settings:', updateError);
            throw updateError;
          }
        } else {
          const { error: insertError } = await supabase
            .from('availability_settings')
            .insert(settingsData);
            
          if (insertError) {
            console.error('[AvailabilityPanel] Error inserting settings:', insertError);
            throw insertError;
          }
        }
        
        console.log('[AvailabilityPanel] Successfully saved settings');
      }
      
      console.log('[AvailabilityPanel] Save operation completed successfully');
      
      toast({
        title: "Availability saved",
        description: "Your availability settings have been updated successfully.",
      });
      
      // Refresh the data to ensure we have the latest
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
  
  const addTimeSlot = (dayIndex: number) => {
    const newSchedule = [...weekSchedule];
    newSchedule[dayIndex].timeSlots.push({
      id: `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      day: dayIndex,
      startTime: settings.defaultStartTime,
      endTime: settings.defaultEndTime,
    });
    setWeekSchedule(newSchedule);
  };
  
  const removeTimeSlot = (dayIndex: number, slotIndex: number) => {
    const newSchedule = [...weekSchedule];
    newSchedule[dayIndex].timeSlots.splice(slotIndex, 1);
    
    // If removing the last time slot, also disable the day
    if (newSchedule[dayIndex].timeSlots.length === 0) {
      newSchedule[dayIndex].enabled = false;
    }
    
    setWeekSchedule(newSchedule);
  };
  
  const updateTimeSlot = (dayIndex: number, slotIndex: number, field: 'startTime' | 'endTime', value: string) => {
    const newSchedule = [...weekSchedule];
    newSchedule[dayIndex].timeSlots[slotIndex][field] = value;
    setWeekSchedule(newSchedule);
  };
  
  const handleSaveClick = (e: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    console.log('[AvailabilityPanel] Save button clicked via explicit handler');
    console.log('[AvailabilityPanel] isLoading:', isLoading, 'isSaving:', isSaving);
    
    saveAvailability();
  };
  
  console.log('[AvailabilityPanel] Render - Button disabled state:', isLoading || isSaving);
  
  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Availability</h2>
        <div className="flex items-center">
          <Button 
            variant="default" 
            onClick={handleSaveClick}
            disabled={isLoading || isSaving} 
            className="ml-2"
            type="button"
          >
            {isSaving ? <Spinner className="mr-2 h-4 w-4" /> : null}
            Save Availability
          </Button>
        </div>
      </div>
      
      <div className="mb-4 flex justify-between items-center">
        <Badge variant="outline" className="text-sm">
          Manage Your Availability
        </Badge>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="weekly">Weekly Schedule</TabsTrigger>
          {timeBlocksTableExists && (
            <TabsTrigger value="time-blocks">Time Blocks</TabsTrigger>
          )}
          {singleDateTableExists && (
            <TabsTrigger value="single-day">Single Day</TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="weekly" className="mt-0">
          <div className="space-y-6">
            {weekSchedule.map((day, dayIndex) => (
              <Card key={day.day} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-4 border-b flex justify-between items-center">
                    <div className="flex items-center">
                      <Switch 
                        id={`day-${day.day}`}
                        checked={day.enabled}
                        onCheckedChange={(checked) => toggleDayEnabled(dayIndex, checked)}
                      />
                      <Label 
                        htmlFor={`day-${day.day}`} 
                        className={`ml-2 font-medium ${!day.enabled ? 'text-gray-500' : ''}`}
                      >
                        {day.name}
                      </Label>
                    </div>
                  </div>
                  
                  {day.enabled && (
                    <div className="p-4 space-y-4">
                      {day.timeSlots.map((slot, slotIndex) => (
                        <div key={slot.id} className="flex items-center space-x-4">
                          <div className="flex-1 grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor={`start-${day.day}-${slotIndex}`} className="text-xs mb-1 block">
                                Start Time
                              </Label>
                              <TimeInput
                                id={`start-${day.day}-${slotIndex}`}
                                value={slot.startTime}
                                onChange={(value) => updateTimeSlot(dayIndex, slotIndex, 'startTime', value)}
                                className={!validateTimeSlot(slot.startTime, slot.endTime) ? 'border-red-500' : ''}
                              />
                            </div>
                            <div>
                              <Label htmlFor={`end-${day.day}-${slotIndex}`} className="text-xs mb-1 block">
                                End Time
                              </Label>
                              <TimeInput
                                id={`end-${day.day}-${slotIndex}`}
                                value={slot.endTime}
                                onChange={(value) => updateTimeSlot(dayIndex, slotIndex, 'endTime', value)}
                                className={!validateTimeSlot(slot.startTime, slot.endTime) ? 'border-red-500' : ''}
                              />
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeTimeSlot(dayIndex, slotIndex)}
                            className="h-8 w-8"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      
                      {day.timeSlots.length < 3 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addTimeSlot(dayIndex)}
                          className="mt-2"
                        >
                          <PlusCircle className="h-4 w-4 mr-2" />
                          Add Time Slot
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        {timeBlocksTableExists && (
          <TabsContent value="time-blocks" className="mt-0">
            <TimeBlocksManager clinicianId={userId} />
          </TabsContent>
        )}
        
        {singleDateTableExists && (
          <TabsContent value="single-day" className="mt-0">
            <SingleDayAvailabilityManager clinicianId={userId} />
          </TabsContent>
        )}
      </Tabs>
      
      <div className="mt-6 border-t pt-6">
        <h3 className="text-lg font-medium mb-4">Availability Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="time-granularity" className="block mb-2">
              Time Slot Granularity
            </Label>
            <Select
              value={settings.timeGranularity}
              onValueChange={(value) => updateSettings('timeGranularity', value)}
            >
              <SelectTrigger id="time-granularity">
                <SelectValue placeholder="Select granularity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15min">15 minutes</SelectItem>
                <SelectItem value="30min">30 minutes</SelectItem>
                <SelectItem value="hour">1 hour</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="min-days-ahead" className="block mb-2">
              Minimum Days in Advance
            </Label>
            <Select
              value={settings.minDaysAhead.toString()}
              onValueChange={(value) => updateSettings('minDaysAhead', parseInt(value))}
            >
              <SelectTrigger id="min-days-ahead">
                <SelectValue placeholder="Select minimum days" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Same day</SelectItem>
                <SelectItem value="1">1 day</SelectItem>
                <SelectItem value="2">2 days</SelectItem>
                <SelectItem value="3">3 days</SelectItem>
                <SelectItem value="7">1 week</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="max-days-ahead" className="block mb-2">
              Maximum Days in Advance
            </Label>
            <Select
              value={settings.maxDaysAhead.toString()}
              onValueChange={(value) => updateSettings('maxDaysAhead', parseInt(value))}
            >
              <SelectTrigger id="max-days-ahead">
                <SelectValue placeholder="Select maximum days" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">1 week</SelectItem>
                <SelectItem value="14">2 weeks</SelectItem>
                <SelectItem value="30">1 month</SelectItem>
                <SelectItem value="60">2 months</SelectItem>
                <SelectItem value="90">3 months</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="default-times" className="block mb-2">
              Default Time Slot
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="default-start-time" className="text-xs mb-1 block">
                  Start Time
                </Label>
                <TimeInput
                  id="default-start-time"
                  value={settings.defaultStartTime}
                  onChange={(value) => updateSettings('defaultStartTime', value)}
                />
              </div>
              <div>
                <Label htmlFor="default-end-time" className="text-xs mb-1 block">
                  End Time
                </Label>
                <TimeInput
                  id="default-end-time"
                  value={settings.defaultEndTime}
                  onChange={(value) => updateSettings('defaultEndTime', value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-6 flex justify-end">
        <Button 
          variant="default" 
          onClick={handleSaveClick} 
          disabled={isLoading || isSaving}
          type="button"
        >
          {isSaving ? <Spinner className="mr-2 h-4 w-4" /> : null}
          Save Availability
        </Button>
      </div>
    </div>
  );
}
