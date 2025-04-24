import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AvailabilitySettings, AvailabilitySlot, WeeklyAvailability } from '@/types/appointment';
import { ensureIANATimeZone } from '@/utils/timeZoneUtils';
import { DateTime } from 'luxon';
import { createEmptyWeeklyAvailability } from '@/utils/availabilityUtils';

export class AvailabilityService {
  static async getSettings(clinicianId: string): Promise<AvailabilitySettings | null> {
    const { data, error } = await supabase
      .from('availability_settings')
      .select('*')
      .eq('clinician_id', clinicianId)
      .single();

    if (error) {
      console.error('Error fetching availability settings:', error);
      return null;
    }

    return data ? {
      id: data.id,
      clinicianId: data.clinician_id,
      defaultSlotDuration: data.default_slot_duration,
      minNoticeDays: data.min_notice_days,
      maxAdvanceDays: data.max_advance_days,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    } : null;
  }

  static async updateSettings(
    clinicianId: string, 
    settings: Partial<AvailabilitySettings>
  ): Promise<AvailabilitySettings | null> {
    const { data, error } = await supabase
      .from('availability_settings')
      .upsert({
        clinician_id: clinicianId,
        default_slot_duration: settings.defaultSlotDuration,
        min_notice_days: settings.minNoticeDays,
        max_advance_days: settings.maxAdvanceDays
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating availability settings:', error);
      return null;
    }

    return data ? {
      id: data.id,
      clinicianId: data.clinician_id,
      defaultSlotDuration: data.default_slot_duration,
      minNoticeDays: data.min_notice_days,
      maxAdvanceDays: data.max_advance_days,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    } : null;
  }

  static async getAvailabilitySlots(
    clinicianId: string,
    startDate: string,
    endDate: string
  ): Promise<AvailabilitySlot[]> {
    const { data: events, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('clinician_id', clinicianId)
      .eq('event_type', 'availability')
      .gte('start_time', startDate)
      .lte('end_time', endDate)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching availability slots:', error);
      return [];
    }

    return events.map(event => ({
      startTime: event.start_time,
      endTime: event.end_time,
      dayOfWeek: DateTime.fromISO(event.start_time).toFormat('EEEE').toLowerCase(),
      isRecurring: !!event.recurrence_id
    }));
  }

  static async createAvailabilitySlot(
    clinicianId: string,
    slot: {
      startTime: string;
      endTime: string;
      title?: string;
      recurring?: boolean;
      recurrenceRule?: string;
    }
  ): Promise<string | null> {
    try {
      console.log('[AvailabilityService] Creating availability slot with:', {
        clinicianId,
        startTime: slot.startTime,
        endTime: slot.endTime,
        recurring: slot.recurring,
        recurrenceRule: slot.recurrenceRule
      });

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('time_zone')
        .eq('id', clinicianId)
        .maybeSingle();
      
      if (profileError) {
        console.error('[AvailabilityService] Error fetching clinician timezone:', profileError);
      }
      
      const clinicianTimeZone = profileData?.time_zone || 'UTC';
      console.log('[AvailabilityService] Using clinician timezone:', clinicianTimeZone);
      
      const startDateTime = DateTime.fromISO(slot.startTime, { zone: clinicianTimeZone });
      const endDateTime = DateTime.fromISO(slot.endTime, { zone: clinicianTimeZone });
      
      if (!startDateTime.isValid || !endDateTime.isValid) {
        console.error('[AvailabilityService] Invalid date/time formats:', { 
          startTime: slot.startTime, 
          endTime: slot.endTime,
          startValid: startDateTime.isValid,
          startInvalidReason: startDateTime.invalidReason,
          endValid: endDateTime.isValid,
          endInvalidReason: endDateTime.invalidReason
        });
        return null;
      }
      
      if (endDateTime <= startDateTime) {
        console.error('[AvailabilityService] End time must be after start time:', {
          start: startDateTime.toISO(),
          end: endDateTime.toISO()
        });
        return null;
      }
      
      console.log('[AvailabilityService] Parsed start time:', startDateTime.toISO());
      console.log('[AvailabilityService] Parsed end time:', endDateTime.toISO());

      const { data: eventData, error: eventError } = await supabase
        .from('calendar_events')
        .insert({
          clinician_id: clinicianId,
          event_type: 'availability',
          title: slot.title || 'Available',
          start_time: startDateTime.toUTC().toISO(),
          end_time: endDateTime.toUTC().toISO(),
          all_day: false,
          is_active: true
        })
        .select('id')
        .single();

      if (eventError || !eventData?.id) {
        console.error('[AvailabilityService] Error creating availability slot:', eventError);
        return null;
      }

      if (slot.recurring && slot.recurrenceRule && eventData?.id) {
        const { error: recurrenceError } = await supabase
          .from('recurrence_rules')
          .insert({
            event_id: eventData.id,
            rrule: slot.recurrenceRule
          });

        if (recurrenceError) {
          console.error('[AvailabilityService] Error creating recurrence rule:', recurrenceError);
          await supabase
            .from('calendar_events')
            .delete()
            .eq('id', eventData.id);
          return null;
        }
        
        const { error: updateError } = await supabase
          .from('calendar_events')
          .update({ recurrence_id: eventData.id })
          .eq('id', eventData.id);
          
        if (updateError) {
          console.error('[AvailabilityService] Error updating event with recurrence ID:', updateError);
        }
      }

      return eventData.id;
    } catch (error) {
      console.error('[AvailabilityService] Error in createAvailabilitySlot:', error);
      return null;
    }
  }

  static async updateAvailabilitySlot(
    slotId: string,
    updates: {
      startTime?: string;
      endTime?: string;
      title?: string;
    },
    updateRecurrence: boolean = false
  ): Promise<boolean> {
    try {
      const { data: slotData, error: slotError } = await supabase
        .from('calendar_events')
        .select('clinician_id')
        .eq('id', slotId)
        .single();
        
      if (slotError || !slotData?.clinician_id) {
        console.error('[AvailabilityService] Error fetching slot data:', slotError);
        return false;
      }
      
      const { data: profileData } = await supabase
        .from('profiles')
        .select('time_zone')
        .eq('id', slotData.clinician_id)
        .maybeSingle();
        
      const clinicianTimeZone = profileData?.time_zone || 'UTC';
      console.log('[AvailabilityService] Using clinician timezone for update:', clinicianTimeZone);

      const updateData: any = {};
      
      if (updates.startTime) {
        const startDateTime = DateTime.fromISO(updates.startTime, { zone: clinicianTimeZone });
        if (!startDateTime.isValid) {
          console.error('[AvailabilityService] Invalid start time format:', updates.startTime);
          return false;
        }
        updateData.start_time = startDateTime.toUTC().toISO();
      }
      
      if (updates.endTime) {
        const endDateTime = DateTime.fromISO(updates.endTime, { zone: clinicianTimeZone });
        if (!endDateTime.isValid) {
          console.error('[AvailabilityService] Invalid end time format:', updates.endTime);
          return false;
        }
        updateData.end_time = endDateTime.toUTC().toISO();
      }
      
      if (updates.title) {
        updateData.title = updates.title;
      }

      if (Object.keys(updates).length === 0 && updateRecurrence === false) {
        updateData.is_active = false;
      }

      console.log(`[AvailabilityService] Updating slot ${slotId} with data:`, updateData);

      const { error } = await supabase
        .from('calendar_events')
        .update(updateData)
        .eq('id', slotId)
        .eq('event_type', 'availability');

      if (error) {
        console.error('[AvailabilityService] Error updating availability slot:', error);
        return false;
      }

      if (updateRecurrence) {
        const { data: eventData, error: eventError } = await supabase
          .from('calendar_events')
          .select('recurrence_id')
          .eq('id', slotId)
          .single();

        if (eventError || !eventData?.recurrence_id) {
          console.log('[AvailabilityService] Not a recurring event or error fetching recurrence:', eventError);
          return !eventError;
        }

        console.log(`[AvailabilityService] Updating all occurrences with recurrence ID ${eventData.recurrence_id}`);

        const { error: recurrenceUpdateError } = await supabase
          .from('calendar_events')
          .update(updateData)
          .eq('recurrence_id', eventData.recurrence_id);

        if (recurrenceUpdateError) {
          console.error('[AvailabilityService] Error updating recurring availability slots:', recurrenceUpdateError);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('[AvailabilityService] Error in updateAvailabilitySlot:', error);
      return false;
    }
  }

  static async deleteAvailabilitySlot(
    slotId: string,
    deleteRecurrence: boolean = false
  ): Promise<boolean> {
    try {
      if (deleteRecurrence) {
        const { data: eventData, error: eventError } = await supabase
          .from('calendar_events')
          .select('recurrence_id')
          .eq('id', slotId)
          .single();

        if (eventError) {
          console.error('Error checking recurrence:', eventError);
          return false;
        }

        if (eventData?.recurrence_id) {
          const { error: recurrenceDeleteError } = await supabase
            .from('calendar_events')
            .delete()
            .eq('recurrence_id', eventData.recurrence_id);

          if (recurrenceDeleteError) {
            console.error('Error deleting recurring availability slots:', recurrenceDeleteError);
            return false;
          }

          const { error: ruleDeleteError } = await supabase
            .from('recurrence_rules')
            .delete()
            .eq('id', eventData.recurrence_id);

          if (ruleDeleteError) {
            console.error('Error deleting recurrence rule:', ruleDeleteError);
            return false;
          }

          return true;
        }
      }

      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', slotId)
        .eq('event_type', 'availability');

      if (error) {
        console.error('Error deleting availability slot:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteAvailabilitySlot:', error);
      return false;
    }
  }

  static async getWeeklyAvailability(clinicianId: string): Promise<WeeklyAvailability> {
    try {
      console.log('[AvailabilityService] Getting weekly availability for clinician:', clinicianId);
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('time_zone')
        .eq('id', clinicianId)
        .maybeSingle();
      
      if (profileError) {
        console.error('[AvailabilityService] Error fetching clinician timezone:', profileError);
      }
      
      const clinicianTimeZone = ensureIANATimeZone(profileData?.time_zone || 'UTC');
      console.log('[AvailabilityService] Using clinician timezone:', clinicianTimeZone);
      
      const weeklyAvailability: WeeklyAvailability = createEmptyWeeklyAvailability();
      
      const { data: events, error } = await supabase
        .from('calendar_events')
        .select(`
          id, 
          start_time, 
          end_time, 
          recurrence_id,
          recurrence_rules:recurrence_id(rrule),
          is_active
        `)
        .eq('clinician_id', clinicianId)
        .eq('event_type', 'availability')
        .eq('is_active', true);

      if (error) {
        console.error('[AvailabilityService] Error fetching weekly availability:', error);
        return createEmptyWeeklyAvailability();
      }
      
      console.log(`[AvailabilityService] Processing ${events?.length || 0} availability events`);

      events?.forEach(event => {
        try {
          const startDateTime = DateTime.fromISO(event.start_time).setZone(clinicianTimeZone);
          const endDateTime = DateTime.fromISO(event.end_time).setZone(clinicianTimeZone);
          
          const dayOfWeek = startDateTime.weekdayLong.toLowerCase();
          
          console.log(`[AvailabilityService] Event ${event.id}:`, {
            originalStart: event.start_time,
            originalEnd: event.end_time,
            timezone: clinicianTimeZone,
            convertedStart: startDateTime.toString(),
            convertedEnd: endDateTime.toString(),
            dayOfWeek: dayOfWeek,
            startHour: startDateTime.hour,
            startMinute: startDateTime.minute,
            endHour: endDateTime.hour,
            endMinute: endDateTime.minute
          });
          
          if (dayOfWeek in weeklyAvailability) {
            weeklyAvailability[dayOfWeek].push({
              id: event.id,
              startTime: startDateTime.toFormat('HH:mm'),
              endTime: endDateTime.toFormat('HH:mm'),
              dayOfWeek,
              isRecurring: !!event.recurrence_id,
              isAppointment: false
            });
            
            console.log(`[AvailabilityService] Added availability for ${dayOfWeek}:`, {
              id: event.id,
              startTime: startDateTime.toFormat('HH:mm'),
              endTime: endDateTime.toFormat('HH:mm')
            });
          }
        } catch (err) {
          console.error(`[AvailabilityService] Error processing event ${event.id}:`, err);
        }
      });

      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          id, 
          date, 
          start_time, 
          end_time, 
          status,
          source_time_zone,
          client:clients!client_id (
            client_first_name,
            client_last_name
          )
        `)
        .eq('clinician_id', clinicianId)
        .eq('status', 'scheduled');

      if (appointmentsError) {
        console.error('[AvailabilityService] Error fetching appointments:', appointmentsError);
      } else {
        console.log(`[AvailabilityService] Processing ${appointments?.length || 0} appointments`);
        
        appointments?.forEach(appointment => {
          try {
            const apptDate = appointment.date;
            const startTimeStr = appointment.start_time;
            const endTimeStr = appointment.end_time;
            
            const startDateTimeStr = `${apptDate}T${startTimeStr}`;
            const endDateTimeStr = `${apptDate}T${endTimeStr}`;
            
            const sourceTimeZone = appointment.source_time_zone || clinicianTimeZone;
            const startDateTime = DateTime.fromSQL(startDateTimeStr, { zone: sourceTimeZone }).setZone(clinicianTimeZone);
            const endDateTime = DateTime.fromSQL(endDateTimeStr, { zone: sourceTimeZone }).setZone(clinicianTimeZone);
            
            if (!startDateTime.isValid || !endDateTime.isValid) {
              console.error('[AvailabilityService] Invalid appointment date/time:', {
                appointment: appointment.id,
                date: apptDate,
                startTime: startTimeStr,
                endTime: endTimeStr,
                startValid: startDateTime.isValid,
                startInvalidReason: startDateTime?.invalidReason,
                endValid: endDateTime.isValid,
                endInvalidReason: endDateTime?.invalidReason
              });
              return;
            }
            
            const dayOfWeek = startDateTime.weekdayLong.toLowerCase();
            
            let clientName = 'Client';
            if (appointment.client) {
              clientName = `${appointment.client.client_first_name || ''} ${appointment.client.client_last_name || ''}`.trim();
              clientName = clientName || 'Client';
            }
            
            console.log(`[AvailabilityService] Appointment ${appointment.id}:`, {
              date: apptDate,
              startTime: startTimeStr,
              endTime: endTimeStr,
              dayOfWeek,
              clientName,
              convertedStart: startDateTime.toFormat('HH:mm'),
              convertedEnd: endDateTime.toFormat('HH:mm')
            });
            
            if (dayOfWeek in weeklyAvailability) {
              weeklyAvailability[dayOfWeek].push({
                id: appointment.id,
                startTime: startDateTime.toFormat('HH:mm'),
                endTime: endDateTime.toFormat('HH:mm'),
                dayOfWeek,
                isAppointment: true,
                clientName,
                appointmentStatus: appointment.status
              });
              
              console.log(`[AvailabilityService] Added appointment for ${dayOfWeek}:`, {
                id: appointment.id,
                startTime: startDateTime.toFormat('HH:mm'),
                endTime: endDateTime.toFormat('HH:mm'),
                clientName
              });
            }
          } catch (err) {
            console.error(`[AvailabilityService] Error processing appointment ${appointment.id}:`, err);
          }
        });
      }

      return weeklyAvailability;
    } catch (error) {
      console.error('[AvailabilityService] Error getting weekly availability:', error);
      return createEmptyWeeklyAvailability();
    }
  }

  static async calculateAvailableSlots(clinicianId: string, date: string): Promise<Array<{
    start: string;
    end: string;
    slotId?: string;
    isRecurring?: boolean;
  }>> {
    return [];
  }
}
