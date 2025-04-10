import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Clock, Plus, X, ChevronDown, ChevronUp, Loader2, Calendar, CalendarPlus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, isSameDay } from 'date-fns';
import { cn } from "@/lib/utils";

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

interface AvailabilitySettings {
  id: string;
  clinician_id: string;
  time_granularity: 'hour' | 'half-hour';
  min_days_ahead: number;
  max_days_ahead: number;
  default_start_time?: string;
  default_end_time?: string;
  created_at: string;
  updated_at: string;
}

interface AvailabilityPanelProps {
  clinicianId?: string | null;
  onAvailabilityUpdated?: () => void;
  userTimeZone?: string;
}

const AvailabilityPanel: React.FC<AvailabilityPanelProps> = ({ clinicianId, onAvailabilityUpdated, userTimeZone }) => {
  
  const [activeTab, setActiveTab] = useState<string>('set');
  const [availabilityEnabled, setAvailabilityEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [timeGranularity, setTimeGranularity] = useState<'hour' | 'half-hour'>('hour');
  const [minDaysAhead, setMinDaysAhead] = useState<number>(2);
  const [maxDaysAhead, setMaxDaysAhead] = useState<number>(60);
  const [defaultStartTime, setDefaultStartTime] = useState<string>('09:00');
  const [defaultEndTime, setDefaultEndTime] = useState<string>('17:00');
  const [currentUserClinicianId, setCurrentUserClinicianId] = useState<string | null>(null);
  const [isCurrentUserClinicianFetched, setIsCurrentUserClinicianFetched] = useState(false);
  const [currentAuthUserId, setCurrentAuthUserId] = useState<string | null>(null);
  const { toast } = useToast();
  
  const [weekSchedule, setWeekSchedule] = useState<DaySchedule[]>([
    { day: 'Monday', isOpen: true, timeSlots: [] },
    { day: 'Tuesday', isOpen: true, timeSlots: [] },
    { day: 'Wednesday', isOpen: true, timeSlots: [] },
    { day: 'Thursday', isOpen: true, timeSlots: [] },
    { day: 'Friday', isOpen: true, timeSlots: [] },
    { day: 'Saturday', isOpen: false, timeSlots: [] },
    { day: 'Sunday', isOpen: false, timeSlots: [] },
  ]);
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [singleDateTimeSlots, setSingleDateTimeSlots] = useState<TimeSlot[]>([]);
  const [existingSingleAvailability, setExistingSingleAvailability] = useState<{[date: string]: TimeSlot[]}>({});
  
  useEffect(() => {
    async function fetchCurrentUserClinicianId() {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData?.session?.user) {
          console.log('[AvailabilityPanel] User not logged in');
          setIsCurrentUserClinicianFetched(true);
          return;
        }
        
        const authUserId = sessionData.session.user.id;
        setCurrentAuthUserId(authUserId);
        console.log('[AvailabilityPanel] Current auth user ID:', authUserId);
        
        const { data: profileData } = await supabase
          .from('profiles')
          .select('email, role')
          .eq('id', authUserId)
          .single();
          
        if (!profileData) {
          console.log('[AvailabilityPanel] Profile not found');
          setIsCurrentUserClinicianFetched(true);
          return;
        }
        
        console.log('[AvailabilityPanel] User profile role:', profileData.role);
        console.log('[AvailabilityPanel] User profile email:', profileData.email);
        
        if (profileData.role !== 'clinician') {
          console.log('[AvailabilityPanel] User is not a clinician, role:', profileData.role);
          setIsCurrentUserClinicianFetched(true);
          return;
        }
        
        const { data: clinicianData, error: clinicianError } = await supabase
          .from('clinicians')
          .select('id')
          .eq('clinician_email', profileData.email)
          .single();
        
        if (clinicianError) {
          console.error('[AvailabilityPanel] Error finding clinician by email:', clinicianError);
          setIsCurrentUserClinicianFetched(true);
          return;
        } else if (clinicianData) {
          console.log('[AvailabilityPanel] Found clinician ID for current user:', clinicianData.id);
          console.log('[AvailabilityPanel] Auth user ID for comparison:', authUserId);
          setCurrentUserClinicianId(clinicianData.id);
          setIsCurrentUserClinicianFetched(true);
        }
      } catch (error) {
        console.error('[AvailabilityPanel] Error fetching current user clinician ID:', error);
        setIsCurrentUserClinicianFetched(true);
      }
    }
    
    fetchCurrentUserClinicianId();
  }, []);
  
  const effectiveClinicianId = clinicianId || currentUserClinicianId;
  
  useEffect(() => {
    async function fetchAvailability() {
      if (!effectiveClinicianId || !isCurrentUserClinicianFetched) {
        return;
      }
      
      setLoading(true);
      console.log('[AvailabilityPanel] Fetching availability for clinician:', effectiveClinicianId);
      
      try {
        const { data: availabilityData, error: availabilityError } = await supabase
          .from('availability')
          .select('id, day_of_week, start_time, end_time')
          .eq('clinician_id', effectiveClinicianId)
          .eq('is_active', true);
          
        if (availabilityError) {
          console.error('[AvailabilityPanel] Error fetching availability:', availabilityError);
          setLoading(false);
          return;
        }
        
        console.log('[AvailabilityPanel] Retrieved', availabilityData?.length || 0, 'availability records:', availabilityData);
        
        const newSchedule = [...weekSchedule];
        
        try {
          const { data: settingsData } = await supabase.functions.invoke('get-availability-settings', {
            body: { clinicianId: effectiveClinicianId }
          });
          
          if (settingsData) {
            console.log('[AvailabilityPanel] Retrieved settings:', settingsData);
            
            setTimeGranularity(settingsData.time_granularity as 'hour' | 'half-hour');
            setMinDaysAhead(Number(settingsData.min_days_ahead));
            setMaxDaysAhead(Number(settingsData.max_days_ahead));
            setDefaultStartTime(settingsData.default_start_time?.substring(0, 5) || '09:00');
            setDefaultEndTime(settingsData.default_end_time?.substring(0, 5) || '17:00');
            
            console.log('[AvailabilityPanel] Updated settings state:', {
              timeGranularity: settingsData.time_granularity,
              minDaysAhead: Number(settingsData.min_days_ahead),
              maxDaysAhead: Number(settingsData.max_days_ahead),
              defaultStartTime: settingsData.default_start_time?.substring(0, 5) || '09:00',
              defaultEndTime: settingsData.default_end_time?.substring(0, 5) || '17:00'
            });
          }
        } catch (settingsError) {
          console.error('[AvailabilityPanel] Error fetching availability settings:', settingsError);
          setMinDaysAhead(2);
          setMaxDaysAhead(60);
          setDefaultStartTime('09:00');
          setDefaultEndTime('17:00');
        }
        
        newSchedule.forEach(day => {
          day.timeSlots = [];
        });
        
        const uniqueSlots = new Set();
        availabilityData.forEach(slot => {
          const dayIndex = newSchedule.findIndex(day => day.day === slot.day_of_week);
          if (dayIndex !== -1) {
            const startTime = slot.start_time.substring(0, 5);
            const endTime = slot.end_time.substring(0, 5);
            
            const slotKey = `${slot.day_of_week}-${startTime}-${endTime}`;
            
            if (!uniqueSlots.has(slotKey)) {
              uniqueSlots.add(slotKey);
              
              newSchedule[dayIndex].timeSlots.push({
                id: slot.id,
                startTime: startTime,
                endTime: endTime,
              });
              newSchedule[dayIndex].isOpen = true;
            } else {
              console.log(`[AvailabilityPanel] Skipping duplicate slot: ${slotKey}`);
            }
          }
        });
        
        setWeekSchedule(newSchedule);
        
        const { data: singleDateData, error: singleDateError } = await supabase
          .from('availability_single_date')
          .select('id, date, start_time, end_time')
          .eq('clinician_id', effectiveClinicianId)
          .gte('date', new Date().toISOString().split('T')[0]);
          
        if (singleDateError) {
          console.error('[AvailabilityPanel] Error fetching single date availability:', singleDateError);
        } else {
          console.log('[AvailabilityPanel] Retrieved single date availability:', singleDateData);
          
          const singleDateMap: {[date: string]: TimeSlot[]} = {};
          
          singleDateData?.forEach(slot => {
            const dateStr = slot.date;
            if (!singleDateMap[dateStr]) {
              singleDateMap[dateStr] = [];
            }
            
            singleDateMap[dateStr].push({
              id: slot.id,
              startTime: slot.start_time.substring(0, 5),
              endTime: slot.end_time.substring(0, 5),
            });
          });
          
          setExistingSingleAvailability(singleDateMap);
          
          if (selectedDate) {
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            if (singleDateMap[dateStr]) {
              setSingleDateTimeSlots(singleDateMap[dateStr]);
            }
          }
        }
      } catch (error) {
        console.error('[AvailabilityPanel] Error in fetchAvailability:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchAvailability();
  }, [effectiveClinicianId, isCurrentUserClinicianFetched, weekSchedule]);
  
  useEffect(() => {
    if (selectedDate) {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      if (existingSingleAvailability[dateStr]) {
        setSingleDateTimeSlots(existingSingleAvailability[dateStr]);
      } else {
        setSingleDateTimeSlots([]);
      }
    }
  }, [selectedDate, existingSingleAvailability]);
  
  const saveAvailability = async () => {
    setIsSaving(true);
    console.log('[AvailabilityPanel] Saving availability...');
    
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.user) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to save availability",
          variant: "destructive"
        });
        setIsSaving(false);
        return;
      }
      
      const authUserId = sessionData.session.user.id;
      console.log('[AvailabilityPanel] Current auth user ID:', authUserId);
      
      if (!effectiveClinicianId) {
        toast({
          title: "Error",
          description: "No clinician ID found to save availability",
          variant: "destructive"
        });
        setIsSaving(false);
        return;
      }
      
      const isClinicianIdInUuidFormat = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(effectiveClinicianId);
      console.log(`[AvailabilityPanel] Is clinician ID (${effectiveClinicianId}) in UUID format? ${isClinicianIdInUuidFormat}`);
      console.log(`[AvailabilityPanel] Using clinician ID for saving settings: ${effectiveClinicianId}`);
      console.log('[AvailabilityPanel] Time granularity:', timeGranularity);
      console.log('[AvailabilityPanel] Min days ahead:', minDaysAhead);
      console.log('[AvailabilityPanel] Max days ahead:', maxDaysAhead);
      console.log('[AvailabilityPanel] Default start time:', defaultStartTime);
      console.log('[AvailabilityPanel] Default end time:', defaultEndTime);
      
      let clinicianIdToUse = effectiveClinicianId;
      console.log(`[AvailabilityPanel] Final clinician_id being used: ${clinicianIdToUse}`);
      
      const formattedStartTime = defaultStartTime.includes(':') && defaultStartTime.split(':').length === 2
        ? `${defaultStartTime}:00`
        : defaultStartTime;
        
      const formattedEndTime = defaultEndTime.includes(':') && defaultEndTime.split(':').length === 2
        ? `${defaultEndTime}:00`
        : defaultEndTime;
      
      console.log(`[AvailabilityPanel] Formatted start time: ${formattedStartTime}`);
      console.log(`[AvailabilityPanel] Formatted end time: ${formattedEndTime}`);
      
      const { error: settingsError } = await supabase
        .from('availability_settings')
        .upsert({
          clinician_id: clinicianIdToUse,
          time_granularity: timeGranularity,
          min_days_ahead: minDaysAhead,
          max_days_ahead: maxDaysAhead,
          default_start_time: formattedStartTime,
          default_end_time: formattedEndTime
        }, {
          onConflict: 'clinician_id'
        });
        
      if (settingsError) {
        console.error('[AvailabilityPanel] Error saving availability settings:', settingsError);
        toast({
          title: "Error Saving Settings",
          description: settingsError.message,
          variant: "destructive"
        });
        setIsSaving(false);
        return;
      }
      
      console.log('[AvailabilityPanel] Successfully saved settings:', {
        time_granularity: timeGranularity,
        min_days_ahead: minDaysAhead,
        max_days_ahead: maxDaysAhead,
        default_start_time: formattedStartTime,
        default_end_time: formattedEndTime
      });
      
      const { data: existingAvailability, error: fetchError } = await supabase
        .from('availability')
        .select('id, day_of_week, start_time, end_time')
        .eq('clinician_id', clinicianIdToUse)
        .eq('is_active', true);
        
      if (fetchError) {
        console.error('[AvailabilityPanel] Error fetching existing availability:', fetchError);
        toast({
          title: "Error Fetching Existing Availability",
          description: fetchError.message,
          variant: "destructive"
        });
        setIsSaving(false);
        return;
      }
      
      const { data: exceptions, error: exceptionsError } = await supabase
        .from('availability_exceptions')
        .select('original_availability_id')
        .eq('clinician_id', clinicianIdToUse);
        
      if (exceptionsError) {
        console.error('[AvailabilityPanel] Error fetching exceptions:', exceptionsError);
        toast({
          title: "Error Fetching Exceptions",
          description: exceptionsError.message,
          variant: "destructive"
        });
        setIsSaving(false);
        return;
      }
      
      const referencedIds = new Set(
        exceptions?.map(exception => exception.original_availability_id) || []
      );
      
      const existingAvailabilityMap = new Map();
      existingAvailability?.forEach(slot => {
        const key = `${slot.day_of_week}-${slot.start_time.substring(0, 5)}-${slot.end_time.substring(0, 5)}`;
        existingAvailabilityMap.set(key, slot);
      });
      
      const availabilityToKeep = new Set();
      const availabilityIdsToDelete = [];
      const availabilityToInsert = [];
      
      weekSchedule.forEach(day => {
        if (!day.isOpen) return;
        
        day.timeSlots.forEach(slot => {
          const formattedStartTime = slot.startTime;
          const formattedEndTime = slot.endTime;
          const key = `${day.day}-${formattedStartTime}-${formattedEndTime}`;
          
          const existingSlot = existingAvailabilityMap.get(key);
          
          if (existingSlot) {
            availabilityToKeep.add(existingSlot.id);
          } else {
            availabilityToInsert.push({
              clinician_id: clinicianIdToUse,
              day_of_week: day.day,
              start_time: formattedStartTime,
              end_time: formattedEndTime,
              is_active: true
            });
          }
        });
      });
      
      existingAvailability?.forEach(slot => {
        if (!availabilityToKeep.has(slot.id) && !referencedIds.has(slot.id)) {
          availabilityIdsToDelete.push(slot.id);
        }
      });
      
      if (availabilityIdsToDelete.length > 0) {
        console.log('[AvailabilityPanel] Deleting availability IDs:', availabilityIdsToDelete);
        
        const { error: deleteError } = await supabase
          .from('availability')
          .delete()
          .in('id', availabilityIdsToDelete);
          
        if (deleteError) {
          console.error('[AvailabilityPanel] Error deleting availability:', deleteError);
          toast({
            title: "Error Deleting Availability",
            description: deleteError.message,
            variant: "destructive"
          });
          setIsSaving(false);
          return;
        }
      }
      
      if (availabilityToInsert.length > 0) {
        console.log('[AvailabilityPanel] Inserting availability:', availabilityToInsert);
        
        const { error: insertError } = await supabase
          .from('availability')
          .insert(availabilityToInsert);
          
        if (insertError) {
          console.error('[AvailabilityPanel] Error inserting availability:', insertError);
          toast({
            title: "Error Inserting Availability",
            description: insertError.message,
            variant: "destructive"
          });
          setIsSaving(false);
          return;
        }
      }
      
      if (activeTab === 'single' && selectedDate) {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        
        const { data: existingSingleSlots, error: singleFetchError } = await supabase
          .from('availability_single_date')
          .select('id')
          .eq('clinician_id', clinicianIdToUse)
          .eq('date', dateStr);
          
        if (singleFetchError) {
          console.error('[AvailabilityPanel] Error fetching single date slots:', singleFetchError);
          toast({
            title: "Error Fetching Single Date Slots",
            description: singleFetchError.message,
            variant: "destructive"
          });
          setIsSaving(false);
          return;
        }
        
        if (existingSingleSlots && existingSingleSlots.length > 0) {
          const singleSlotIds = existingSingleSlots.map(slot => slot.id);
          
          const { error: singleDeleteError } = await supabase
            .from('availability_single_date')
            .delete()
            .in('id', singleSlotIds);
            
          if (singleDeleteError) {
            console.error('[AvailabilityPanel] Error deleting single date slots:', singleDeleteError);
            toast({
              title: "Error Deleting Single Date Slots",
              description: singleDeleteError.message,
              variant: "destructive"
            });
            setIsSaving(false);
            return;
          }
        }
        
        const singleSlotsToInsert = singleDateTimeSlots.map(slot => ({
          clinician_id: clinicianIdToUse,
          date: dateStr,
          start_time: slot.startTime,
          end_time: slot.endTime
        }));
        
        const { error: singleInsertError } = await supabase
          .from('availability_single_date')
          .insert(singleSlotsToInsert);
          
        if (singleInsertError) {
          console.error('[AvailabilityPanel] Error inserting single date slots:', singleInsertError);
          toast({
            title: "Error Inserting Single Date Slots",
            description: singleInsertError.message,
            variant: "destructive"
          });
          setIsSaving(false);
          return;
        }
      }
      
      toast({
        title: "Availability Saved",
        description: "Your availability has been updated successfully.",
      });
      
      if (onAvailabilityUpdated) {
        onAvailabilityUpdated();
      }
    } catch (error) {
      console.error('[AvailabilityPanel] Error saving availability:', error);
      toast({
        title: "Error Saving Availability",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
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
  
  const addTimeSlot = (dayIndex: number) => {
    setWeekSchedule(prev => {
      const updated = [...prev];
      const day = updated[dayIndex];
      updated[dayIndex] = {
        ...day,
        timeSlots: [
          ...day.timeSlots,
          {
            id: `new-${Date.now()}-${day.timeSlots.length + 1}`,
            startTime: defaultStartTime,
            endTime: defaultEndTime
          }
        ]
      };
      return updated;
    });
  };
  
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
  
  const addSingleDateTimeSlot = () => {
    if (!selectedDate) return;
    
    setSingleDateTimeSlots(prev => [
      ...prev,
      {
        id: `single-${Date.now()}-${prev.length + 1}`,
        startTime: defaultStartTime || '09:00',
        endTime: defaultEndTime || '17:00'
      }
    ]);
  };
  
  const deleteSingleDateTimeSlot = (slotId: string) => {
    setSingleDateTimeSlots(prev => prev.filter(slot => slot.id !== slotId));
  };
  
  const updateSingleDateTimeSlot = (slotId: string, field: 'startTime' | 'endTime', value: string) => {
    setSingleDateTimeSlots(prev => 
      prev.map(slot => slot.id === slotId ? { ...slot, [field]: value } : slot)
    );
  };
  
  if (loading) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center py-10">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading availability...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
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
            <TabsTrigger value="set">
              <Clock className="h-4 w-4 mr-2" />
              Weekly
            </TabsTrigger>
            <TabsTrigger value="single">
              <CalendarPlus className="h-4 w-4 mr-2" />
              Single Day
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {activeTab === 'set' && (
          <div className="space-y-4">
            <div className="p-3 border rounded-md">
              <h3 className="font-medium mb-2">Scheduling Settings</h3>
              <Separator className="my-2" />
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Allow clients to schedule appointments on:
                  </p>
                  <RadioGroup
                    value={timeGranularity}
                    onValueChange={(value) => setTimeGranularity(value as 'hour' | 'half-hour')}
                    className="flex flex-col space-y-1"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="hour" id="hour" />
                      <Label htmlFor="hour">Hour marks only (e.g., 1:00, 2:00)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="half-hour" id="half-hour" />
                      <Label htmlFor="half-hour">Hour and half-hour marks (e.g., 1:00, 1:30)</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    How soon can clients schedule with you?
                  </p>
                  <Select 
                    value={minDaysAhead.toString()} 
                    onValueChange={(value) => setMinDaysAhead(Number(value))}
                  >
                    <SelectTrigger className="w-full max-w-xs">
                      <SelectValue placeholder="Select days in advance" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 15 }, (_, i) => i).map((day) => (
                        <SelectItem key={`days-ahead-${day}`} value={day.toString()}>
                          {day} {day === 1 ? 'day' : 'days'} in advance
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Default working hours:
                  </p>
                  <div className="flex items-center gap-2">
                    <Select 
                      value={defaultStartTime} 
                      onValueChange={setDefaultStartTime}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue placeholder="Start" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                          <SelectItem key={`start-${hour}`} value={`${hour.toString().padStart(2, '0')}:00`}>
                            {hour.toString().padStart(2, '0')}:00
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span>to</span>
                    <Select 
                      value={defaultEndTime} 
                      onValueChange={setDefaultEndTime}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue placeholder="End" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                          <SelectItem key={`end-${hour}`} value={`${hour.toString().padStart(2, '0')}:00`}>
                            {hour.toString().padStart(2, '0')}:00
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-3 border rounded-md">
              <h3 className="font-medium mb-2">Weekly Schedule</h3>
              <Separator className="my-2" />
              <div className="space-y-3">
                {weekSchedule.map((day, index) => (
                  <Collapsible key={day.day} className="border rounded-md">
                    <div className="flex items-center justify-between p-3">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={day.isOpen}
                          onCheckedChange={() => toggleDayOpen(index)}
                        />
                        <span className={cn("font-medium", !day.isOpen && "text-muted-foreground")}>
                          {day.day}
                        </span>
                        {day.isOpen && day.timeSlots.length > 0 && (
                          <Badge variant="outline" className="ml-2">
                            {day.timeSlots.length} {day.timeSlots.length === 1 ? 'slot' : 'slots'}
                          </Badge>
                        )}
                      </div>
                      {day.isOpen && (
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <ChevronDown className="h-4 w-4" />
                            <span className="sr-only">Toggle</span>
                          </Button>
                        </CollapsibleTrigger>
                      )}
                    </div>
                    {day.isOpen && (
                      <CollapsibleContent>
                        <div className="p-3 pt-0 space-y-3">
                          {day.timeSlots.map((slot) => (
                            <div key={slot.id} className="flex items-center gap-2">
                              <Select 
                                value={slot.startTime} 
                                onValueChange={(value) => updateTimeSlot(index, slot.id, 'startTime', value)}
                              >
                                <SelectTrigger className="w-24">
                                  <SelectValue placeholder="Start" />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                                    <SelectItem key={`${slot.id}-start-${hour}`} value={`${hour.toString().padStart(2, '0')}:00`}>
                                      {hour.toString().padStart(2, '0')}:00
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <span>to</span>
                              <Select 
                                value={slot.endTime} 
                                onValueChange={(value) => updateTimeSlot(index, slot.id, 'endTime', value)}
                              >
                                <SelectTrigger className="w-24">
                                  <SelectValue placeholder="End" />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                                    <SelectItem key={`${slot.id}-end-${hour}`} value={`${hour.toString().padStart(2, '0')}:00`}>
                                      {hour.toString().padStart(2, '0')}:00
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => deleteTimeSlot(index, slot.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full mt-2" 
                            onClick={() => addTimeSlot(index)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Time Slot
                          </Button>
                        </div>
                      </CollapsibleContent>
                    )}
                  </Collapsible>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'single' && (
          <div className="space-y-4">
            <div className="p-3 border rounded-md">
              <h3 className="font-medium mb-2">Select Date</h3>
              <Separator className="my-2" />
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className="w-full justify-start text-left font-normal"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {selectedDate ? (
                          format(selectedDate, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  
                  <div className="mt-4">
                    <h4 className="font-medium mb-2 text-sm">Time Slots for Selected Date</h4>
                    
                    {singleDateTimeSlots.length === 0 ? (
                      <div className="text-sm text-muted-foreground">
                        No time slots set for this date. Add a time slot below.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {singleDateTimeSlots.map((slot) => (
                          <div key={slot.id} className="flex items-center gap-2">
                            <Select 
                              value={slot.startTime} 
                              onValueChange={(value) => updateSingleDateTimeSlot(slot.id, 'startTime', value)}
                            >
                              <SelectTrigger className="w-24">
                                <SelectValue placeholder="Start" />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                                  <SelectItem key={`${slot.id}-start-${hour}`} value={`${hour.toString().padStart(2, '0')}:00`}>
                                    {hour.toString().padStart(2, '0')}:00
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <span>to</span>
                            <Select 
                              value={slot.endTime} 
                              onValueChange={(value) => updateSingleDateTimeSlot(slot.id, 'endTime', value)}
                            >
                              <SelectTrigger className="w-24">
                                <SelectValue placeholder="End" />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                                  <SelectItem key={`${slot.id}-end-${hour}`} value={`${hour.toString().padStart(2, '0')}:00`}>
                                    {hour.toString().padStart(2, '0')}:00
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => deleteSingleDateTimeSlot(slot.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-4" 
                      onClick={addSingleDateTimeSlot}
                      disabled={!selectedDate}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Time Slot
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex justify-end mt-6">
          <Button
            onClick={saveAvailability}
            disabled={isSaving}
            className="w-full sm:w-auto"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Availability'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AvailabilityPanel;
