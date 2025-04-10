import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Clock, Plus, X, ChevronDown, ChevronUp, Loader2, Calendar, CalendarPlus, AlertTriangle } from 'lucide-react';
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
  const [error, setError] = useState<Error | null>(null);
  const [singleDateTableExists, setSingleDateTableExists] = useState<boolean>(true);
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
          console.log('[AvailabilityPanel] No profile found for user');
          setIsCurrentUserClinicianFetched(true);
          return;
        }
        
        console.log('[AvailabilityPanel] User role:', profileData.role);
        
        if (profileData.role === 'clinician') {
          const { data: clinicianData, error: clinicianError } = await supabase
            .from('clinicians')
            .select('id')
            .eq('auth_id', authUserId)
            .single();
            
          if (clinicianError) {
            console.error('[AvailabilityPanel] Error fetching clinician:', clinicianError);
          } else if (clinicianData) {
            console.log('[AvailabilityPanel] Found clinician ID:', clinicianData.id);
            setCurrentUserClinicianId(clinicianData.id);
          }
        }
        
        setIsCurrentUserClinicianFetched(true);
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
      setError(null);
      console.log('[AvailabilityPanel] Fetching availability for clinician:', effectiveClinicianId);
      
      try {
        const { data: availabilityData, error: availabilityError } = await supabase
          .from('availability')
          .select('id, day_of_week, start_time, end_time')
          .eq('clinician_id', effectiveClinicianId)
          .eq('is_active', true);
          
        if (availabilityError) {
          console.error('[AvailabilityPanel] Error fetching availability:', availabilityError);
          setError(new Error(availabilityError.message));
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
        }
        
        // Reset all time slots
        newSchedule.forEach(day => {
          day.timeSlots = [];
        });
        
        // Group availability by day
        const availabilityByDay: { [key: string]: TimeSlot[] } = {};
        
        availabilityData?.forEach(slot => {
          const day = slot.day_of_week;
          if (!availabilityByDay[day]) {
            availabilityByDay[day] = [];
          }
          
          availabilityByDay[day].push({
            id: slot.id,
            startTime: slot.start_time.substring(0, 5),
            endTime: slot.end_time.substring(0, 5)
          });
        });
        
        // Update schedule with fetched availability
        newSchedule.forEach(day => {
          if (availabilityByDay[day.day]) {
            day.timeSlots = availabilityByDay[day.day];
            day.isOpen = true;
          }
        });
        
        setWeekSchedule(newSchedule);
        
        // Check if availability_single_date table exists
        const { data: tableInfo, error: tableCheckError } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public')
          .eq('table_name', 'availability_single_date')
          .maybeSingle();
        
        if (tableCheckError) {
          console.error('[AvailabilityPanel] Error checking if table exists:', tableCheckError);
          setSingleDateTableExists(false);
        } else if (!tableInfo) {
          console.warn('[AvailabilityPanel] availability_single_date table does not exist');
          setSingleDateTableExists(false);
          setExistingSingleAvailability({});
          setSingleDateTimeSlots([]);
          
          // Show a warning toast
          toast({
            title: "Warning",
            description: "Single date availability feature is not fully configured. Please contact support.",
            variant: "warning"
          });
        } else {
          setSingleDateTableExists(true);
          
          // Fetch single date availability if table exists
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
        }
      } catch (error) {
        console.error('[AvailabilityPanel] Error in fetchAvailability:', error);
        setError(error as Error);
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
      
      // Handle single date availability
      if (activeTab === 'single' && selectedDate) {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        
        // Check if availability_single_date table exists
        const { data: tableInfo, error: tableCheckError } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public')
          .eq('table_name', 'availability_single_date')
          .maybeSingle();
        
        if (tableCheckError) {
          console.error('[AvailabilityPanel] Error checking if table exists:', tableCheckError);
          toast({
            title: "Error",
            description: "Could not verify database configuration. Please contact support.",
            variant: "destructive"
          });
          setIsSaving(false);
          return;
        }
        
        if (!tableInfo) {
          console.warn('[AvailabilityPanel] Cannot save single date availability - table does not exist');
          setSingleDateTableExists(false);
          toast({
            title: "Warning",
            description: "Single date availability could not be saved due to a database configuration issue. Please contact support.",
            variant: "warning"
          });
        } else {
          setSingleDateTableExists(true);
          
          // Table exists, proceed with saving single date availability
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
          
          if (singleDateTimeSlots.length > 0) {
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
        description: error.message || "An unexpected error occurred while saving your availability.",
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
      
      const newStartTime = defaultStartTime.substring(0, 5);
      const newEndTime = defaultEndTime.substring(0, 5);
      
      // Validate the new time slot
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
      
      // Create a temporary array without the current slot for validation
      const otherSlots = slots.filter((_, idx) => idx !== slotIndex);
      
      // Validate the updated time slot
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
    if (!selectedDate) return;
    
    const newStartTime = defaultStartTime.substring(0, 5);
    const newEndTime = defaultEndTime.substring(0, 5);
    
    // Validate the new time slot
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
      
      // Create a temporary array without the current slot for validation
      const otherSlots = prev.filter(slot => slot.id !== id);
      
      // Validate the updated time slot
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
      setMinDaysAhead(numValue);
    }
  };
  
  const handleMaxDaysAheadChange = (value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0) {
      setMaxDaysAhead(numValue);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Clock className="mr-2 h-5 w-5" />
            Availability
          </div>
          <div className="flex items-center">
            <span className="mr-2 text-sm">Enable Availability</span>
            <Switch
              checked={availabilityEnabled}
              onCheckedChange={setAvailabilityEnabled}
            />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p>Loading availability settings...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8 text-destructive">
            <AlertTriangle className="h-8 w-8 mb-4" />
            <p>There was a problem loading your availability settings.</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </div>
        ) : (
          <div>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="set">Weekly Schedule</TabsTrigger>
                <TabsTrigger value="single" disabled={!singleDateTableExists}>
                  Single Day
                  {!singleDateTableExists && (
                    <Badge variant="outline" className="ml-2 text-xs">Unavailable</Badge>
                  )}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="set">
                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Scheduling Settings</h4>
                      <div className="space-y-4">
                        <div>
                          <h5 className="text-sm font-medium mb-2">Allow clients to schedule appointments on:</h5>
                          <RadioGroup 
                            value={timeGranularity} 
                            onValueChange={(value) => setTimeGranularity(value as 'hour' | 'half-hour')}
                            className="space-y-2"
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
                          <h5 className="text-sm font-medium mb-2">How soon can clients schedule with you?</h5>
                          <Select 
                            value={minDaysAhead.toString()} 
                            onValueChange={handleMinDaysAheadChange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select days" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">Same day</SelectItem>
                              <SelectItem value="1">1 day in advance</SelectItem>
                              <SelectItem value="2">2 days in advance</SelectItem>
                              <SelectItem value="3">3 days in advance</SelectItem>
                              <SelectItem value="5">5 days in advance</SelectItem>
                              <SelectItem value="7">1 week in advance</SelectItem>
                              <SelectItem value="14">2 weeks in advance</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <h5 className="text-sm font-medium mb-2">Default working hours:</h5>
                          <div className="flex items-center space-x-2">
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
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Weekly Schedule</h4>
                      <div className="space-y-2">
                        {weekSchedule.map((day, dayIndex) => (
                          <Collapsible key={day.day} className="border rounded-md">
                            <div className="flex items-center justify-between p-3">
                              <div className="flex items-center">
                                <Switch
                                  checked={day.isOpen}
                                  onCheckedChange={() => toggleDayOpen(dayIndex)}
                                  className="mr-3"
                                />
                                <span className={cn(
                                  "font-medium",
                                  !day.isOpen && "text-muted-foreground"
                                )}>
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
                                  <Button variant="ghost" size="sm">
                                    <ChevronDown className="h-4 w-4" />
                                  </Button>
                                </CollapsibleTrigger>
                              )}
                            </div>
                            
                            {day.isOpen && (
                              <CollapsibleContent>
                                <div className="p-3 pt-0 space-y-2">
                                  {day.timeSlots.length === 0 ? (
                                    <div className="text-sm text-muted-foreground">
                                      No time slots set for this day. Add a time slot below.
                                    </div>
                                  ) : (
                                    <div className="space-y-2">
                                      {day.timeSlots.map((slot, slotIndex) => (
                                        <div key={slot.id} className="flex items-center gap-2">
                                          <Select 
                                            value={slot.startTime} 
                                            onValueChange={(value) => updateTimeSlot(dayIndex, slotIndex, 'startTime', value)}
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
                                            onValueChange={(value) => updateTimeSlot(dayIndex, slotIndex, 'endTime', value)}
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
                                            onClick={() => deleteTimeSlot(dayIndex, slotIndex)}
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
                                    className="w-full" 
                                    onClick={() => addTimeSlot(dayIndex)}
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
                </div>
              </TabsContent>
              <TabsContent value="single">
                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </TabsContent>
            </Tabs>
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
