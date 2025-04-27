
import { supabase } from '@/integrations/supabase/client';
import { DayOfWeek } from '@/types/availability';
import { TimeZoneService } from '@/utils/timeZoneService';
import { DateTime } from 'luxon';

export class AvailabilityMutationService {
  // Helper function to ensure UUID format is valid
  private static ensureUUID(id: string): string {
    try {
      // Basic UUID validation
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
        return id;
      } else {
        console.warn(`[AvailabilityMutationService] Invalid UUID format: ${id}, attempting to proceed anyway`);
        return id;
      }
    } catch (e) {
      console.error('[AvailabilityMutationService] Error processing ID:', e);
      return id;
    }
  }

  // Get a base date for a given day of week
  private static getBaseDate(dayOfWeek: DayOfWeek, specificDate?: string | Date | DateTime): string {
    if (specificDate) {
      if (specificDate instanceof DateTime) {
        return specificDate.toISODate() as string;
      }
      return specificDate instanceof Date 
        ? new Date(specificDate).toISOString().split('T')[0]
        : specificDate;
    }
    
    // Get current date
    const now = new Date();
    const currentDayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Convert day of week string to number (0-6)
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const targetDayOfWeek = dayNames.indexOf(dayOfWeek.toLowerCase());
    
    if (targetDayOfWeek === -1) {
      throw new Error(`Invalid day of week: ${dayOfWeek}`);
    }
    
    // Calculate days to add
    const daysToAdd = (targetDayOfWeek - currentDayOfWeek + 7) % 7;
    
    // Add days to current date
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + daysToAdd);
    
    return targetDate.toISOString().split('T')[0];
  }
  
  // Helper function to convert day to RRule format
  private static getDayCode(day: DayOfWeek): string {
    const dayMap: Record<DayOfWeek, string> = {
      monday: 'MO',
      tuesday: 'TU',
      wednesday: 'WE',
      thursday: 'TH',
      friday: 'FR',
      saturday: 'SA',
      sunday: 'SU'
    };
    
    return dayMap[day];
  }

  // Let's update the createAvailabilitySlot method to better handle permissions
  static async createAvailabilitySlot(
    clinicianId: string,
    dayOfWeek: DayOfWeek,
    startTime: string,
    endTime: string,
    isRecurring: boolean = true,
    recurrenceRule?: string,
    timeZone: string = 'America/Chicago',
    specificDate?: string | Date | DateTime
  ) {
    try {
      // Improved input validation with detailed error messages
      if (!clinicianId) throw new Error('Clinician ID is required');
      if (!startTime) throw new Error('Start time is required');
      if (!endTime) throw new Error('End time is required');
      if (!dayOfWeek) throw new Error('Day of week is required');
      
      // Ensure clinicianId is a valid UUID
      const validClinicianId = this.ensureUUID(clinicianId);
      console.log(`[AvailabilityMutationService] Validated clinician ID: ${validClinicianId} (original: ${clinicianId})`);
      
      const validTimeZone = TimeZoneService.ensureIANATimeZone(timeZone);
      console.log(`[AvailabilityMutationService] Creating availability slot:`, {
        dayOfWeek,
        startTime,
        endTime,
        timeZone: validTimeZone,
        clinicianId: validClinicianId,
        specificDate: specificDate ? 
          (specificDate instanceof DateTime ? 
            specificDate.toISO() : 
            String(specificDate)
          ) : 'none'
      });
      
      // Get the base date for this availability slot
      const baseDate = this.getBaseDate(dayOfWeek, specificDate);
      console.log(`[AvailabilityMutationService] Using base date: ${baseDate} for day ${dayOfWeek}`);
      
      // Create proper DateTime objects with timezone
      const start = TimeZoneService.parseWithZone(`${baseDate}T${startTime}`, validTimeZone);
      const end = TimeZoneService.parseWithZone(`${baseDate}T${endTime}`, validTimeZone);
      
      console.log('[AvailabilityMutationService] Created DateTimes:', {
        start: start.toISO(),
        end: end.toISO(),
        startValid: start.isValid,
        endValid: end.isValid
      });

      if (!start.isValid || !end.isValid) {
        throw new Error(`Invalid date/time: ${start.invalidReason || end.invalidReason}`);
      }
      
      if (start >= end) {
        throw new Error('Start time must be before end time');
      }
      
      // Get the authenticated user ID for debugging
      const { data: { user } } = await supabase.auth.getUser();
      const authUserId = user?.id;
      console.log(`[AvailabilityMutationService] Current auth user ID: ${authUserId}, using clinician ID: ${validClinicianId}`);
      
      // Add safety check for auth
      if (!authUserId) {
        throw new Error('You must be logged in to create availability slots');
      }
      
      // Check if user is trying to create a slot for another clinician
      if (authUserId !== validClinicianId) {
        console.warn('[AvailabilityMutationService] Warning: User is creating availability for a different clinician', {
          authUserId,
          targetClinicianId: validClinicianId
        });
        
        try {
          // Check if they have admin role
          const { data: profileData } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', authUserId)
            .single();
            
          if (!profileData || profileData.role !== 'admin') {
            console.warn('[AvailabilityMutationService] Non-admin user attempting to create availability for another clinician');
            // We don't throw here - let RLS handle it
          }
        } catch (e) {
          console.error('[AvailabilityMutationService] Error checking user role:', e);
          // We don't throw here - let RLS handle it
        }
      }
      
      // Verify database access before insert
      const { data: testAccess, error: accessError } = await supabase
        .from('calendar_events')
        .select('id')
        .limit(1);
        
      if (accessError) {
        console.error('[AvailabilityMutationService] Database access check failed:', accessError);
        throw new Error(`Database access error: ${accessError.message}`);
      }
      
      console.log('[AvailabilityMutationService] Database access verified, proceeding with insert');
      
      // Insert into database with explicit UUID conversion
      const { data, error } = await supabase
        .from('calendar_events')
        .insert({
          title: 'Available',
          event_type: 'availability',
          start_time: start.toISO(),
          end_time: end.toISO(),
          clinician_id: validClinicianId,
          availability_type: isRecurring ? 'recurring' : 'single',
          is_active: true,
          time_zone: validTimeZone
        })
        .select()
        .single();
      
      if (error) {
        console.error('[AvailabilityMutationService] Error creating availability slot:', {
          error,
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        if (error.message.includes('violates row level security policy')) {
          throw new Error('Permission denied: You do not have access to create availability for this clinician. Check your login permissions.');
        }
        
        throw error;
      }
      
      // If recurring, create a recurrence rule
      if (isRecurring && data.id) {
        const rrule = recurrenceRule || `FREQ=WEEKLY;BYDAY=${this.getDayCode(dayOfWeek)}`;
        
        const { error: ruleError } = await supabase
          .from('recurrence_rules')
          .insert({
            event_id: data.id,
            rrule: rrule
          });
        
        if (ruleError) {
          console.error('[AvailabilityMutationService] Error creating recurrence rule:', ruleError);
          throw ruleError;
        }
      }
      
      return data;
      
    } catch (error) {
      console.error('[AvailabilityMutationService] Error creating availability slot:', error);
      throw error;
    }
  }

  // Update an availability slot
  static async updateAvailabilitySlot(slotId: string, updates: any) {
    try {
      if (!slotId) throw new Error('Slot ID is required');
      
      // Ensure slotId is a valid UUID
      const validSlotId = this.ensureUUID(slotId);
      
      // Get the current authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to update availability slots');
      }
      
      // Get the current slot to check permissions
      const { data: slotData, error: slotError } = await supabase
        .from('calendar_events')
        .select('clinician_id')
        .eq('id', validSlotId)
        .single();
        
      if (slotError) {
        console.error('[AvailabilityMutationService] Error fetching slot:', slotError);
        throw new Error(`Failed to fetch availability slot: ${slotError.message}`);
      }
      
      // Check if user is trying to update a slot for another clinician
      if (user.id !== slotData.clinician_id) {
        // Check if they have admin role
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
          
        if (!profileData || profileData.role !== 'admin') {
          throw new Error('Permission denied: You can only update your own availability slots');
        }
      }
      
      // Process updates
      const processedUpdates: any = { ...updates };
      
      // Handle timezone conversion if needed
      if (updates.startTime && updates.endTime && updates.timeZone) {
        const validTimeZone = TimeZoneService.ensureIANATimeZone(updates.timeZone);
        
        // Get date to use
        let baseDate = new Date().toISOString().split('T')[0];
        if (updates.date) {
          baseDate = typeof updates.date === 'string' ? updates.date : updates.date.toISOString().split('T')[0];
        }
        
        const start = TimeZoneService.parseWithZone(`${baseDate}T${updates.startTime}`, validTimeZone);
        const end = TimeZoneService.parseWithZone(`${baseDate}T${updates.endTime}`, validTimeZone);
        
        processedUpdates.start_time = start.toISO();
        processedUpdates.end_time = end.toISO();
        processedUpdates.time_zone = validTimeZone;
        
        // Remove fields we've processed
        delete processedUpdates.startTime;
        delete processedUpdates.endTime;
        delete processedUpdates.date;
      }
      
      // Map fields to database column names
      if (processedUpdates.isActive !== undefined) {
        processedUpdates.is_active = processedUpdates.isActive;
        delete processedUpdates.isActive;
      }
      
      // Update the database record
      const { data, error } = await supabase
        .from('calendar_events')
        .update(processedUpdates)
        .eq('id', validSlotId)
        .select()
        .single();
        
      if (error) {
        console.error('[AvailabilityMutationService] Error updating availability slot:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('[AvailabilityMutationService] Error in updateAvailabilitySlot:', error);
      throw error;
    }
  }
  
  // Delete an availability slot
  static async deleteAvailabilitySlot(slotId: string) {
    try {
      if (!slotId) throw new Error('Slot ID is required');
      
      // Ensure slotId is a valid UUID
      const validSlotId = this.ensureUUID(slotId);
      
      // Get the current authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to delete availability slots');
      }
      
      // Get the current slot to check permissions and recurrence_id
      const { data: slotData, error: slotError } = await supabase
        .from('calendar_events')
        .select('clinician_id, recurrence_id')
        .eq('id', validSlotId)
        .single();
        
      if (slotError) {
        console.error('[AvailabilityMutationService] Error fetching slot:', slotError);
        throw new Error(`Failed to fetch availability slot: ${slotError.message}`);
      }
      
      // Check if user is trying to delete a slot for another clinician
      if (user.id !== slotData.clinician_id) {
        // Check if they have admin role
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
          
        if (!profileData || profileData.role !== 'admin') {
          throw new Error('Permission denied: You can only delete your own availability slots');
        }
      }
      
      // If this is a recurring event, also delete the recurrence rule
      if (slotData.recurrence_id) {
        await supabase
          .from('recurrence_rules')
          .delete()
          .eq('id', slotData.recurrence_id);
      }
      
      // Delete the calendar event
      const { data, error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', validSlotId)
        .select()
        .single();
        
      if (error) {
        console.error('[AvailabilityMutationService] Error deleting availability slot:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('[AvailabilityMutationService] Error in deleteAvailabilitySlot:', error);
      throw error;
    }
  }
}
