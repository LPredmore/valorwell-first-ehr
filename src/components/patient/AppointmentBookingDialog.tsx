import React, { useState, useEffect } from 'react';
import { format, parse, addDays, isSameDay, isAfter, differenceInCalendarDays } from 'date-fns';
import { Calendar as CalendarIcon, Clock, Check, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getUserTimeZone } from '@/utils/timeZoneUtils';
import { TimeZoneService } from '@/utils/timeZoneService';
import { DateTime } from 'luxon';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/context/UserContext';

import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AppointmentBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clinicianId: string | null;
  clinicianName: string | null;
  clientId: string | null;
  onAppointmentBooked: () => void;
  userTimeZone?: string;
}

interface AvailabilityBlock {
  id: string;
  clinician_id: string;
  start_at: string; // UTC timestamp
  end_at: string;   // UTC timestamp
  is_active: boolean;
}

interface TimeSlot {
  utcStart: string;   // UTC ISO string for start
  utcEnd: string;     // UTC ISO string for end
  localTime: string;  // Formatted local time for display
  available: boolean;
}

interface AvailabilitySettings {
  time_granularity: string;
  min_days_ahead: number;
  max_days_ahead?: number;
  _fallback?: boolean;
  _error?: string;
}

const AppointmentBookingDialog: React.FC<AppointmentBookingDialogProps> = ({
  open,
  onOpenChange,
  clinicianId,
  clinicianName,
  clientId,
  onAppointmentBooked,
  userTimeZone: propTimeZone
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [notes, setNotes] = useState<string>("");
  const [availabilityBlocks, setAvailabilityBlocks] = useState<AvailabilityBlock[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [bookingInProgress, setBookingInProgress] = useState<boolean>(false);
  const [minDaysAhead, setMinDaysAhead] = useState<number>(1);
  const [clinicianTimeZone, setClinicianTimeZone] = useState<string>(TimeZoneService.DEFAULT_TIMEZONE);
  const [apiErrors, setApiErrors] = useState<{
    availabilitySettings?: string;
    availabilityBlocks?: string;
    appointments?: string;
    auth?: string; // Added auth property to fix type error
  }>({});
  const { toast } = useToast();
  const navigate = useNavigate(); // Added navigate hook
  
  // Get auth state from UserContext
  const { userId, isLoading: userIsLoading, authInitialized } = useUser();
  
  // Get user's timezone safely
  const userTimeZone = TimeZoneService.ensureIANATimeZone(
    propTimeZone || getUserTimeZone()
  );

  // When dialog opens, fetch clinician's timezone and availability settings
  useEffect(() => {
    if (!open || !clinicianId) return;
    
    const fetchClinicianData = async () => {
      try {
        setApiErrors({});
        console.log(`[BookingDialog] Dialog opened for clinician ID: ${clinicianId}`);
        console.log(`[BookingDialog] Current auth status - userId: ${userId ? 'exists' : 'null'}, isLoading: ${userIsLoading}, authInitialized: ${authInitialized}`);
        
        // Check authentication status before proceeding
        if (userIsLoading) {
          console.log('[BookingDialog] User context still loading, waiting before making API calls');
          return; // Exit early and wait for auth to be ready
        }
        
        if (!userId && authInitialized) {
          console.error('[BookingDialog] No authenticated user found, but auth is initialized');
          setApiErrors(prev => ({ 
            ...prev, 
            auth: 'Authentication required. Please log in again.' 
          }));
          return; // Exit early due to auth error
        }
        
        // Get clinician's timezone
        const { data: clinicianData, error: clinicianError } = await supabase
          .from('clinicians')
          .select('clinician_time_zone')
          .eq('id', clinicianId)
          .single();
          
        if (!clinicianError && clinicianData) {
          const safeTimezone = TimeZoneService.ensureIANATimeZone(
            clinicianData.clinician_time_zone
          );
          console.log(`[BookingDialog] Retrieved clinician timezone from database: ${clinicianData.clinician_time_zone}, safe version: ${safeTimezone}`);
          setClinicianTimeZone(safeTimezone);
        } else {
          console.error('[BookingDialog] Error fetching clinician timezone:', clinicianError);
          console.log(`[BookingDialog] No clinician timezone found, using default: ${TimeZoneService.DEFAULT_TIMEZONE}`);
          setClinicianTimeZone(TimeZoneService.DEFAULT_TIMEZONE);
        }
        
        // Get availability settings from Edge Function
        console.log('[BookingDialog] Starting call to getavailabilitysettings Edge Function for clinician ID:', clinicianId);
        const fullClinicianId = clinicianId.toString(); // Ensure string format
        console.log('[BookingDialog] Using full clinician ID for Edge Function call:', fullClinicianId);
        console.log('[BookingDialog] Authentication state before Edge Function call - userId:', userId);
        
        try {
          console.log('[BookingDialog] Attempting to call "getavailabilitysettings" Edge Function...');
          const startTime = performance.now();
          
          // Call the Edge Function
          const { data: settingsData, error: settingsError } = await supabase.functions.invoke('getavailabilitysettings', {
            body: { clinicianId: fullClinicianId }
          });
          
          const endTime = performance.now();
          console.log(`[BookingDialog] Edge Function call completed in ${(endTime - startTime).toFixed(2)}ms`);
          
          if (settingsError) {
            console.error('[BookingDialog] Error invoking getavailabilitysettings Edge Function:', settingsError);
            console.error('[BookingDialog] Full error object:', JSON.stringify(settingsError, null, 2));
            
            // Check if this is an auth error
            const errorMessage = settingsError.message || '';
            const isAuthError = 
              errorMessage.includes('auth') || 
              errorMessage.includes('Authentication') ||
              errorMessage.includes('JWT') ||
              errorMessage.includes('token') ||
              errorMessage.includes('401');
            
            if (isAuthError) {
              setApiErrors(prev => ({ 
                ...prev, 
                availabilitySettings: 'Authentication error. Please log out and log in again.' 
              }));
              
              toast({
                title: "Authentication Error",
                description: "Your session may have expired. Please try logging out and logging back in.",
                variant: "destructive"
              });
            } else {
              setApiErrors(prev => ({ 
                ...prev, 
                availabilitySettings: 'Failed to fetch availability settings. Please try again later.' 
              }));
            }
            
            // Use default values on error
            setMinDaysAhead(1);
          } else if (settingsData) {
            console.log('[BookingDialog] Successfully received data from getavailabilitysettings:', JSON.stringify(settingsData, null, 2));
            handleAvailabilitySettingsResponse(settingsData);
          } else {
            console.warn('[BookingDialog] No data received from getavailabilitysettings Edge Function call');
            setMinDaysAhead(1);
          }
        } catch (edgeFunctionError) {
          console.error('[BookingDialog] Exception calling availability settings Edge Function:', edgeFunctionError);
          console.error('[BookingDialog] Exception details:', JSON.stringify(edgeFunctionError, null, 2));
          
          // Check if the error is related to network/auth
          const errorMessage = edgeFunctionError instanceof Error ? edgeFunctionError.message : String(edgeFunctionError);
          if (errorMessage.includes('NetworkError') || errorMessage.includes('Failed to fetch')) {
            setApiErrors(prev => ({ ...prev, availabilitySettings: 'Network error connecting to availability settings service' }));
          } else if (errorMessage.includes('auth') || errorMessage.includes('Authentication')) {
            setApiErrors(prev => ({ 
              ...prev, 
              availabilitySettings: 'Authentication error accessing availability settings. Please log out and log in again.' 
            }));
            
            toast({
              title: "Authentication Error",
              description: "Your session may have expired. Please try logging out and logging back in.",
              variant: "destructive"
            });
          } else {
            setApiErrors(prev => ({ ...prev, availabilitySettings: 'Could not connect to availability settings service' }));
          }
          
          // Use default value
          setMinDaysAhead(1);
        }
      } catch (error) {
        console.error('[BookingDialog] Caught error fetching clinician data:', error);
        setApiErrors(prev => ({ ...prev, availabilitySettings: 'Failed to load clinician configuration' }));
        setMinDaysAhead(1);
      }
    };
    
    fetchClinicianData();
  }, [clinicianId, open, userId, userIsLoading, authInitialized, toast]);

  // Helper function to process availability settings response
  const handleAvailabilitySettingsResponse = (settingsData: any) => {
    // Safely parse the min_days_ahead value
    const parsedMinDays = typeof settingsData.min_days_ahead === 'number' 
      ? settingsData.min_days_ahead 
      : Number(settingsData.min_days_ahead);
      
    if (isNaN(parsedMinDays)) {
      console.warn('[BookingDialog] min_days_ahead is not a valid number, using default: 1');
      setMinDaysAhead(1);
    } else {
      console.log('[BookingDialog] Using min_days_ahead:', parsedMinDays);
      setMinDaysAhead(parsedMinDays || 1);
    }
    
    // Flag if we're using fallback data
    if (settingsData._fallback) {
      console.warn('[BookingDialog] Using fallback availability settings');
      if (settingsData._error) {
        console.error('[BookingDialog] Original error:', settingsData._error);
      }
    }
  };

  // Fetch availability blocks from the database
  useEffect(() => {
    const fetchAvailability = async () => {
      if (!clinicianId) return;
      
      setLoading(true);
      try {
        // Get availability blocks using UTC timestamps
        const { data, error } = await supabase
          .from('availability_blocks')
          .select('*')
          .eq('clinician_id', clinicianId)
          .eq('is_active', true);
          
        if (error) {
          console.error('[BookingDialog] Error fetching availability:', error);
          setApiErrors(prev => ({ ...prev, availabilityBlocks: 'Could not fetch therapist availability' }));
          toast({
            title: "Error",
            description: "Could not fetch therapist availability",
            variant: "destructive"
          });
        } else {
          console.log('[BookingDialog] Retrieved availability blocks:', data?.length || 0);
          setAvailabilityBlocks(data || []);
        }
      } catch (error) {
        console.error('[BookingDialog] Error:', error);
        setApiErrors(prev => ({ ...prev, availabilityBlocks: 'Failed to load availability data' }));
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, [clinicianId, toast]);

  // Generate time slots when a date is selected and we have availability data
  useEffect(() => {
    if (!selectedDate) {
      setTimeSlots([]);
      return;
    }

    // Convert selected date to DateTime for easier manipulation
    const selectedDateLuxon = DateTime.fromJSDate(selectedDate).setZone(userTimeZone).startOf('day');
    console.log(`[BookingDialog] Generating slots for date: ${selectedDateLuxon.toFormat('yyyy-MM-dd')}`);
    
    // Check if date is too soon based on minDaysAhead
    const today = DateTime.now().setZone(userTimeZone).startOf('day');
    const daysFromToday = selectedDateLuxon.diff(today, 'days').days;
    
    console.log('[BookingDialog] Days from today:', daysFromToday, 'minDaysAhead:', minDaysAhead);
    
    if (daysFromToday < minDaysAhead) {
      console.log('[BookingDialog] Selected date is too soon, should be blocked');
      setTimeSlots([]);
      return;
    }
    
    // If we have no availability blocks, we need to generate slots from clinician availability settings
    if (availabilityBlocks.length === 0) {
      console.log('[BookingDialog] No availability blocks found, will try to generate from clinician weekly schedule');
      fetchWeeklySchedule(selectedDateLuxon);
      return;
    }
    
    const slots: TimeSlot[] = [];
    
    // Process availability blocks for the selected day
    availabilityBlocks.forEach(block => {
      if (!block.start_at || !block.end_at) {
        console.warn('[BookingDialog] Invalid availability block', { blockId: block.id });
        return;
      }
      
      try {
        // Convert UTC block to clinician's timezone and check if it's on this day of week
        const blockStartLocal = TimeZoneService.fromUTC(block.start_at, clinicianTimeZone);
        const blockEndLocal = TimeZoneService.fromUTC(block.end_at, clinicianTimeZone);
        
        const blockDayOfWeek = blockStartLocal.weekday; // 1-7 (Monday to Sunday in Luxon)
        const selectedDayOfWeek = selectedDateLuxon.weekday;
        
        if (blockDayOfWeek === selectedDayOfWeek) {
          console.log(`[BookingDialog] Found block for day ${blockDayOfWeek}:`, 
            `${blockStartLocal.toFormat('HH:mm')} - ${blockEndLocal.toFormat('HH:mm')}`);
          
          // Generate 30-minute slots for this block
          let slotStart = blockStartLocal;
          while (slotStart < blockEndLocal) {
            const slotEnd = slotStart.plus({ minutes: 30 });
            
            // Create slot with user's time
            const slotInUserTZ = slotStart.setZone(userTimeZone);
            
            // Map this time to the actual date selected
            const slotStartOnSelectedDate = selectedDateLuxon
              .set({
                hour: slotInUserTZ.hour,
                minute: slotInUserTZ.minute,
                second: 0,
                millisecond: 0
              });
            
            const slotEndOnSelectedDate = slotStartOnSelectedDate.plus({ minutes: 30 });
            
            // Convert back to UTC for storage
            const slotStartUTC = slotStartOnSelectedDate.toUTC();
            const slotEndUTC = slotEndOnSelectedDate.toUTC();
            
            slots.push({
              utcStart: slotStartUTC.toISO(),
              utcEnd: slotEndUTC.toISO(),
              localTime: slotInUserTZ.toFormat('h:mm a'),
              available: true
            });
            
            slotStart = slotEnd;
          }
        }
      } catch (error) {
        console.error('[BookingDialog] Error processing availability block:', error);
      }
    });
    
    // Sort slots by time
    slots.sort((a, b) => a.utcStart.localeCompare(b.utcStart));
    
    // Check if any slots are already booked
    const checkExistingAppointments = async () => {
      if (!selectedDate || !clinicianId) return;
      
      try {
        const selectedDateISO = selectedDateLuxon.toISO();
        const nextDayISO = selectedDateLuxon.plus({ days: 1 }).toISO();
        
        console.log('[BookingDialog] Checking appointments between:', selectedDateISO, 'and', nextDayISO);
        
        const { data, error } = await supabase
          .from('appointments')
          .select('*')
          .eq('clinician_id', clinicianId)
          .eq('status', 'scheduled')
          .gte('start_at', selectedDateISO)
          .lt('start_at', nextDayISO);
          
        if (error) {
          console.error('[BookingDialog] Error fetching appointments:', error);
          setApiErrors(prev => ({ ...prev, appointments: 'Error checking existing appointments' }));
        } else if (data && data.length > 0) {
          console.log('[BookingDialog] Found existing appointments:', data.length);
          
          // Mark booked slots as unavailable
          const updatedSlots = slots.map(slot => {
            const isBooked = data.some(appointment => {
              return new Date(appointment.start_at).getTime() === new Date(slot.utcStart).getTime();
            });
            
            return {
              ...slot,
              available: !isBooked
            };
          });
          
          setTimeSlots(updatedSlots);
        } else {
          setTimeSlots(slots);
        }
      } catch (error) {
        console.error('[BookingDialog] Error checking existing appointments:', error);
        setApiErrors(prev => ({ ...prev, appointments: 'Error checking booking availability' }));
        setTimeSlots(slots); // Use slots without availability check on error
      }
    };
    
    checkExistingAppointments();
  }, [selectedDate, availabilityBlocks, userTimeZone, clinicianId, minDaysAhead, clinicianTimeZone]);

  // New function to fetch and process weekly schedule from clinician data
  const fetchWeeklySchedule = async (selectedDateLuxon: DateTime) => {
    if (!clinicianId) return;
    
    try {
      console.log('[BookingDialog] Fetching weekly schedule for clinician:', clinicianId);
      
      // Fetch the clinician's full record to get weekly availability pattern
      const { data: clinicianData, error } = await supabase
        .from('clinicians')
        .select('*')
        .eq('id', clinicianId)
        .single();
      
      if (error) {
        console.error('[BookingDialog] Error fetching clinician data:', error);
        setApiErrors(prev => ({ ...prev, availabilityBlocks: 'Could not fetch clinician schedule' }));
        return;
      }
      
      console.log('[BookingDialog] Successfully retrieved clinician data with available days:', 
        Object.keys(clinicianData)
          .filter(key => key.startsWith('clinician_availability_start_') && clinicianData[key])
          .map(key => key.replace('clinician_availability_start_', ''))
      );
      
      // Get the day of week for the selected date (0-6, where 0 is Sunday)
      const selectedDayNum = selectedDateLuxon.weekday % 7; // Convert from Luxon's 1-7 (Mon-Sun) to 0-6 (Sun-Sat)
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const selectedDayName = dayNames[selectedDayNum];
      
      console.log(`[BookingDialog] Processing ${selectedDayName} schedule`);
      
      const slots: TimeSlot[] = [];
      
      // Check each of the 3 possible slots for this day
      for (let slotNum = 1; slotNum <= 3; slotNum++) {
        const startTimeKey = `clinician_availability_start_${selectedDayName}_${slotNum}`;
        const endTimeKey = `clinician_availability_end_${selectedDayName}_${slotNum}`;
        const tzKey = `clinician_availability_timezone_${selectedDayName}_${slotNum}`;
        
        console.log(`[BookingDialog] Checking slot ${slotNum} for ${selectedDayName}:`);
        console.log(`  - Start time key: ${startTimeKey} = ${clinicianData[startTimeKey]}`);
        console.log(`  - End time key: ${endTimeKey} = ${clinicianData[endTimeKey]}`);
        console.log(`  - Timezone key: ${tzKey} = ${clinicianData[tzKey]}`);
        
        if (clinicianData[startTimeKey] && clinicianData[endTimeKey]) {
          // Get the slot's timezone or default to clinician's timezone
          const rawSlotTimezone = clinicianData[tzKey] || clinicianData.clinician_time_zone || TimeZoneService.DEFAULT_TIMEZONE;
          console.log(`[BookingDialog] Raw slot timezone: ${rawSlotTimezone}, type: ${typeof rawSlotTimezone}`);
          
          const slotTimezone = TimeZoneService.ensureIANATimeZone(rawSlotTimezone);
          console.log(`[BookingDialog] Using validated slot timezone: ${slotTimezone}`);
          
          // Parse the time strings
          const startParts = clinicianData[startTimeKey].split(':').map(Number);
          const endParts = clinicianData[endTimeKey].split(':').map(Number);
          
          console.log(`[BookingDialog] Start parts: ${startParts}, End parts: ${endParts}`);
          
          // Create start and end times in the slot's timezone
          const slotStart = selectedDateLuxon.setZone(slotTimezone).set({
            hour: startParts[0] || 0,
            minute: startParts[1] || 0,
            second: 0,
            millisecond: 0
          });
          
          const slotEnd = selectedDateLuxon.setZone(slotTimezone).set({
            hour: endParts[0] || 0,
            minute: endParts[1] || 0,
            second: 0,
            millisecond: 0
          });
          
          console.log(`[BookingDialog] Slot start in ${slotTimezone}: ${slotStart.toFormat('yyyy-MM-dd HH:mm:ss')}`);
          console.log(`[BookingDialog] Slot end in ${slotTimezone}: ${slotEnd.toFormat('yyyy-MM-dd HH:mm:ss')}`);
          
          // Generate 30-minute time slots
          let timeSlotStart = slotStart;
          while (timeSlotStart < slotEnd) {
            const timeSlotEnd = timeSlotStart.plus({ minutes: 30 });
            
            // Convert to user timezone for display
            const slotInUserTZ = timeSlotStart.setZone(userTimeZone);
            const slotEndInUserTZ = timeSlotEnd.setZone(userTimeZone);
            
            // Convert back to UTC for storage
            const utcStart = timeSlotStart.toUTC().toISO();
            const utcEnd = timeSlotEnd.toUTC().toISO();
            
            console.log(`[BookingDialog] Created 30-min slot: ${slotInUserTZ.toFormat('h:mm a')} (${userTimeZone})`);
            
            slots.push({
              utcStart,
              utcEnd,
              localTime: slotInUserTZ.toFormat('h:mm a'),
              available: true
            });
            
            timeSlotStart = timeSlotEnd;
          }
        }
      }
      
      // Sort and filter for existing appointments
      slots.sort((a, b) => a.utcStart.localeCompare(b.utcStart));
      
      if (slots.length > 0) {
        console.log(`[BookingDialog] Generated ${slots.length} slots from weekly schedule`);
        checkWeeklyScheduleAppointments(slots, selectedDateLuxon);
      } else {
        console.log(`[BookingDialog] No availability configured for ${selectedDayName}`);
        setTimeSlots([]);
      }
    } catch (error) {
      console.error('[BookingDialog] Error generating slots from weekly schedule:', error);
      setApiErrors(prev => ({ ...prev, availabilityBlocks: 'Error generating appointment slots' }));
    }
  };
  
  // Check weekly schedule slots against existing appointments
  const checkWeeklyScheduleAppointments = async (slots: TimeSlot[], selectedDateLuxon: DateTime) => {
    if (!clinicianId) return;
    
    try {
      const selectedDateISO = selectedDateLuxon.toISO();
      const nextDayISO = selectedDateLuxon.plus({ days: 1 }).toISO();
      
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('clinician_id', clinicianId)
        .eq('status', 'scheduled')
        .gte('start_at', selectedDateISO)
        .lt('start_at', nextDayISO);
        
      if (error) {
        console.error('[BookingDialog] Error checking appointments for weekly schedule:', error);
        setTimeSlots(slots); // Use all slots as available
        return;
      }
      
      if (data && data.length > 0) {
        console.log(`[BookingDialog] Found ${data.length} existing appointments`);
        
        // Mark booked slots as unavailable
        const updatedSlots = slots.map(slot => {
          const isBooked = data.some(appointment => 
            new Date(appointment.start_at).getTime() === new Date(slot.utcStart).getTime()
          );
          
          return {
            ...slot,
            available: !isBooked
          };
        });
        
        setTimeSlots(updatedSlots);
      } else {
        setTimeSlots(slots);
      }
    } catch (error) {
      console.error('[BookingDialog] Error checking appointments for weekly schedule:', error);
      setTimeSlots(slots); // Use all slots as available on error
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedDate || !selectedTimeSlot || !clinicianId || !clientId) {
      toast({
        title: "Missing information",
        description: "Please select a date and time",
        variant: "destructive"
      });
      return;
    }

    // Add validation to ensure the selected date meets the minimum days ahead requirement
    const today = DateTime.now().setZone(userTimeZone).startOf('day');
    const selectedDay = DateTime.fromJSDate(selectedDate).setZone(userTimeZone).startOf('day');
    const daysFromToday = selectedDay.diff(today, 'days').days;
    
    if (daysFromToday < minDaysAhead) {
      toast({
        title: "Invalid date selection",
        description: `Appointments must be booked at least ${minDaysAhead} day${minDaysAhead !== 1 ? 's' : ''} in advance.`,
        variant: "destructive"
      });
      return;
    }

    setBookingInProgress(true);
    
    try {
      console.log('[BookingDialog] Creating appointment with:', {
        clinicianId,
        clientId,
        startAt: selectedTimeSlot.utcStart,
        endAt: selectedTimeSlot.utcEnd,
      });
      
      // Use UTC timestamps for database storage
      const { data, error } = await supabase
        .from('appointments')
        .insert([
          {
            client_id: clientId,
            clinician_id: clinicianId,
            start_at: selectedTimeSlot.utcStart,
            end_at: selectedTimeSlot.utcEnd,
            type: "Therapy Session",
            notes: notes,
            status: 'scheduled'
          }
        ]);
        
      if (error) {
        console.error('[BookingDialog] Error booking appointment:', error);
        toast({
          title: "Error",
          description: "Failed to book appointment. Please try again.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "Your appointment has been booked successfully!",
        });
        
        setSelectedTimeSlot(null);
        setNotes("");
        onAppointmentBooked();
        onOpenChange(false);
      }
    } catch (error) {
      console.error('[BookingDialog] Error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setBookingInProgress(false);
    }
  };

  const isDayUnavailable = (date: Date) => {
    const selectedDay = DateTime.fromJSDate(date).setZone(userTimeZone);
    const dayOfWeek = selectedDay.weekday; // 1-7 (Monday to Sunday in Luxon)
    
    // If we have no availability blocks, we need to check against clinician weekly schedule
    if (availabilityBlocks.length === 0) {
      // This is a placeholder - we'll determine availability when user clicks on a date
      return false;
    }
    
    // Check if day is available in any block
    const hasAvailability = availabilityBlocks.some(block => {
      const blockStart = TimeZoneService.fromUTC(block.start_at, clinicianTimeZone);
      return blockStart.weekday === dayOfWeek;
    });
    
    return !hasAvailability;
  };

  const isPastDate = (date: Date) => {
    const today = DateTime.now().setZone(userTimeZone).startOf('day');
    const testDate = DateTime.fromJSDate(date).setZone(userTimeZone).startOf('day');
    return testDate < today;
  };

  const isDateTooSoon = (date: Date) => {
    const today = DateTime.now().setZone(userTimeZone).startOf('day');
    const testDate = DateTime.fromJSDate(date).setZone(userTimeZone).startOf('day');
    const daysFromToday = testDate.diff(today, 'days').days;
    return daysFromToday < minDaysAhead;
  };

  const disabledDays = (date: Date) => {
    const unavailable = isDayUnavailable(date);
    const pastDate = isPastDate(date);
    const tooSoon = isDateTooSoon(date);
    
    // Only log for debugging near-term dates
    const testDate = DateTime.fromJSDate(date).setZone(userTimeZone);
    const today = DateTime.now().setZone(userTimeZone).startOf('day');
    const daysFromToday = testDate.diff(today, 'days').days;
    
    if (daysFromToday >= 0 && daysFromToday < 10) {
      console.log('[BookingDialog] Date status check:', {
        date: testDate.toFormat('yyyy-MM-dd'),
        unavailable,
        pastDate,
        tooSoon,
        minDaysAhead,
        daysFromToday,
        disabled: (availabilityBlocks.length > 0 && unavailable) || pastDate || tooSoon
      });
    }
    
    // If we have no availability blocks, don't disable days based on availability
    if (availabilityBlocks.length === 0) {
      return pastDate || tooSoon;
    }
    
    return unavailable || pastDate || tooSoon;
  };

  // Simplified content for error states
  const renderErrorState = () => {
    if (Object.keys(apiErrors).length > 0) {
      return (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertDescription>
            <p>There were issues loading the booking system:</p>
            <ul className="mt-2 list-disc pl-5">
              {Object.entries(apiErrors).map(([key, value]) => (
                <li key={key}>{value}</li>
              ))}
            </ul>
            {apiErrors.auth ? (
              <div className="mt-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/login')}
                >
                  Go to Login
                </Button>
              </div>
            ) : (
              <p className="mt-2 text-sm">Please try again or contact support if the issue persists.</p>
            )}
          </AlertDescription>
        </Alert>
      );
    }
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book an Appointment</DialogTitle>
          <DialogDescription>
            {clinicianName 
              ? `Schedule a session with ${clinicianName}` 
              : 'Select a date and time that works for you'}
          </DialogDescription>
        </DialogHeader>

        {renderErrorState()}

        {loading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-valorwell-500" />
          </div>
        ) : availabilityBlocks.length === 0 && timeSlots.length === 0 ? (
          <div>
            <Tabs defaultValue="calendar">
              <TabsList className="mb-4">
                <TabsTrigger value="calendar">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Select Date
                </TabsTrigger>
                <TabsTrigger value="details" disabled={!selectedTimeSlot}>
                  <Clock className="h-4 w-4 mr-2" />
                  Appointment Details
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="calendar" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Select Date</h3>
                    <div className="text-xs text-gray-600 mb-1">
                      Minimum advance booking: {minDaysAhead} day{minDaysAhead !== 1 ? 's' : ''}
                    </div>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        console.log('[BookingDialog] Date selected:', date ? format(date, 'yyyy-MM-dd') : 'none');
                        setSelectedDate(date);
                        setSelectedTimeSlot(null); // Reset time slot selection when date changes
                      }}
                      disabled={disabledDays}
                      className="border rounded-md"
                    />
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-2">Available Time Slots</h3>
                    <div className="text-xs text-gray-600 mb-2">
                      All times shown in {TimeZoneService.getTimeZoneDisplayName(userTimeZone)}
                    </div>
                    {timeSlots.length > 0 ? (
                      <div className="space-y-2 max-h-[300px] overflow-y-auto p-2">
                        <RadioGroup 
                          value={selectedTimeSlot?.utcStart || ''} 
                          onValueChange={(value) => {
                            const slot = timeSlots.find(slot => slot.utcStart === value);
                            setSelectedTimeSlot(slot || null);
                          }}
                        >
                          <div className="grid grid-cols-2 gap-2">
                            {timeSlots.map(slot => (
                              <div key={slot.utcStart} className="flex items-center">
                                <RadioGroupItem
                                  value={slot.utcStart}
                                  id={`time-${slot.utcStart}`}
                                  disabled={!slot.available}
                                  className="focus:ring-valorwell-500"
                                />
                                <Label
                                  htmlFor={`time-${slot.utcStart}`}
                                  className={`ml-2 ${!slot.available ? 'line-through text-gray-400' : ''}`}
                                >
                                  {slot.localTime}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </RadioGroup>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-[300px] border rounded-md p-4 bg-gray-50">
                        <p className="text-gray-500 text-center">
                          {selectedDate 
                            ? 'No available time slots for this date. Please select another date.' 
                            : 'Please select a date to view available times'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                <DialogFooter>
                  <Button 
                    onClick={() => {
                      if (selectedTimeSlot) {
                        const tabsList = document.querySelector('[role="tablist"]');
                        if (tabsList) {
                          const detailsTab = tabsList.querySelector('[value="details"]');
                          if (detailsTab) {
                            (detailsTab as HTMLElement).click();
                          }
                        }
                      }
                    }}
                    disabled={!selectedTimeSlot}
                  >
                    Continue
                  </Button>
                </DialogFooter>
              </TabsContent>
              
              <TabsContent value="details" className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Notes (Optional)</h3>
                  <Textarea
                    placeholder="Add any notes or questions for your therapist"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>
                
                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="text-sm font-medium mb-3">Appointment Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Date:</span>
                      <span className="font-medium">
                        {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : ''}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Time:</span>
                      <span className="font-medium">
                        {selectedTimeSlot?.localTime || ''}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Type:</span>
                      <span className="font-medium">Therapy Session</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Provider:</span>
                      <span className="font-medium">{clinicianName || 'Your therapist'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Time Zone:</span>
                      <span className="font-medium">{TimeZoneService.getTimeZoneDisplayName(userTimeZone)}</span>
                    </div>
                  </div>
                </div>
                
                <DialogFooter className="flex justify-between items-center pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      const tabsList = document.querySelector('[role="tablist"]');
                      if (tabsList) {
                        const calendarTab = tabsList.querySelector('[value="calendar"]');
                        if (calendarTab) {
                          (calendarTab as HTMLElement).click();
                        }
                      }
                    }}
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={handleBookAppointment}
                    disabled={bookingInProgress}
                  >
                    {bookingInProgress ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Booking...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Confirm Booking
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <Tabs defaultValue="calendar">
            <TabsList className="mb-4">
              <TabsTrigger value="calendar">
                <CalendarIcon className="h-4 w-4 mr-2" />
                Select Date
              </TabsTrigger>
              <TabsTrigger value="details" disabled={!selectedTimeSlot}>
                <Clock className="h-4 w-4 mr-2" />
                Appointment Details
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="calendar" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium mb-2">Select Date</h3>
                  <div className="text-xs text-gray-600 mb-1">
                    Minimum advance booking: {minDaysAhead} day{minDaysAhead !== 1 ? 's' : ''}
                  </div>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      console.log('[BookingDialog] Date selected:', date ? format(date, 'yyyy-MM-dd') : 'none');
                      setSelectedDate(date);
                      setSelectedTimeSlot(null); // Reset time slot selection when date changes
                    }}
                    disabled={disabledDays}
                    className="border rounded-md"
                  />
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2">Available Time Slots</h3>
                  <div className="text-xs text-gray-600 mb-2">
                    All times shown in {TimeZoneService.getTimeZoneDisplayName(userTimeZone)}
                  </div>
                  {timeSlots.length > 0 ? (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto p-2">
                      <RadioGroup 
                        value={selectedTimeSlot?.utcStart || ''} 
                        onValueChange={(value) => {
                          const slot = timeSlots.find(slot => slot.utcStart === value);
                          setSelectedTimeSlot(slot || null);
                        }}
                      >
                        <div className="grid grid-cols-2 gap-2">
                          {timeSlots.map(slot => (
                            <div key={slot.utcStart} className="flex items-center">
                              <RadioGroupItem
                                value={slot.utcStart}
                                id={`time-${slot.utcStart}`}
                                disabled={!slot.available}
                                className="focus:ring-valorwell-500"
                              />
                              <Label
                                htmlFor={`time-${slot.utcStart}`}
                                className={`ml-2 ${!slot.available ? 'line-through text-gray-400' : ''}`}
                              >
                                {slot.localTime}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </RadioGroup>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[300px] border rounded-md p-4 bg-gray-50">
                      <p className="text-gray-500">
                        {selectedDate 
                          ? 'No available time slots for this date' 
                          : 'Please select a date to view available times'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  onClick={() => {
                    if (selectedTimeSlot) {
                      const tabsList = document.querySelector('[role="tablist"]');
                      if (tabsList) {
                        const detailsTab = tabsList.querySelector('[value="details"]');
                        if (detailsTab) {
                          (detailsTab as HTMLElement).click();
                        }
                      }
                    }
                  }}
                  disabled={!selectedTimeSlot}
                >
                  Continue
                </Button>
              </DialogFooter>
            </TabsContent>
            
            <TabsContent value="details" className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Notes (Optional)</h3>
                <Textarea
                  placeholder="Add any notes or questions for your therapist"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="text-sm font-medium mb-3">Appointment Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Date:</span>
                    <span className="font-medium">
                      {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : ''}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Time:</span>
                    <span className="font-medium">
                      {selectedTimeSlot?.localTime || ''}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Type:</span>
                    <span className="font-medium">Therapy Session</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Provider:</span>
                    <span className="font-medium">{clinicianName || 'Your therapist'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Time Zone:</span>
                    <span className="font-medium">{TimeZoneService.getTimeZoneDisplayName(userTimeZone)}</span>
                  </div>
                </div>
              </div>
              
              <DialogFooter className="flex justify-between items-center pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    const tabsList = document.querySelector('[role="tablist"]');
                    if (tabsList) {
                      const calendarTab = tabsList.querySelector('[value="calendar"]');
                      if (calendarTab) {
                        (calendarTab as HTMLElement).click();
                      }
                    }
                  }}
                >
                  Back
                </Button>
                <Button 
                  onClick={handleBookAppointment}
                  disabled={bookingInProgress}
                >
                  {bookingInProgress ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Booking...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Confirm Booking
                    </>
                  )}
                </Button>
              </DialogFooter>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentBookingDialog;
