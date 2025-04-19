
import React, { useState, useEffect } from 'react';
import { addDays, format, startOfWeek, endOfWeek, isToday, parseISO } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useTimeZone } from '@/context/TimeZoneContext';
import { supabase } from '@/integrations/supabase/client';
import { fromUTCTimestamp, ensureIANATimeZone } from '@/utils/timeZoneUtils';
import WeekHeader from './WeekHeader';
import WeekBody from './WeekBody';
import { TimeBlock, AvailabilityBlock } from './types';
import { Appointment } from '@/types/appointment';

interface WeekViewProps {
  currentDate: Date;
  clinicianId: string | null;
  refreshTrigger?: number;
  appointments?: Appointment[];
  getClientName?: (clientId: string) => string;
  onAppointmentClick?: (appointment: Appointment) => void;
  onAvailabilityClick?: (day: Date, block: TimeBlock) => void;
  userTimeZone?: string;
}

const WeekView: React.FC<WeekViewProps> = ({
  currentDate,
  clinicianId,
  refreshTrigger = 0,
  appointments = [],
  getClientName = (id) => 'Client',
  onAppointmentClick,
  onAvailabilityClick,
  userTimeZone
}) => {
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState<Date[]>([]);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [processedAppointments, setProcessedAppointments] = useState<any[]>([]);
  const [clinicianTimeZone, setClinicianTimeZone] = useState<string | null>(null);
  const { userTimeZone: contextTimeZone } = useTimeZone();
  
  // Use provided userTimeZone, fall back to context time zone
  const effectiveTimeZone = ensureIANATimeZone(userTimeZone || contextTimeZone);
  
  // Set up the week days
  useEffect(() => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
    const weekDays: Date[] = [];
    
    for (let i = 0; i < 7; i++) {
      weekDays.push(addDays(weekStart, i));
    }
    
    setDays(weekDays);
    
    console.log('[WeekView] Week days initialized:', {
      startDate: weekDays[0].toISOString(),
      endDate: weekDays[6].toISOString(),
      timeZone: effectiveTimeZone
    });
  }, [currentDate]);

  // Fetch clinician's time zone
  useEffect(() => {
    const fetchClinicianTimeZone = async () => {
      if (!clinicianId) {
        return;
      }

      try {
        const { data, error } = await supabase
          .from('clinicians')
          .select('clinician_timezone')
          .eq('id', clinicianId)
          .single();
          
        if (error) {
          console.error('[WeekView] Error fetching clinician time zone:', error);
          return;
        }

        if (data?.clinician_timezone) {
          setClinicianTimeZone(ensureIANATimeZone(data.clinician_timezone));
        } else {
          // Check profiles table as fallback
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('time_zone')
            .eq('id', clinicianId)
            .single();
            
          if (!profileError && profileData?.time_zone) {
            setClinicianTimeZone(ensureIANATimeZone(profileData.time_zone));
          } else {
            setClinicianTimeZone(ensureIANATimeZone('America/Chicago')); // Default
          }
        }
      } catch (error) {
        console.error('[WeekView] Exception fetching clinician time zone:', error);
        setClinicianTimeZone(ensureIANATimeZone('America/Chicago')); // Default on error
      }
    };
    
    fetchClinicianTimeZone();
  }, [clinicianId]);

  // Fetch availability data
  useEffect(() => {
    const fetchAvailabilityData = async () => {
      if (!clinicianId || !days.length || !clinicianTimeZone) {
        return;
      }

      setLoading(true);
      
      try {
        // Fetch clinician data which includes availability in columns
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
          .eq('id', clinicianId)
          .single();

        if (clinicianError) {
          console.error('[WeekView] Error fetching clinician data:', clinicianError);
          setLoading(false);
          return;
        }

        // Convert availability data to time blocks in the user's time zone
        const availabilityBlocks: TimeBlock[] = [];

        // For each day of the week
        for (const day of days) {
          const dayOfWeek = format(day, 'EEEE').toLowerCase();
          
          // For each availability slot (1-3) for this day
          for (let slot = 1; slot <= 3; slot++) {
            const startKey = `clinician_${dayOfWeek}start${slot}`;
            const endKey = `clinician_${dayOfWeek}end${slot}`;
            
            // If this slot has availability
            if (clinicianData[startKey] && clinicianData[endKey]) {
              try {
                // Create Date objects for start and end times
                const startDate = new Date(day);
                const endDate = new Date(day);
                
                // Parse the time strings
                const [startHour, startMinute] = clinicianData[startKey].split(':').map(Number);
                const [endHour, endMinute] = clinicianData[endKey].split(':').map(Number);
                
                // Set the hours and minutes
                startDate.setHours(startHour, startMinute, 0, 0);
                endDate.setHours(endHour, endMinute, 0, 0);
                
                // Add the time block
                availabilityBlocks.push({
                  id: `${clinicianId}-${dayOfWeek}-${slot}`,
                  day,
                  start: startDate,
                  end: endDate,
                  availabilityIds: [`${clinicianId}-${dayOfWeek}-${slot}`],
                  type: 'block'
                });
              } catch (error) {
                console.error('[WeekView] Error processing availability time:', error, {
                  start: clinicianData[startKey],
                  end: clinicianData[endKey]
                });
              }
            }
          }
        }

        console.log(`[WeekView] Generated ${availabilityBlocks.length} availability blocks for clinician ${clinicianId}`);
        setTimeBlocks(availabilityBlocks);
      } catch (error) {
        console.error('[WeekView] Error processing availability data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailabilityData();
  }, [clinicianId, days, refreshTrigger, clinicianTimeZone, effectiveTimeZone]);

  // Process appointments
  useEffect(() => {
    if (!appointments.length || !days.length) {
      setProcessedAppointments([]);
      return;
    }
    
    console.log(`[WeekView] Processing ${appointments.length} appointments with timezone: ${effectiveTimeZone}`);
    
    try {
      const processed = appointments
        .filter(appointment => {
          // Only include appointments for days in this week
          const appointmentDate = parseISO(appointment.display_date || appointment.date);
          return days.some(day => format(day, 'yyyy-MM-dd') === format(appointmentDate, 'yyyy-MM-dd'));
        })
        .map(appointment => {
          const dateToUse = appointment.display_date || appointment.date;
          const startTimeToUse = appointment.display_start_time || appointment.start_time;
          const endTimeToUse = appointment.display_end_time || appointment.end_time;
          
          const day = parseISO(dateToUse);
          
          // Create Date objects for start and end times
          const start = new Date(day);
          const end = new Date(day);
          
          // Parse the time strings (handle both HH:MM and HH:MM:SS formats)
          const [startHour, startMinute] = startTimeToUse.split(':').map(Number);
          const [endHour, endMinute] = endTimeToUse.split(':').map(Number);
          
          // Set the hours and minutes
          start.setHours(startHour, startMinute, 0, 0);
          end.setHours(endHour, endMinute, 0, 0);
          
          return {
            id: appointment.id,
            clientName: getClientName(appointment.client_id),
            clientId: appointment.client_id,
            day,
            start,
            end,
            status: appointment.status,
            originalAppointment: appointment
          };
        });
        
      console.log(`[WeekView] Processed ${processed.length} appointments for display`);
      setProcessedAppointments(processed);
    } catch (error) {
      console.error('[WeekView] Error processing appointments:', error);
      setProcessedAppointments([]);
    }
  }, [appointments, days, effectiveTimeZone, getClientName]);

  if (loading) {
    return (
      <Card className="p-4 flex justify-center items-center h-[300px]">
        <Loader2 className="h-6 w-6 animate-spin text-valorwell-500" />
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="rounded-lg">
        <WeekHeader days={days} />
        <WeekBody 
          days={days}
          timeBlocks={timeBlocks}
          appointments={processedAppointments}
          onAppointmentClick={(appointment) => {
            if (onAppointmentClick && appointment.originalAppointment) {
              onAppointmentClick(appointment.originalAppointment);
            }
          }}
          onTimeBlockClick={(day, block) => {
            if (onAvailabilityClick) {
              onAvailabilityClick(day, block);
            }
          }}
        />
      </div>
    </Card>
  );
};

export default WeekView;
