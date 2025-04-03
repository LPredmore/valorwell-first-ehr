
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ExceptionCheckResult {
  exists: boolean;
  data: any | null;
}

/**
 * Checks if an exception already exists for a specific date and availability
 */
export const checkExistingException = async (
  specificDateStr: string,
  clinicianId: string | null,
  originalAvailabilityId: string | null = null
): Promise<ExceptionCheckResult> => {
  if (!clinicianId) return { exists: false, data: null };
  
  try {
    console.log('Checking for existing exception:', {
      specificDate: specificDateStr,
      clinicianId,
      originalAvailabilityId
    });
    
    let query = supabase
      .from('availability_exceptions')
      .select('*')
      .eq('clinician_id', clinicianId)
      .eq('specific_date', specificDateStr);
    
    if (originalAvailabilityId) {
      query = query.eq('original_availability_id', originalAvailabilityId);
    } else {
      query = query.is('original_availability_id', null);
    }
    
    const { data, error } = await query.maybeSingle();
    
    if (error && error.code !== 'PGRST116') throw error;
    
    console.log('Exception check result:', { exists: !!data, data });
    return { exists: !!data, data };
  } catch (error) {
    console.error('Error checking for existing exception:', error);
    return { exists: false, data: null };
  }
};

/**
 * Updates an existing exception
 */
export const updateException = async (
  exceptionId: string,
  startTime: string,
  endTime: string,
  isDeleted: boolean = false
) => {
  try {
    console.log('Updating exception:', {
      exceptionId,
      startTime,
      endTime,
      isDeleted
    });
    
    // If we're adding times to what was previously a deleted exception,
    // make sure to set is_deleted to false
    const updateData = {
      start_time: isDeleted ? null : `${startTime}:00`,
      end_time: isDeleted ? null : `${endTime}:00`,
      is_deleted: isDeleted
    };
    
    console.log('Exception update data:', updateData);
    
    const { error } = await supabase
      .from('availability_exceptions')
      .update(updateData)
      .eq('id', exceptionId);
      
    if (error) throw error;
    
    console.log('Exception updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating exception:', error);
    throw error;
  }
};

/**
 * Creates a new exception
 */
export const createException = async (
  clinicianId: string,
  specificDateStr: string,
  originalAvailabilityId: string | null,
  startTime: string | null,
  endTime: string | null,
  isDeleted: boolean = false
) => {
  try {
    console.log('Creating new exception:', {
      clinicianId,
      specificDateStr,
      originalAvailabilityId,
      startTime,
      endTime,
      isDeleted
    });
    
    const { error } = await supabase
      .from('availability_exceptions')
      .insert({
        clinician_id: clinicianId,
        specific_date: specificDateStr,
        original_availability_id: originalAvailabilityId,
        start_time: isDeleted ? null : startTime ? `${startTime}:00` : null,
        end_time: isDeleted ? null : endTime ? `${endTime}:00` : null,
        is_deleted: isDeleted
      });
      
    if (error) throw error;
    
    console.log('Exception created successfully');
    return true;
  } catch (error) {
    console.error('Error creating exception:', error);
    throw error;
  }
};

/**
 * Updates a recurring availability series
 */
export const updateRecurringSeries = async (
  availabilityId: string,
  startTime: string,
  endTime: string
) => {
  try {
    console.log('Updating recurring series:', {
      availabilityId,
      startTime,
      endTime
    });
    
    const { error } = await supabase
      .from('availability')
      .update({
        start_time: `${startTime}:00`,
        end_time: `${endTime}:00`
      })
      .eq('id', availabilityId);
      
    if (error) throw error;
    
    console.log('Recurring series updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating recurring series:', error);
    throw error;
  }
};

/**
 * Sets a recurring series as inactive (soft delete)
 */
export const deactivateRecurringSeries = async (availabilityId: string) => {
  try {
    console.log('Deactivating recurring series:', availabilityId);
    
    const { error } = await supabase
      .from('availability')
      .update({ is_active: false })
      .eq('id', availabilityId);
      
    if (error) throw error;
    
    console.log('Recurring series deactivated successfully');
    return true;
  } catch (error) {
    console.error('Error deactivating recurring series:', error);
    throw error;
  }
};
