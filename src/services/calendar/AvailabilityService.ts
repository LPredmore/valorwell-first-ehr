import { supabase } from '@/integrations/supabase/client';
import { TimeZoneService } from './TimeZoneService';
import { RecurrenceService } from './RecurrenceService';
import { CalendarError } from './CalendarErrorHandler';
import { DateTime } from 'luxon';
import { CalendarEvent } from '@/types/calendar';

/**
 * Interface for availability block data
 */
interface AvailabilityBlock {
  id?: string;
  clinician_id: string;
  start_time: string;
  end_time: string;
  availability_type: 'recurring' | 'single';
  recurrence_pattern_id?: string;
  is_active?: boolean;
  time_zone: string;
}

/**
 * AvailabilityService
 * 
 * Handles all operations related to clinician availability blocks.
 * This includes creating, retrieving, updating, and deleting availability blocks,
 * as well as handling recurring availability and exceptions.
 */
export class AvailabilityService {
  /**
   * Creates a new availability block
   * 
   * @param clinicianId - The ID of the clinician
   * @param startTime - The start time of the availability block
   * @param endTime - The end time of the availability block
   * @param timeZone - The timezone of the availability block
   * @param isRecurring - Whether the availability block is recurring
   * @param rrule - The recurrence rule (required if isRecurring is true)
   * @returns The created availability block
   */
  static async createAvailability(
    clinicianId: string,
    startTime: Date | string,
    endTime: Date | string,
    timeZone: string,
    isRecurring: boolean = false,
    rrule?: string
  ): Promise<AvailabilityBlock> {
    try {
      const validTimeZone = TimeZoneService.validateTimeZone(timeZone);
      
      // Convert dates to ISO strings
      const startTimeStr = typeof startTime === 'string' 
        ? startTime 
        : startTime.toISOString();
      
      const endTimeStr = typeof endTime === 'string' 
        ? endTime 
        : endTime.toISOString();
      
      // Validate time range
      if (new Date(startTimeStr) >= new Date(endTimeStr)) {
        throw new CalendarError(
          'Start time must be before end time',
          'CALENDAR_VALIDATION_ERROR',
          { startTime: startTimeStr, endTime: endTimeStr }
        );
      }
      
      // Create availability block
      const availabilityBlock: AvailabilityBlock = {
        clinician_id: clinicianId,
        start_time: startTimeStr,
        end_time: endTimeStr,
        availability_type: isRecurring ? 'recurring' : 'single',
        is_active: true,
        time_zone: validTimeZone
      };
      
      // If recurring, create recurrence pattern
      if (isRecurring) {
        if (!rrule) {
          throw new CalendarError(
            'Recurrence rule is required for recurring availability',
            'CALENDAR_VALIDATION_ERROR',
            { isRecurring }
          );
        }
        
        const recurrencePatternId = await RecurrenceService.createRecurrencePattern(rrule);
        availabilityBlock.recurrence_pattern_id = recurrencePatternId;
      }
      
      // Insert availability block
      const { data, error } = await supabase
        .from('availability_blocks')
        .insert(availabilityBlock)
        .select()
        .single();
      
      if (error) {
        throw new CalendarError(
          'Failed to create availability block',
          'CALENDAR_DB_ERROR',
          { availabilityBlock, error }
        );
      }
      
      return data;
    } catch (error) {
      if (error instanceof CalendarError) {
        throw error;
      }
      throw new CalendarError(
        'Failed to create availability block',
        'CALENDAR_UNKNOWN_ERROR',
        { 
          clinicianId, 
          startTime, 
          endTime, 
          timeZone, 
          isRecurring, 
          rrule, 
          originalError: error 
        }
      );
    }
  }

  /**
   * Gets availability blocks for a clinician
   * 
   * @param clinicianId - The ID of the clinician
   * @param timeZone - The timezone to return the availability blocks in
   * @param startDate - The start date of the range to get availability blocks for (optional)
   * @param endDate - The end date of the range to get availability blocks for (optional)
   * @param includeInactive - Whether to include inactive availability blocks (optional)
   * @returns An array of availability blocks
   */
  static async getAvailability(
    clinicianId: string,
    timeZone: string,
    startDate?: Date | string,
    endDate?: Date | string,
    includeInactive: boolean = false
  ): Promise<AvailabilityBlock[]> {
    try {
      const validTimeZone = TimeZoneService.validateTimeZone(timeZone);
      
      // Build query
      let query = supabase
        .from('availability_blocks')
        .select(`
          id,
          clinician_id,
          start_time,
          end_time,
          availability_type,
          recurrence_pattern_id,
          is_active,
          time_zone,
          recurrence_patterns(id, rrule)
        `)
        .eq('clinician_id', clinicianId);
      
      // Add date range filter if provided
      if (startDate && endDate) {
        const startDateStr = typeof startDate === 'string' 
          ? startDate 
          : startDate.toISOString();
        
        const endDateStr = typeof endDate === 'string' 
          ? endDate 
          : endDate.toISOString();
        
        query = query
          .gte('end_time', startDateStr)
          .lte('start_time', endDateStr);
      }
      
      // Add active filter if not including inactive
      if (!includeInactive) {
        query = query.eq('is_active', true);
      }
      
      // Execute query
      const { data, error } = await query;
      
      if (error) {
        throw new CalendarError(
          'Failed to get availability blocks',
          'CALENDAR_DB_ERROR',
          { clinicianId, timeZone, startDate, endDate, includeInactive, error }
        );
      }
      
      // Process results
      const availabilityBlocks: AvailabilityBlock[] = [];
      
      for (const block of data || []) {
        // Add the basic block
        availabilityBlocks.push({
          id: block.id,
          clinician_id: block.clinician_id,
          start_time: block.start_time,
          end_time: block.end_time,
          availability_type: block.availability_type,
          recurrence_pattern_id: block.recurrence_pattern_id,
          is_active: block.is_active,
          time_zone: block.time_zone
        });
        
        // If recurring and date range is provided, expand recurrence
        if (block.availability_type === 'recurring' &&
            block.recurrence_pattern_id &&
            block.recurrence_patterns &&
            startDate &&
            endDate) {
          
          // Get exceptions for this block
          const exceptions = await RecurrenceService.getExceptions(block.id);
          const exceptionDates = exceptions.map(ex => new Date(ex.exception_date));
          
          // Expand recurrence
          const occurrences = RecurrenceService.expandRecurrence(
            block.recurrence_patterns[0]?.rrule,
            block.start_time,
            block.end_time,
            block.time_zone,
            startDate,
            endDate
          );
          
          // Add each occurrence as a separate block, excluding exceptions
          for (const occurrence of occurrences) {
            // Skip if this occurrence is in the exceptions
            const isException = exceptionDates.some(exDate => 
              DateTime.fromJSDate(exDate).hasSame(
                DateTime.fromJSDate(occurrence.start), 
                'day'
              )
            );
            
            if (!isException) {
              availabilityBlocks.push({
                id: block.id, // Same ID as parent
                clinician_id: block.clinician_id,
                start_time: occurrence.start.toISOString(),
                end_time: occurrence.end.toISOString(),
                availability_type: 'recurring',
                recurrence_pattern_id: block.recurrence_pattern_id,
                is_active: block.is_active,
                time_zone: block.time_zone
              });
            }
          }
        }
      }
      
      return availabilityBlocks;
    } catch (error) {
      if (error instanceof CalendarError) {
        throw error;
      }
      throw new CalendarError(
        'Failed to get availability blocks',
        'CALENDAR_UNKNOWN_ERROR',
        { 
          clinicianId, 
          timeZone, 
          startDate, 
          endDate, 
          includeInactive, 
          originalError: error 
        }
      );
    }
  }

  /**
   * Gets a single availability block by ID
   * 
   * @param id - The ID of the availability block
   * @returns The availability block or null if not found
   */
  static async getAvailabilityById(id: string): Promise<AvailabilityBlock | null> {
    try {
      const { data, error } = await supabase
        .from('availability_blocks')
        .select(`
          id,
          clinician_id,
          start_time,
          end_time,
          availability_type,
          recurrence_pattern_id,
          is_active,
          time_zone,
          recurrence_patterns(id, rrule)
        `)
        .eq('id', id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // Not found
          return null;
        }
        
        throw new CalendarError(
          'Failed to get availability block',
          'CALENDAR_DB_ERROR',
          { id, error }
        );
      }
      
      return {
        id: data.id,
        clinician_id: data.clinician_id,
        start_time: data.start_time,
        end_time: data.end_time,
        availability_type: data.availability_type,
        recurrence_pattern_id: data.recurrence_pattern_id,
        is_active: data.is_active,
        time_zone: data.time_zone
      };
    } catch (error) {
      if (error instanceof CalendarError) {
        throw error;
      }
      throw new CalendarError(
        'Failed to get availability block',
        'CALENDAR_UNKNOWN_ERROR',
        { id, originalError: error }
      );
    }
  }

  /**
   * Updates an availability block
   * 
   * @param id - The ID of the availability block to update
   * @param updates - The updates to apply
   * @returns The updated availability block
   */
  static async updateAvailability(
    id: string,
    updates: Partial<AvailabilityBlock>
  ): Promise<AvailabilityBlock> {
    try {
      // Get the current availability block
      const currentBlock = await this.getAvailabilityById(id);
      
      if (!currentBlock) {
        throw new CalendarError(
          'Availability block not found',
          'CALENDAR_VALIDATION_ERROR',
          { id }
        );
      }
      
      // Validate time zone if provided
      if (updates.time_zone) {
        updates.time_zone = TimeZoneService.validateTimeZone(updates.time_zone);
      }
      
      // Validate time range if both start and end times are provided
      if (updates.start_time && updates.end_time) {
        if (new Date(updates.start_time) >= new Date(updates.end_time)) {
          throw new CalendarError(
            'Start time must be before end time',
            'CALENDAR_VALIDATION_ERROR',
            { startTime: updates.start_time, endTime: updates.end_time }
          );
        }
      } else if (updates.start_time && !updates.end_time) {
        // If only start time is provided, validate against current end time
        if (new Date(updates.start_time) >= new Date(currentBlock.end_time)) {
          throw new CalendarError(
            'Start time must be before end time',
            'CALENDAR_VALIDATION_ERROR',
            { startTime: updates.start_time, endTime: currentBlock.end_time }
          );
        }
      } else if (!updates.start_time && updates.end_time) {
        // If only end time is provided, validate against current start time
        if (new Date(currentBlock.start_time) >= new Date(updates.end_time)) {
          throw new CalendarError(
            'Start time must be before end time',
            'CALENDAR_VALIDATION_ERROR',
            { startTime: currentBlock.start_time, endTime: updates.end_time }
          );
        }
      }
      
      // Update the availability block
      const { data, error } = await supabase
        .from('availability_blocks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        throw new CalendarError(
          'Failed to update availability block',
          'CALENDAR_DB_ERROR',
          { id, updates, error }
        );
      }
      
      return data;
    } catch (error) {
      if (error instanceof CalendarError) {
        throw error;
      }
      throw new CalendarError(
        'Failed to update availability block',
        'CALENDAR_UNKNOWN_ERROR',
        { id, updates, originalError: error }
      );
    }
  }

  /**
   * Deletes an availability block
   * 
   * @param id - The ID of the availability block to delete
   * @returns True if the deletion was successful
   */
  static async deleteAvailability(id: string): Promise<boolean> {
    try {
      // Get the availability block to check if it's recurring
      const block = await this.getAvailabilityById(id);
      
      if (!block) {
        throw new CalendarError(
          'Availability block not found',
          'CALENDAR_VALIDATION_ERROR',
          { id }
        );
      }
      
      // If it's recurring, delete the recurrence pattern too
      if (block.availability_type === 'recurring' && block.recurrence_pattern_id) {
        // Delete exceptions first
        await supabase
          .from('availability_exceptions')
          .delete()
          .eq('availability_block_id', id);
        
        // Delete the block
        const { error: blockError } = await supabase
          .from('availability_blocks')
          .delete()
          .eq('id', id);
        
        if (blockError) {
          throw new CalendarError(
            'Failed to delete availability block',
            'CALENDAR_DB_ERROR',
            { id, blockError }
          );
        }
        
        // Delete the recurrence pattern
        await RecurrenceService.deleteRecurrencePattern(block.recurrence_pattern_id);
      } else {
        // Just delete the block
        const { error } = await supabase
          .from('availability_blocks')
          .delete()
          .eq('id', id);
        
        if (error) {
          throw new CalendarError(
            'Failed to delete availability block',
            'CALENDAR_DB_ERROR',
            { id, error }
          );
        }
      }
      
      return true;
    } catch (error) {
      if (error instanceof CalendarError) {
        throw error;
      }
      throw new CalendarError(
        'Failed to delete availability block',
        'CALENDAR_UNKNOWN_ERROR',
        { id, originalError: error }
      );
    }
  }

  /**
   * Creates an exception for a recurring availability block
   * 
   * @param id - The ID of the recurring availability block
   * @param exceptionDate - The date of the exception
   * @param isCancelled - Whether the occurrence is cancelled
   * @param replacementBlock - The replacement block (optional)
   * @returns The ID of the created exception
   */
  static async createException(
    id: string,
    exceptionDate: Date | string,
    isCancelled: boolean = true,
    replacementBlock?: Partial<AvailabilityBlock>
  ): Promise<string> {
    try {
      // Get the availability block to check if it's recurring
      const block = await this.getAvailabilityById(id);
      
      if (!block) {
        throw new CalendarError(
          'Availability block not found',
          'CALENDAR_VALIDATION_ERROR',
          { id }
        );
      }
      
      if (block.availability_type !== 'recurring') {
        throw new CalendarError(
          'Cannot create exception for non-recurring availability block',
          'CALENDAR_VALIDATION_ERROR',
          { id, availabilityType: block.availability_type }
        );
      }
      
      // Create replacement block if provided
      let replacementBlockId: string | undefined;
      
      if (replacementBlock && !isCancelled) {
        // Ensure required fields are present
        if (!replacementBlock.clinician_id) {
          replacementBlock.clinician_id = block.clinician_id;
        }
        
        if (!replacementBlock.time_zone) {
          replacementBlock.time_zone = block.time_zone;
        }
        
        // Create the replacement block
        const newBlock = await this.createAvailability(
          replacementBlock.clinician_id,
          replacementBlock.start_time || block.start_time,
          replacementBlock.end_time || block.end_time,
          replacementBlock.time_zone,
          false // Not recurring
        );
        
        replacementBlockId = newBlock.id;
      }
      
      // Create the exception
      return await RecurrenceService.createException(
        id,
        exceptionDate,
        isCancelled,
        replacementBlockId
      );
    } catch (error) {
      if (error instanceof CalendarError) {
        throw error;
      }
      throw new CalendarError(
        'Failed to create exception',
        'CALENDAR_UNKNOWN_ERROR',
        { 
          id, 
          exceptionDate, 
          isCancelled, 
          replacementBlock, 
          originalError: error 
        }
      );
    }
  }

  /**
   * Converts an availability block to a calendar event
   * 
   * @param block - The availability block to convert
   * @param userTimeZone - The timezone to convert to
   * @returns A calendar event
   */
  static toCalendarEvent(block: AvailabilityBlock, userTimeZone: string): CalendarEvent {
    try {
      const validTimeZone = TimeZoneService.validateTimeZone(userTimeZone);
      
      // Convert start and end times to the user's timezone
      const start = TimeZoneService.convertTimeZone(
        block.start_time,
        block.time_zone,
        validTimeZone
      );
      
      const end = TimeZoneService.convertTimeZone(
        block.end_time,
        block.time_zone,
        validTimeZone
      );
      
      return {
        id: block.id,
        title: 'Available',
        start,
        end,
        allDay: false,
        backgroundColor: '#4CAF50', // Green
        borderColor: '#388E3C',
        textColor: '#FFFFFF',
        extendedProps: {
          clinicianId: block.clinician_id,
          eventType: 'availability',
          isAvailability: true,
          isRecurring: block.availability_type === 'recurring',
          recurrenceId: block.recurrence_pattern_id,
          isActive: block.is_active,
          timezone: validTimeZone,
          sourceTimeZone: block.time_zone
        }
      };
    } catch (error) {
      if (error instanceof CalendarError) {
        throw error;
      }
      throw new CalendarError(
        'Failed to convert availability block to calendar event',
        'CALENDAR_CONVERSION_ERROR',
        { block, userTimeZone, originalError: error }
      );
    }
  }

  /**
   * Checks if a time slot is available for a clinician
   * 
   * @param clinicianId - The ID of the clinician
   * @param startTime - The start time of the slot
   * @param endTime - The end time of the slot
   * @param timeZone - The timezone of the slot
   * @returns True if the slot is available
   */
  static async isTimeSlotAvailable(
    clinicianId: string,
    startTime: Date | string,
    endTime: Date | string,
    timeZone: string
  ): Promise<boolean> {
    try {
      const validTimeZone = TimeZoneService.validateTimeZone(timeZone);
      
      // Convert dates to ISO strings
      const startTimeStr = typeof startTime === 'string' 
        ? startTime 
        : startTime.toISOString();
      
      const endTimeStr = typeof endTime === 'string' 
        ? endTime 
        : endTime.toISOString();
      
      // Get availability blocks for the time range
      const availabilityBlocks = await this.getAvailability(
        clinicianId,
        validTimeZone,
        new Date(startTimeStr),
        new Date(endTimeStr)
      );
      
      // Check if there's at least one block that covers the entire time slot
      return availabilityBlocks.some(block => {
        const blockStart = new Date(block.start_time);
        const blockEnd = new Date(block.end_time);
        
        return blockStart <= new Date(startTimeStr) && blockEnd >= new Date(endTimeStr);
      });
    } catch (error) {
      if (error instanceof CalendarError) {
        throw error;
      }
      throw new CalendarError(
        'Failed to check if time slot is available',
        'CALENDAR_UNKNOWN_ERROR',
        { 
          clinicianId, 
          startTime, 
          endTime, 
          timeZone, 
          originalError: error 
        }
      );
    }
  }
}