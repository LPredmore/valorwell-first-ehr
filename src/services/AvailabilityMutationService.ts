import { supabase } from '@/integrations/supabase/client';
import { DayOfWeek } from '@/types/availability';
import { PermissionService } from '@/services/PermissionService';
import { TimeZoneService } from '@/utils/timezone';
import { ensureUUID } from '@/utils/validation/uuidUtils';
import { ensureClinicianID } from '@/utils/validation/clinicianUtils';
import { DateTime } from 'luxon';
import { z } from 'zod';
import { SchemaValidator } from '@/utils/validation/schemaValidator';
import { validateAvailabilitySlot, validateNonEmptyString, validateClinicianID } from '@/utils/validation/validationUtils';
import {
  ValidationError,
  PermissionError,
  DatabaseError,
  TimeZoneError,
  ConflictError,
  AuthenticationError,
  logError
} from '@/utils/errors';

// Define availability slot schema
const availabilitySlotSchema = z.object({
  clinicianId: z.string().min(1, "Clinician ID is required"),
  dayOfWeek: z.enum(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"], {
    errorMap: () => ({ message: "Please select a valid day of the week" })
  }),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  isRecurring: z.boolean().optional().default(true),
  recurrenceRule: z.string().optional(),
  timeZone: z.string().min(1, "Time zone is required")
}).refine(
  (data) => {
    // Validate that the time zone is valid
    return !!TimeZoneService.ensureIANATimeZone(data.timeZone);
  },
  {
    message: "Invalid time zone",
    path: ["timeZone"]
  }
);

export class AvailabilityMutationService {

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
      throw new ValidationError(`Invalid day of week: ${dayOfWeek}`, {
        field: 'dayOfWeek',
        value: dayOfWeek,
        userMessage: 'Please select a valid day of the week.'
      });
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
      // Validate inputs using schema validator
      const validationResult = SchemaValidator.validate(
        availabilitySlotSchema,
        {
          clinicianId,
          dayOfWeek,
          startTime,
          endTime,
          isRecurring,
          recurrenceRule,
          timeZone
        }
      );
      
      // Ensure clinicianId is a valid clinician ID
      const validClinicianId = ensureClinicianID(clinicianId);
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
      
      // Validate the appointment time using our validation utility
      let start: DateTime;
      let end: DateTime;
      
      try {
        const { startTime: validStartTime, endTime: validEndTime } = validateAvailabilitySlot(
          baseDate,
          startTime,
          endTime,
          validTimeZone
        );
        
        // Create proper DateTime objects with timezone
        start = TimeZoneService.parseWithZone(`${baseDate}T${startTime}`, validTimeZone);
        end = TimeZoneService.parseWithZone(`${baseDate}T${endTime}`, validTimeZone);
        
        console.log('[AvailabilityMutationService] Created DateTimes:', {
          start: start.toISO(),
          end: end.toISO(),
          startValid: start.isValid,
          endValid: end.isValid
        });
      } catch (error) {
        if (error instanceof ValidationError || error instanceof TimeZoneError) {
          throw error;
        }
        
        throw new TimeZoneError(`Invalid date/time: ${(error as Error).message}`, {
          code: 'INVALID_DATETIME',
          userMessage: 'The date or time format is invalid',
          cause: error as Error
        });
      }
      
      // Get the authenticated user ID for debugging
      const { data: { user } } = await supabase.auth.getUser();
      const authUserId = user?.id;
      console.log(`[AvailabilityMutationService] Current auth user ID: ${authUserId}, using clinician ID: ${validClinicianId}`);
      
      // Add safety check for auth
      if (!authUserId) {
        throw new AuthenticationError('You must be logged in to create availability slots', {
          userMessage: 'You must be logged in to create availability slots'
        });
      }
      
      // Check if user is trying to create a slot for another clinician
      if (authUserId !== validClinicianId) {
        console.warn('[AvailabilityMutationService] Warning: User is creating availability for a different clinician', {
          authUserId,
          targetClinicianId: validClinicianId
        });
        
        try {
          // Use PermissionService to check if user can edit this clinician's availability
          const canEdit = await PermissionService.canEditAvailability(authUserId, validClinicianId);
          
          if (!canEdit) {
            console.warn('[AvailabilityMutationService] User does not have permission to edit this clinician\'s availability');
            throw new PermissionError('Permission denied: You can only manage your own availability unless you have admin privileges.', {
              userMessage: 'You can only manage your own availability unless you have admin privileges.',
              resource: 'availability',
              action: 'create'
            });
          }
          
          console.log('[AvailabilityMutationService] User has permission to edit this clinician\'s availability');
        } catch (e) {
          if (e instanceof Error && e.message.includes('Permission denied')) {
            throw e; // Re-throw our custom permission error
          }
          console.error('[AvailabilityMutationService] Error checking permissions:', e);
          logError(e, { source: 'AvailabilityMutationService', method: 'createAvailabilitySlot', clinicianId: validClinicianId });
          throw new PermissionError('Failed to verify user permissions. Please try again.', {
            userMessage: 'Failed to verify user permissions. Please try again.',
            resource: 'availability',
            action: 'create'
          });
        }
      }
      
      // Verify database access before insert
      const { data: testAccess, error: accessError } = await supabase
        .from('calendar_events')
        .select('id')
        .limit(1);
        
      if (accessError) {
        console.error('[AvailabilityMutationService] Database access check failed:', accessError);
        logError(accessError, { source: 'AvailabilityMutationService', method: 'createAvailabilitySlot' });
        throw new DatabaseError(`Database access error: ${accessError.message}`, {
          userMessage: 'Unable to access the calendar database. Please try again later.',
          operation: 'select',
          table: 'calendar_events'
        });
      }
      
      console.log('[AvailabilityMutationService] Database access verified, proceeding with insert');
      
      // Insert into database with explicit UUID conversion
      const { data, error } = await supabase
        .from('calendar_events')
        .insert({
          title: 'Available',
          event_type: 'availability',
          start_time: TimeZoneService.parseWithZone(`${baseDate}T${startTime}`, validTimeZone).toISO(),
          end_time: TimeZoneService.parseWithZone(`${baseDate}T${endTime}`, validTimeZone).toISO(),
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
        
        logError(error, {
          source: 'AvailabilityMutationService',
          method: 'createAvailabilitySlot',
          clinicianId: validClinicianId,
          startTime,
          endTime,
          dayOfWeek
        });
        
        if (error.message.includes('violates row level security policy')) {
          throw new PermissionError('Permission denied: You do not have access to create availability for this clinician.', {
            userMessage: 'You do not have access to create availability for this clinician. Check your login permissions.',
            resource: 'availability',
            action: 'create'
          });
        }
        
        if (error.message.includes('Overlapping availability slot detected') || error.message.includes('check_availability_overlap')) {
          throw new ConflictError('This time slot overlaps with an existing availability slot.', {
            userMessage: 'This time slot overlaps with an existing availability slot. Please choose a different time.',
            resource: 'availability',
            conflictReason: 'overlap'
          });
        }
        
        if (error.message.includes('foreign key constraint')) {
          throw new DatabaseError('Database relationship error: The clinician ID may be invalid or not properly formatted.', {
            userMessage: 'The clinician ID may be invalid or not properly formatted.',
            operation: 'insert',
            table: 'calendar_events',
            code: 'DB_FOREIGN_KEY_VIOLATION'
          });
        }
        
        // If it's not a specific error we handle, convert it to a DatabaseError
        throw new DatabaseError(error.message || 'Failed to create availability slot', {
          userMessage: 'Failed to create availability slot. Please try again.',
          operation: 'insert',
          table: 'calendar_events',
          context: { originalError: error }
        });
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
          throw new DatabaseError('Failed to create recurrence rule', {
            userMessage: 'Failed to create recurring availability. Please try again.',
            operation: 'insert',
            table: 'recurrence_rules',
            context: { originalError: ruleError }
          });
        }
      }
      
      return data;
      
    } catch (error) {
      // If it's already an AppError, just log it and rethrow
      if (error instanceof Error) {
        console.error('[AvailabilityMutationService] Error creating availability slot:', error);
        logError(error, {
          source: 'AvailabilityMutationService',
          method: 'createAvailabilitySlot',
          clinicianId,
          startTime,
          endTime,
          dayOfWeek
        });
      }
      throw error;
    }
  }

  // Update an availability slot
  static async updateAvailabilitySlot(slotId: string, updates: any) {
    try {
      // Validate slot ID
      validateNonEmptyString(slotId, 'Slot ID');
      
      // Ensure slotId is a valid UUID
      const validSlotId = ensureUUID(slotId, 'Availability Slot');
      
      // Get the current authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new AuthenticationError('You must be logged in to update availability slots', {
          userMessage: 'You must be logged in to update availability slots'
        });
      }
      
      // Get the current slot to check permissions
      const { data: slotData, error: slotError } = await supabase
        .from('calendar_events')
        .select('clinician_id')
        .eq('id', validSlotId)
        .single();
        
      if (slotError) {
        console.error('[AvailabilityMutationService] Error fetching slot:', slotError);
        throw new DatabaseError(`Failed to fetch availability slot: ${slotError.message}`, {
          userMessage: 'Failed to fetch availability slot. Please try again.',
          operation: 'select',
          table: 'calendar_events',
          context: { originalError: slotError }
        });
      }
      
      // Check if user is trying to update a slot for another clinician
      if (user.id !== slotData.clinician_id) {
        // Use PermissionService to check if user can edit this clinician's availability
        const canEdit = await PermissionService.canEditAvailability(user.id, slotData.clinician_id);
        
        if (!canEdit) {
          throw new PermissionError('Permission denied: You can only update your own availability slots', {
            userMessage: 'You can only update your own availability slots',
            resource: 'availability',
            action: 'update'
          });
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
        throw new DatabaseError(`Failed to update availability slot: ${error.message}`, {
          userMessage: 'Failed to update availability slot. Please try again.',
          operation: 'update',
          table: 'calendar_events',
          context: { originalError: error }
        });
      }
      
      return data;
    } catch (error) {
      console.error('[AvailabilityMutationService] Error in updateAvailabilitySlot:', error);
      logError(error, {
        source: 'AvailabilityMutationService',
        method: 'updateAvailabilitySlot',
        slotId
      });
      throw error;
    }
  }
  
  // Delete an availability slot
  static async deleteAvailabilitySlot(slotId: string) {
    try {
      // Validate slot ID
      validateNonEmptyString(slotId, 'Slot ID');
      
      // Ensure slotId is a valid UUID
      const validSlotId = ensureUUID(slotId, 'Availability Slot');
      
      // Get the current authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new AuthenticationError('You must be logged in to delete availability slots', {
          userMessage: 'You must be logged in to delete availability slots'
        });
      }
      
      // Get the current slot to check permissions and recurrence_id
      const { data: slotData, error: slotError } = await supabase
        .from('calendar_events')
        .select('clinician_id, recurrence_id')
        .eq('id', validSlotId)
        .single();
        
      if (slotError) {
        console.error('[AvailabilityMutationService] Error fetching slot:', slotError);
        throw new DatabaseError(`Failed to fetch availability slot: ${slotError.message}`, {
          userMessage: 'Failed to fetch availability slot. Please try again.',
          operation: 'select',
          table: 'calendar_events',
          context: { originalError: slotError }
        });
      }
      
      // Check if user is trying to delete a slot for another clinician
      if (user.id !== slotData.clinician_id) {
        // Use PermissionService to check if user can edit this clinician's availability
        const canEdit = await PermissionService.canEditAvailability(user.id, slotData.clinician_id);
        
        if (!canEdit) {
          throw new PermissionError('Permission denied: You can only delete your own availability slots', {
            userMessage: 'You can only delete your own availability slots',
            resource: 'availability',
            action: 'delete'
          });
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
        throw new DatabaseError(`Failed to delete availability slot: ${error.message}`, {
          userMessage: 'Failed to delete availability slot. Please try again.',
          operation: 'delete',
          table: 'calendar_events',
          context: { originalError: error }
        });
      }
      
      return data;
    } catch (error) {
      console.error('[AvailabilityMutationService] Error in deleteAvailabilitySlot:', error);
      logError(error, {
        source: 'AvailabilityMutationService',
        method: 'deleteAvailabilitySlot',
        slotId
      });
      throw error;
    }
  }
}
