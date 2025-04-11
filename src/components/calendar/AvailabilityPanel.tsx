import React, { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { Spinner } from '@/components/ui/spinner';
import { TimeInput } from '@/components/ui/time-input';
import { Card, CardContent } from '@/components/ui/card';
import { PlusCircle, Trash2 } from 'lucide-react';

interface TimeSlot {
  id: string;
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
  const [singleDateTableChecked, setSingleDateTableChecked] = useState<boolean>(false);
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
  
  useEffect(() => {
    if (userId) {
      console.log('[AvailabilityPanel] userId detected, fetching data');
      fetchAvailability();
      checkSingleDateTableExists();
    }
  }, [userId]);
  
  const checkSingleDateTableExists = async () => {
    try {
      console.log('[AvailabilityPanel] Checking if availability_single_date table exists...');
      const { data, error } = await supabase
        .rpc('check_table_exists', { table_name: 'availability_single_date' });
      
      if (error) {
        console.error('[AvailabilityPanel] Error checking if table exists:', error);
        setSingleDateTableExists(false);
      } else {
        console.log('[AvailabilityPanel] Table exists:', data);
        setSingleDateTableExists(!!data);
      }
      
      setSingleDateTableChecked(true);
    } catch (error) {
      console.error('[AvailabilityPanel] Error checking if table exists:', error);
      setSingleDateTableExists(false);
      setSingleDateTableChecked(true);
    }
  };
  
  const fetchAvailability = async () => {
    setIsLoading(true);
    try {
      console.log('[AvailabilityPanel] Fetching availability data...');
      
      const { data: availabilityData, error: availabilityError } = await supabase
        .from('availability')
        .select('*')
        .eq('clinician_id', userId);
      
      if (availabilityError) throw availabilityError;
      
      const { data: settingsData, error: settingsError } = await supabase
        .from('availability_settings')
        .select('*')
        .eq('clinician_id', userId)
        .single();
      
      if (settingsError && settingsError.code !== 'PGRST116') {
        throw settingsError;
      }
      
      if (settingsData) {
        setSettings({
          timeGranularity: settingsData.time_granularity || 'hour',
          minDaysAhead: settingsData.min_days_ahead || 2,
          maxDaysAhead: settingsData.max_days_ahead || 30,
          defaultStartTime: settingsData.default_start_time || '09:00',
          defaultEndTime: settingsData.default_end_time || '17:00',
        });
      }
      
      const newSchedule = [...weekSchedule];
      
      newSchedule.forEach(day => {
        day.enabled = false;
        day.timeSlots = [];
      });
      
      if (availabilityData && availabilityData.length > 0) {
        availabilityData.forEach(slot => {
          const dayIndex = slot.day_of_week;
          if (dayIndex >= 0 && dayIndex < 7) {
            newSchedule[dayIndex].enabled = true;
            newSchedule[dayIndex].timeSlots.push({
              id: slot.id,
              startTime: slot.start_time,
              endTime: slot.end_time,
            });
          }
        });
      }
      
      setWeekSchedule(newSchedule);
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
  
  const validateTimeSlot = (startTime: string, endTime: string): boolean => {
    if (!startTime || !endTime) return false;
    return startTime < endTime;
  };
  
  const toggleDayEnabled = (dayIndex: number, enabled: boolean) => {
    const newSchedule = [...weekSchedule];
    newSchedule[dayIndex].enabled = enabled;
    
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
      
      if (activeTab === 'single-day' && !singleDateTableChecked) {
        await checkSingleDateTableExists();
      }
      
      if (activeTab === 'weekly') {
        console.log('[AvailabilityPanel] Saving weekly availability...');
        
        const { data: existingAvailability, error: fetchError } = await supabase
          .from('availability')
          .select('id, day_of_week')
          .eq('clinician_id', userId);
        
        if (fetchError) {
          console.error('[AvailabilityPanel] Error fetching existing availability:', fetchError);
          throw fetchError;
        }
        
        console.log('[AvailabilityPanel] Existing availability records:', existingAvailability?.length || 0);
        
        const enabledDays = weekSchedule
          .filter(day => day.enabled)
          .map(day => day.day);
        
        console.log('[AvailabilityPanel] Enabled days:', enabledDays);
        
        let recordsToDelete: { id: string }[] = [];
        
        if (existingAvailability && existingAvailability.length > 0) {
          const disabledDayRecords = existingAvailability.filter(record => 
            !enabledDays.includes(record.day_of_week)
          );
          
          console.log('[AvailabilityPanel] Records from disabled days:', disabledDayRecords.length);
          
          const availabilityRecords = [];
          
          weekSchedule.forEach(day => {
            if (day.enabled && day.timeSlots.length > 0) {
              day.timeSlots.forEach(slot => {
                if (!slot.id.startsWith('new-')) {
                  availabilityRecords.push({
                    id: slot.id,
                    day_of_week: day.day
                  });
                }
              });
            }
          });
          
          const enabledDayRecords = existingAvailability.filter(record => 
            enabledDays.includes(record.day_of_week)
          );
          
          const newSlotIds = availabilityRecords.map(r => r.id);
          
          const removedEnabledDayRecords = enabledDayRecords.filter(record => 
            !newSlotIds.includes(record.id)
          );
          
          console.log('[AvailabilityPanel] Records from enabled days that were removed:', removedEnabledDayRecords.length);
          
          recordsToDelete = [...disabledDayRecords, ...removedEnabledDayRecords];
        }
        
        const idsToDelete = recordsToDelete.map(record => record.id);
        
        console.log('[AvailabilityPanel] Total records to delete:', idsToDelete.length);
        console.log('[AvailabilityPanel] IDs to delete:', idsToDelete);
        
        if (idsToDelete.length > 0) {
          console.log('[AvailabilityPanel] Deleting records:', idsToDelete);
          
          const { error: deleteError } = await supabase
            .from('availability')
            .delete()
            .in('id', idsToDelete);
          
          if (deleteError) {
            console.error('[AvailabilityPanel] Error deleting records:', deleteError);
            throw deleteError;
          }
          
          console.log('[AvailabilityPanel] Successfully deleted records');
        } else {
          console.log('[AvailabilityPanel] No records to delete');
        }
        
        const availabilityRecordsToUpsert = [];
        
        weekSchedule.forEach(day => {
          if (day.enabled && day.timeSlots.length > 0) {
            day.timeSlots.forEach(slot => {
              availabilityRecordsToUpsert.push({
                id: slot.id.startsWith('new-') ? undefined : slot.id,
                clinician_id: userId,
                day_of_week: day.day,
                start_time: slot.startTime,
                end_time: slot.endTime,
              });
            });
          }
        });
        
        console.log('[AvailabilityPanel] Records to upsert:', availabilityRecordsToUpsert.length);
        
        if (availabilityRecordsToUpsert.length > 0) {
          console.log('[AvailabilityPanel] Upserting records:', availabilityRecordsToUpsert.length);
          
          const { error: upsertError } = await supabase
            .from('availability')
            .upsert(availabilityRecordsToUpsert, { onConflict: 'id' });
          
          if (upsertError) {
            console.error('[AvailabilityPanel] Error upserting records:', upsertError);
            throw upsertError;
          }
          
          console.log('[AvailabilityPanel] Successfully upserted records');
        } else {
          console.log('[AvailabilityPanel] No records to upsert');
        }
        
        console.log('[AvailabilityPanel] Saving settings');
        
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
        
        if (settingsError) {
          console.error('[AvailabilityPanel] Error saving settings:', settingsError);
          throw settingsError;
        }
        
        console.log('[AvailabilityPanel] Successfully saved settings');
      } else if (activeTab === 'single-day' && singleDateTableExists) {
        const { data: tableExists, error: rpcError } = await supabase
          .rpc('check_table_exists', { table_name: 'availability_single_date' });
        
        if (rpcError) {
          console.error('[AvailabilityPanel] Error checking if table exists:', rpcError);
          throw new Error("Could not verify if the single date availability table exists.");
        }
        
        if (!tableExists) {
          throw new Error("The single date availability table does not exist. Please contact support.");
        }
        
        console.log('[AvailabilityPanel] Single day availability saving not yet implemented');
      }
      
      console.log('[AvailabilityPanel] Save operation completed successfully');
      
      toast({
        title: "Availability saved",
        description: "Your availability settings have been updated successfully.",
      });
      
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
      startTime: settings.defaultStartTime,
      endTime: settings.defaultEndTime,
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
            onClick={(e) => handleSaveClick(e)} 
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
          Enable Availability
        </Badge>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="weekly">Weekly Schedule</TabsTrigger>
          <TabsTrigger 
            value="single-day" 
            disabled={!singleDateTableExists}
            className={!singleDateTableExists ? "opacity-50" : ""}
          >
            Single Day
            {!singleDateTableExists && singleDateTableChecked && (
              <Badge variant="outline" className="ml-2 text-xs">Coming Soon</Badge>
            )}
          </TabsTrigger>
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
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addTimeSlot(dayIndex)}
                        className="mt-2"
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Time Slot
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="single-day" className="mt-0">
          {singleDateTableExists ? (
            <div className="p-4 border rounded-lg">
              <p className="text-center text-gray-500">
                Single day availability settings will be available soon.
              </p>
            </div>
          ) : (
            <div className="p-4 border rounded-lg">
              <p className="text-center text-gray-500">
                Single day availability is coming soon. This feature will allow you to set specific availability for individual dates.
              </p>
            </div>
          )}
        </TabsContent>
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
          onClick={(e) => handleSaveClick(e)} 
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
