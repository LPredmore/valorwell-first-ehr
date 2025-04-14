import { useState, useEffect, useMemo } from 'react';
import {
  format,
  startOfDay,
  isSameDay,
  setHours,
  setMinutes,
  parseISO,
} from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useTimeZone } from '@/context/TimeZoneContext';
import { fromUTCTimestamp } from '@/utils/timeZoneUtils';

interface Appointment {
  id: string;
  client_id: string;
  date: string;
  start_time: string;
  end_time: string;
  type: string;
  status: string;
  appointment_datetime?: string;  // UTC timestamp
  appointment_end_datetime?: string; // UTC end timestamp
}

interface AvailabilityBlock {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  clinician_id?: string;
  is_active?: boolean;
  isException?: boolean;
  isStandalone?: boolean;
  originalAvailabilityId?: string | null;
}

interface AvailabilityException {
  id: string;
  specific_date: string;
  original_availability_id: string | null;
  start_time: string | null;
  end_time: string | null;
  is_deleted: boolean;
  clinician_id: string;
}

interface TimeBlock {
  day: Date;
  start: Date;
  end: Date;
  availabilityIds: string[];
  isException?: boolean;
  isStandalone?: boolean;
  id: string;
  originalAvailabilityId?: string | null;
}

interface AppointmentBlock {
  id: string;
  day: Date;
  start: Date;
  end: Date;
  clientId: string;
  type: string;
  clientName?: string;
}

interface ClinicianSchedule {
  [day: string]: { start_time: string; end_time: string }[];
}

interface SingleDayAvail {
  id: string;
  availability_date: string;
  start_time: string;
  end_time: string;
  clinician_id: string;
}

interface TimeBlockRecord {
  id: string;
  block_date: string;
  start_time: string;
  end_time: string;
  reason?: string;
  clinician_id: string;
}

const normalizeDayOfWeek = (day: string): string => {
  const dayMap: { [key: string]: string } = {
    '0': 'Sunday',
    '1': 'Monday',
    '2': 'Tuesday',
    '3': 'Wednesday',
    '4': 'Thursday',
    '5': 'Friday',
    '6': 'Saturday'
  };
  return dayMap[day] || day;
};

const getDayOfWeekString = (date: Date): string => {
  return format(date, 'EEEE');
};

const convertUTCToLocal = (dateStr: string, timeStr: string, timezone: string): Date => {
  try {
    console.log(`[convertUTCToLocal] Converting ${dateStr} ${timeStr} to ${timezone}`);
    
    const utcString = `${dateStr}T${timeStr}:00Z`;
    console.log(`[convertUTCToLocal] UTC string: ${utcString}`);
    
    const localDate = fromUTCTimestamp(utcString, timezone);
    console.log(`[convertUTCToLocal] Converted to local: ${format(localDate, 'yyyy-MM-dd HH:mm:ss')}`);
    
    return localDate;
  } catch (error) {
    console.error('[convertUTCToLocal] Error converting UTC to local time:', error, {dateStr, timeStr, timezone});
    const [hours, minutes] = timeStr.split(':').map(Number);
    const dateObj = parseISO(dateStr);
    return setMinutes(setHours(startOfDay(dateObj), hours), minutes);
  }
};

export const useWeekViewData = (
  days: Date[],
  clinicianId: string | null,
  refreshTrigger: number = 0,
  appointments: Appointment[] = [],
  getClientName: (clientId: string) => string = () => 'Client',
  userTimeZone?: string
) => {
  const [loading, setLoading] = useState(true);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [appointmentBlocks, setAppointmentBlocks] = useState<AppointmentBlock[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [clinicianWeeklySchedule, setClinicianWeeklySchedule] = useState<ClinicianSchedule>({});
  const [singleDayAvailability, setSingleDayAvailability] = useState<SingleDayAvail[]>([]);
  const [blockedTimeRecords, setBlockedTimeRecords] = useState<TimeBlockRecord[]>([]);
  const { userTimeZone: contextTimeZone } = useTimeZone();
  
  const effectiveTimeZone = userTimeZone || contextTimeZone;

  useEffect(() => {
    setError(null);
    
    if (!appointments.length) {
      setAppointmentBlocks([]);
      console.log("[useWeekViewData] No appointments to process in week view");
      return;
    }

    try {
      console.log(`[useWeekViewData] Processing ${appointments.length} appointments in week view with timezone: ${effectiveTimeZone}`);
      console.log("[useWeekViewData] Raw appointments data:", appointments);
      
      const blocks: AppointmentBlock[] = appointments
        .filter(appointment => {
          if (!appointment || !appointment.date || !appointment.start_time || !appointment.end_time) {
            console.warn('[useWeekViewData] Skipping invalid appointment:', appointment);
            return false;
          }
          return true;
        })
        .map(appointment => {
          try {
            console.log(`[useWeekViewData] Processing appointment: ${appointment.id}`, {
              date: appointment.date,
              start_time: appointment.start_time,
              end_time: appointment.end_time,
              appointment_datetime: appointment.appointment_datetime,
              appointment_end_datetime: appointment.appointment_end_datetime
            });
            
            let dateObj = parseISO(appointment.date);
            let start: Date;
            let end: Date;
            
            if (appointment.appointment_datetime) {
              console.log(`[useWeekViewData] Using UTC timestamp for appointment ${appointment.id}`);
              start = fromUTCTimestamp(appointment.appointment_datetime, effectiveTimeZone);
              dateObj = startOfDay(start);
              
              if (appointment.appointment_end_datetime) {
                end = fromUTCTimestamp(appointment.appointment_end_datetime, effectiveTimeZone);
              } else {
                end = convertUTCToLocal(appointment.date, appointment.end_time, effectiveTimeZone);
              }
            } else {
              console.log(`[useWeekViewData] Using legacy time fields for appointment ${appointment.id}`);
              start = convertUTCToLocal(appointment.date, appointment.start_time, effectiveTimeZone);
              end = convertUTCToLocal(appointment.date, appointment.end_time, effectiveTimeZone);
            }

            const clientName = getClientName(appointment.client_id);
            
            const result = {
              id: appointment.id,
              day: dateObj,
              start,
              end,
              clientId: appointment.client_id,
              type: appointment.type,
              clientName
            };
            
            console.log(`[useWeekViewData] Processed appointment ${appointment.id}:`, {
              date: format(dateObj, 'yyyy-MM-dd'),
              startTime: format(start, 'HH:mm'),
              endTime: format(end, 'HH:mm'),
              rawStart: appointment.start_time,
              rawEnd: appointment.end_time,
              clientName
            });
            
            return result;
          } catch (error) {
            console.error(`[useWeekViewData] Error processing appointment ${appointment.id}:`, error);
            throw error;
          }
        })
        .filter(block => block !== undefined) as AppointmentBlock[];

      console.log("[useWeekViewData] Week view appointment blocks created:", blocks);
      setAppointmentBlocks(blocks);
    } catch (error) {
      console.error("[useWeekViewData] Error processing appointments in week view:", error);
      setAppointmentBlocks([]);
      setError("Failed to process appointments. Please try refreshing the page.");
    }
  }, [appointments, getClientName, effectiveTimeZone]);

  useEffect(() => {
    const fetchClinicianWeeklySchedule = async () => {
      setLoading(true);
      setError(null);
      
      try {
        if (!clinicianId) {
          console.log("[WeekView] No clinicianId provided, skipping availability fetch");
          setClinicianWeeklySchedule({});
          setLoading(false);
          return;
        }
        
        console.log(`[WeekView] Fetching clinician weekly schedule for: ${clinicianId}`);
        
        const { data: authData } = await supabase.auth.getUser();
        console.log(`[WeekView] Current user: ${authData?.user?.id || 'No user'}`);
        
        const { data: clinicianData, error } = await supabase
          .from('clinicians')
          .select(`
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
          .eq('id', clinicianId)
          .single();

        if (error) {
          console.error('[WeekView] Error fetching clinician data:', error);
          setError(`Error fetching clinician data: ${error.message}`);
          setClinicianWeeklySchedule({});
        } else if (clinicianData) {
          console.log('[WeekView] Retrieved clinician weekly schedule:', clinicianData);
          
          const schedule: ClinicianSchedule = {
            monday: [],
            tuesday: [],
            wednesday: [],
            thursday: [],
            friday: [],
            saturday: [],
            sunday: []
          };
          
          const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
          days.forEach(day => {
            for (let i = 1; i <= 3; i++) {
              const startKey = `clinician_${day}start${i}`;
              const endKey = `clinician_${day}end${i}`;
              
              if (clinicianData[startKey] && clinicianData[endKey]) {
                schedule[day].push({
                  start_time: clinicianData[startKey],
                  end_time: clinicianData[endKey]
                });
              }
            }
          });
          
          console.log('[WeekView] Processed weekly schedule:', schedule);
          setClinicianWeeklySchedule(schedule);
          
          fetchSingleDayAvailability(clinicianId);
          fetchTimeBlocks(clinicianId);
        }
      } catch (error) {
        console.error('[WeekView] Exception in availability fetching:', error);
        setError(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
        setClinicianWeeklySchedule({});
      } finally {
        setLoading(false);
      }
    };

    fetchClinicianWeeklySchedule();
  }, [clinicianId, refreshTrigger, days]);

  const fetchSingleDayAvailability = async (clinicianId: string) => {
    try {
      const startDateStr = format(days[0], 'yyyy-MM-dd');
      const endDateStr = format(days[days.length - 1], 'yyyy-MM-dd');
      
      console.log(`[WeekView] Fetching single day availability for date range: ${startDateStr} to ${endDateStr}`);
      
      const { data: singleDayData, error: singleDayError } = await supabase
        .from('single_day_availability')
        .select('*')
        .eq('clinician_id', clinicianId)
        .gte('availability_date', startDateStr)
        .lte('availability_date', endDateStr);
        
      if (singleDayError) {
        console.error('[WeekView] Error fetching single day availability:', singleDayError);
        
        const { data: altSingleDayData, error: altError } = await supabase
          .from('availability_single_date')
          .select('*')
          .eq('clinician_id', clinicianId)
          .gte('date', startDateStr)
          .lte('date', endDateStr);
          
        if (altError) {
          console.error('[WeekView] Error fetching from alternate single day table:', altError);
          setSingleDayAvailability([]);
        } else {
          const mappedData = altSingleDayData.map(record => ({
            id: record.id,
            availability_date: record.date,
            start_time: record.start_time,
            end_time: record.end_time,
            clinician_id: record.clinician_id
          }));
          
          console.log(`[WeekView] Retrieved ${mappedData.length} alternate single day records:`, mappedData);
          setSingleDayAvailability(mappedData);
        }
      } else {
        console.log(`[WeekView] Retrieved ${singleDayData?.length || 0} single day availability records:`, singleDayData);
        setSingleDayAvailability(singleDayData || []);
      }
      
      processAvailabilityData();
    } catch (error) {
      console.error('[WeekView] Error in single day availability fetch:', error);
      setSingleDayAvailability([]);
    }
  };

  const fetchTimeBlocks = async (clinicianId: string) => {
    try {
      const startDateStr = format(days[0], 'yyyy-MM-dd');
      const endDateStr = format(days[days.length - 1], 'yyyy-MM-dd');
      
      console.log(`[WeekView] Fetching time blocks for date range: ${startDateStr} to ${endDateStr}`);
      
      const { data: blocksData, error: blocksError } = await supabase
        .from('time_blocks')
        .select('*')
        .eq('clinician_id', clinicianId)
        .gte('block_date', startDateStr)
        .lte('block_date', endDateStr);
        
      if (blocksError) {
        console.error('[WeekView] Error fetching time blocks:', blocksError);
        setBlockedTimeRecords([]);
      } else {
        console.log(`[WeekView] Retrieved ${blocksData?.length || 0} time blocks`);
        setBlockedTimeRecords(blocksData || []);
      }
      
      processAvailabilityData();
    } catch (error) {
      console.error('[WeekView] Error in time blocks fetch:', error);
      setBlockedTimeRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const processAvailabilityData = () => {
    if (!Object.keys(clinicianWeeklySchedule).length) {
      return;
    }

    const allTimeBlocks: TimeBlock[] = [];

    days.forEach(day => {
      const dayOfWeek = format(day, 'EEEE').toLowerCase();
      const dateStr = format(day, 'yyyy-MM-dd');
      
      const singleDayRecord = singleDayAvailability.find(item => {
        return format(new Date(item.availability_date), 'yyyy-MM-dd') === dateStr;
      });
      
      if (singleDayRecord) {
        console.log(`[WeekView] Found single day availability for ${dateStr}:`, singleDayRecord);
        
        const [startHour, startMinute] = singleDayRecord.start_time.split(':').map(Number);
        const [endHour, endMinute] = singleDayRecord.end_time.split(':').map(Number);
        
        const start = setMinutes(setHours(startOfDay(day), startHour), startMinute);
        const end = setMinutes(setHours(startOfDay(day), endHour), endMinute);
        
        allTimeBlocks.push({
          id: singleDayRecord.id,
          day,
          start,
          end,
          availabilityIds: [singleDayRecord.id],
          isException: true,
          isStandalone: true,
          originalAvailabilityId: null
        });
      } else {
        const daySchedule = clinicianWeeklySchedule[dayOfWeek] || [];
        
        if (daySchedule.length > 0) {
          console.log(`[WeekView] Using weekly schedule for ${dateStr}:`, daySchedule);
          
          daySchedule.forEach(slot => {
            const [startHour, startMinute] = slot.start_time.split(':').map(Number);
            const [endHour, endMinute] = slot.end_time.split(':').map(Number);
            
            const start = setMinutes(setHours(startOfDay(day), startHour), startMinute);
            const end = setMinutes(setHours(startOfDay(day), endHour), endMinute);
            
            const blockId = `${dayOfWeek}-${slot.start_time}-${slot.end_time}`;
            
            allTimeBlocks.push({
              id: blockId,
              day,
              start,
              end,
              availabilityIds: [blockId],
              isException: false,
              isStandalone: false,
              originalAvailabilityId: null
            });
          });
        }
      }
    });
    
    allTimeBlocks.sort((a, b) => a.start.getTime() - b.start.getTime());
    
    const finalBlocks = allTimeBlocks.flatMap(block => {
      const dateStr = format(block.day, 'yyyy-MM-dd');
      const overlappingBlocks = blockedTimeRecords.filter(tb => 
        tb.block_date === dateStr && 
        hasTimeOverlap(
          block.start, block.end,
          parseTimeToDate(tb.start_time, block.day),
          parseTimeToDate(tb.end_time, block.day)
        )
      );
      
      if (overlappingBlocks.length === 0) {
        return [block];
      }
      
      const resultBlocks: TimeBlock[] = [];
      let currentStart = block.start;
      
      overlappingBlocks.sort((a, b) => 
        parseTimeToDate(a.start_time, block.day).getTime() - 
        parseTimeToDate(b.start_time, block.day).getTime()
      );
      
      for (const timeBlock of overlappingBlocks) {
        const blockStart = parseTimeToDate(timeBlock.start_time, block.day);
        const blockEnd = parseTimeToDate(timeBlock.end_time, block.day);
        
        if (blockStart > currentStart) {
          resultBlocks.push({
            ...block,
            id: `${block.id}-split-${resultBlocks.length}`,
            start: currentStart,
            end: blockStart
          });
        }
        
        currentStart = new Date(Math.max(currentStart.getTime(), blockEnd.getTime()));
      }
      
      if (currentStart < block.end) {
        resultBlocks.push({
          ...block,
          id: `${block.id}-split-${resultBlocks.length}`,
          start: currentStart,
          end: block.end
        });
      }
      
      return resultBlocks;
    });
    
    console.log(`[WeekView] Final availability blocks: ${finalBlocks.length}`, 
      finalBlocks.map(b => ({
        day: format(b.day, 'yyyy-MM-dd'),
        time: `${format(b.start, 'HH:mm')}-${format(b.end, 'HH:mm')}`,
        isException: b.isException,
        isStandalone: b.isStandalone
      }))
    );
    
    setTimeBlocks(finalBlocks);
  };

  const parseTimeToDate = (timeStr: string, baseDate: Date): Date => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return setMinutes(setHours(startOfDay(baseDate), hours), minutes);
  };

  const hasTimeOverlap = (start1: Date, end1: Date, start2: Date, end2: Date): boolean => {
    return start1 < end2 && start2 < end1;
  };

  const timeSlotUtils = useMemo(() => {
    const isTimeSlotAvailable = (day: Date, timeSlot: Date) => {
      const slotTime = setMinutes(
        setHours(startOfDay(day), timeSlot.getHours()),
        timeSlot.getMinutes()
      );
  
      return timeBlocks.some(block =>
        isSameDay(block.day, day) &&
        slotTime >= block.start &&
        slotTime < block.end
      );
    };
  
    const getBlockForTimeSlot = (day: Date, timeSlot: Date) => {
      const slotTime = setMinutes(
        setHours(startOfDay(day), timeSlot.getHours()),
        timeSlot.getMinutes()
      );
  
      return timeBlocks.find(block =>
        isSameDay(block.day, day) &&
        slotTime >= block.start &&
        slotTime < block.end
      );
    };
  
    const getAppointmentForTimeSlot = (day: Date, timeSlot: Date) => {
      console.log(`Checking appointments for ${format(day, 'yyyy-MM-dd')} at ${format(timeSlot, 'HH:mm')}`);
      
      const slotHours = timeSlot.getHours();
      const slotMinutes = timeSlot.getMinutes();
      
      const appointment = appointmentBlocks.find(block => {
        const sameDayCheck = isSameDay(block.day, day);
        if (!sameDayCheck) return false;
        
        const apptStartHours = block.start.getHours();
        const apptStartMinutes = block.start.getMinutes();
        const apptEndHours = block.end.getHours();
        const apptEndMinutes = block.end.getMinutes();
        
        const slotTotalMinutes = slotHours * 60 + slotMinutes;
        const apptStartTotalMinutes = apptStartHours * 60 + apptStartMinutes;
        const apptEndTotalMinutes = apptEndHours * 60 + apptEndMinutes;
        
        const isWithinAppointment = 
          slotTotalMinutes >= apptStartTotalMinutes && 
          slotTotalMinutes < apptEndTotalMinutes;
          
        if (isWithinAppointment) {
          console.log(`Found appointment ${block.id} for ${format(day, 'yyyy-MM-dd')} at ${format(timeSlot, 'HH:mm')}:`, {
            appointmentDay: format(block.day, 'yyyy-MM-dd'),
            appointmentTime: `${format(block.start, 'HH:mm')} - ${format(block.end, 'HH:mm')}`,
            slotTime: format(timeSlot, 'HH:mm')
          });
        }
        
        return isWithinAppointment;
      });
      
      return appointment;
    };

    return {
      isTimeSlotAvailable,
      getBlockForTimeSlot,
      getAppointmentForTimeSlot
    };
  }, [timeBlocks, appointmentBlocks]);

  useEffect(() => {
    if (clinicianWeeklySchedule && singleDayAvailability && blockedTimeRecords) {
      processAvailabilityData();
    }
  }, [clinicianWeeklySchedule, singleDayAvailability, blockedTimeRecords]);

  return {
    loading,
    error,
    timeBlocks,
    appointmentBlocks,
    ...timeSlotUtils
  };
};

export type { Appointment, AvailabilityBlock, AvailabilityException, TimeBlock, AppointmentBlock };
