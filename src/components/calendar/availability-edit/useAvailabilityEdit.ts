
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AvailabilityBlock } from './types';
import { generateTimeOptions } from './utils';

export const useAvailabilityEdit = (
isOpen: boolean,
onClose: () => void,
availabilityBlock: AvailabilityBlock | null,
specificDate: Date | null,
clinicianId: string | null,
onAvailabilityUpdated: () => void
) => {
const [isLoading, setIsLoading] = useState(false);
const [startTime, setStartTime] = useState('09:00');
const [endTime, setEndTime] = useState('17:00');
const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
const { toast } = useToast();
const timeOptions = generateTimeOptions();

// Initialize state when props change
useEffect(() => {
  try {
    if (!availabilityBlock || !isOpen) {
      console.log('No availability block or dialog not open, skipping initialization');
      return;
    }

    console.log('Initializing availability edit with data:', {
      availabilityBlockId: availabilityBlock.id,
      isException: availabilityBlock.isException,
      isStandalone: availabilityBlock.isStandalone,
      originalAvailabilityId: availabilityBlock.originalAvailabilityId,
      specificDate: specificDate ? format(specificDate, 'yyyy-MM-dd') : 'null',
      clinicianId,
      block_start_time: availabilityBlock.start_time,
      block_end_time: availabilityBlock.end_time,
    });

    // Safely extract time values with proper validation
    let formattedStartTime = '09:00';
    let formattedEndTime = '17:00';
    
    if (availabilityBlock.start_time) {
      // Handle both Date objects and strings
      if (typeof availabilityBlock.start_time === 'string') {
        // Extract HH:MM from any string format (HH:MM or HH:MM:SS)
        formattedStartTime = availabilityBlock.start_time.split(':').slice(0, 2).join(':');
      }
    }
    
    if (availabilityBlock.end_time) {
      // Handle both Date objects and strings
      if (typeof availabilityBlock.end_time === 'string') {
        // Extract HH:MM from any string format (HH:MM or HH:MM:SS)
        formattedEndTime = availabilityBlock.end_time.split(':').slice(0, 2).join(':');
      }
    }

    console.log('Setting times from availability block:', {
      original: { 
        start: availabilityBlock.start_time, 
        end: availabilityBlock.end_time 
      },
      formatted: { 
        start: formattedStartTime, 
        end: formattedEndTime 
      }
    });

    setStartTime(formattedStartTime);
    setEndTime(formattedEndTime);
  } catch (error) {
    console.error('Error initializing availability edit:', error);
    toast({
      title: "Initialization Error",
      description: "Failed to initialize edit form. Please try again.",
      variant: "destructive"
    });
  }
}, [availabilityBlock, isOpen, toast]);

// Helper function to find existing exception - centralizes the logic
const findExistingException = async (blockId: string, isException: boolean, isStandalone: boolean, formattedDate: string) => {
  try {
    console.log('Finding existing exception with params:', {
      blockId,
      isException,
      isStandalone,
      formattedDate,
      clinicianId
    });
    
    if (!clinicianId) {
      console.error('Cannot find exception: Missing clinician ID');
      return { data: null, error: new Error('Missing clinician ID') };
    }
    
    // For standalone exceptions or existing exceptions - find directly by ID
    if (isException) {
      console.log('Looking up existing exception by ID:', blockId);
      const result = await supabase
        .from('availability_exceptions')
        .select('id, original_availability_id, is_deleted')
        .eq('id', blockId)
        .maybeSingle();
        
      console.log('Exception lookup by ID result:', result);
      return result;
    }
    
    // For regular availability slots - find by original_availability_id
    console.log('Looking up exception by original_availability_id:', blockId);
    const result = await supabase
      .from('availability_exceptions')
      .select('id, original_availability_id, is_deleted')
      .eq('clinician_id', clinicianId)
      .eq('specific_date', formattedDate)
      .eq('original_availability_id', blockId)
      .maybeSingle();
      
    console.log('Exception lookup by original_availability_id result:', result);
    return result;
  } catch (error) {
    console.error('Error finding existing exception:', error);
    return { data: null, error };
  }
};

const handleSaveClick = async () => {
  // Validate all required inputs
  if (!clinicianId) {
    console.error('Save failed: Missing clinician ID');
    toast({
      title: "Missing Information",
      description: "Unable to save availability exception. No clinician ID provided.",
      variant: "destructive"
    });
    return;
  }

  if (!specificDate) {
    console.error('Save failed: Missing specific date');
    toast({
      title: "Missing Information",
      description: "Unable to save availability exception. No date selected.",
      variant: "destructive"
    });
    return;
  }

  if (!availabilityBlock) {
    console.error('Save failed: Missing availability block data');
    toast({
      title: "Missing Information",
      description: "Unable to save availability exception. Missing required data.",
      variant: "destructive"
    });
    return;
  }

  // Input validation for times
  if (!startTime || !endTime) {
    console.error('Save failed: Missing start or end time', { startTime, endTime });
    toast({
      title: "Missing Information",
      description: "Please select both start and end times.",
      variant: "destructive"
    });
    return;
  }

  setIsLoading(true);

  try {
    const formattedDate = format(specificDate, 'yyyy-MM-dd');
    const isException = !!availabilityBlock.isException;
    const isStandalone = !!availabilityBlock.isStandalone;
    // For regular availability, use the block ID
    // For exceptions, check if we have originalAvailabilityId, otherwise use block ID
    const referenceId = isException && availabilityBlock.originalAvailabilityId ? 
                         availabilityBlock.originalAvailabilityId : 
                         availabilityBlock.id;

    console.log('Saving availability exception:', {
      clinicianId,
      specificDate: formattedDate,
      blockId: availabilityBlock.id,
      referenceId,
      isException,
      isStandalone,
      originalAvailabilityId: availabilityBlock.originalAvailabilityId,
      startTime,
      endTime
    });

    // Use our helper function to find existing exception
    const { data: existingException, error: checkError } = 
      await findExistingException(referenceId, isException, isStandalone, formattedDate);

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is 'not found' error
      console.error('Error checking for existing exception:', checkError);
      throw checkError;
    }

    let updateResult;

    if (existingException) {
      // Update existing exception
      console.log('Updating existing exception:', existingException.id);
      updateResult = await supabase
        .from('availability_exceptions')
        .update({
          start_time: startTime,
          end_time: endTime,
          is_deleted: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingException.id);

      if (updateResult.error) {
        console.error('Error updating exception:', updateResult.error);
        throw updateResult.error;
      }

      console.log('Successfully updated exception:', existingException.id);
    } else {
      // Create new exception
      console.log('Creating new exception');
      const insertData: any = {
        clinician_id: clinicianId,
        specific_date: formattedDate,
        start_time: startTime,
        end_time: endTime,
        is_deleted: false
      };

      // Handle different exception types
      if (isException && isStandalone) {
        // For standalone exceptions, don't set original_availability_id
        console.log('This is a standalone exception, not setting original_availability_id');
      } else if (isException) {
        // For existing exceptions, use the originalAvailabilityId if available
        if (availabilityBlock.originalAvailabilityId) {
          insertData.original_availability_id = availabilityBlock.originalAvailabilityId;
          console.log('Setting original_availability_id for exception:', 
            availabilityBlock.originalAvailabilityId);
        }
      } else {
        // For regular availability
        insertData.original_availability_id = availabilityBlock.id;
        console.log('Adding original_availability_id reference for regular availability:', 
          availabilityBlock.id);
      }

      console.log('Inserting new exception with data:', insertData);
      
      updateResult = await supabase
        .from('availability_exceptions')
        .insert(insertData);

      if (updateResult.error) {
        console.error('Error inserting exception:', updateResult.error);
        throw updateResult.error;
      }

      console.log('Successfully created new exception');
    }

    // Wait a brief moment to ensure the database transaction completes
    await new Promise(resolve => setTimeout(resolve, 300));

    // Only show success toast if no errors
    toast({
      title: "Success",
      description: `Availability for ${format(specificDate, 'PPP')} has been updated.`,
    });

    // Explicitly call onAvailabilityUpdated to refresh the calendar view
    onAvailabilityUpdated();
    onClose();
  } catch (error: any) {
    console.error('Error updating availability exception:', error);
    
    // More descriptive error messages based on error type
    let errorMessage = "Failed to update availability. Please try again.";
    
    if (error?.code === '23505') {
      errorMessage = "A conflicting availability record already exists for this date.";
    } else if (error?.code === '23503') {
      errorMessage = "Cannot create exception: referenced availability no longer exists.";
    } else if (error?.message) {
      errorMessage = `Database error: ${error.message}`;
    }
    
    toast({
      title: "Error",
      description: errorMessage,
      variant: "destructive"
    });
  } finally {
    setIsLoading(false);
  }
};

const handleDeleteClick = () => {
  if (!availabilityBlock) {
    console.error('Delete failed: Missing availability block data');
    toast({
      title: "Error",
      description: "Cannot cancel availability. Missing data.",
      variant: "destructive"
    });
    return;
  }
  
  console.log('Opening delete confirmation dialog for:', {
    availabilityBlockId: availabilityBlock.id,
    isException: !!availabilityBlock.isException,
    isStandalone: !!availabilityBlock.isStandalone,
    originalAvailabilityId: availabilityBlock.originalAvailabilityId,
    specificDate: specificDate ? format(specificDate, 'yyyy-MM-dd') : 'null'
  });
  
  setIsDeleteDialogOpen(true);
};

const confirmDelete = async () => {
  // Validate all required inputs
  if (!clinicianId) {
    console.error('Delete failed: Missing clinician ID');
    toast({
      title: "Missing Information",
      description: "Unable to delete availability. No clinician ID provided.",
      variant: "destructive"
    });
    return;
  }

  if (!specificDate) {
    console.error('Delete failed: Missing specific date');
    toast({
      title: "Missing Information",
      description: "Unable to delete availability. No date selected.",
      variant: "destructive"
    });
    return;
  }

  if (!availabilityBlock) {
    console.error('Delete failed: Missing availability block data');
    toast({
      title: "Missing Information",
      description: "Unable to delete availability. Missing required data.",
      variant: "destructive"
    });
    return;
  }

  setIsLoading(true);

  try {
    const formattedDate = format(specificDate, 'yyyy-MM-dd');
    const isException = !!availabilityBlock.isException;
    const isStandalone = !!availabilityBlock.isStandalone;
    const referenceId = isException && availabilityBlock.originalAvailabilityId ? 
                         availabilityBlock.originalAvailabilityId : 
                         availabilityBlock.id;

    console.log('Cancelling availability:', {
      clinicianId,
      specificDate: formattedDate,
      blockId: availabilityBlock.id,
      referenceId,
      isException,
      isStandalone,
      originalAvailabilityId: availabilityBlock.originalAvailabilityId
    });

    // Use our helper function to find existing exception
    const { data: existingException, error: checkError } = 
      await findExistingException(referenceId, isException, isStandalone, formattedDate);

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is 'not found' error
      console.error('Error checking for existing exception for deletion:', checkError);
      throw checkError;
    }

    let updateResult;

    if (existingException) {
      // Update existing exception to mark as deleted
      console.log('Updating existing exception to deleted:', existingException.id);
      updateResult = await supabase
        .from('availability_exceptions')
        .update({
          is_deleted: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingException.id);

      if (updateResult.error) {
        console.error('Error updating exception to deleted:', updateResult.error);
        throw updateResult.error;
      }

      console.log('Successfully marked exception as deleted');
    } else {
      // Create new exception marked as deleted
      const insertData: any = {
        clinician_id: clinicianId,
        specific_date: formattedDate,
        is_deleted: true
      };

      // Handle different exception types
      if (isException && isStandalone) {
        // For standalone exceptions, don't set original_availability_id
        console.log('This is a standalone exception, not setting original_availability_id for deletion');
      } else if (isException) {
        // For existing exceptions, use the originalAvailabilityId if available
        if (availabilityBlock.originalAvailabilityId) {
          insertData.original_availability_id = availabilityBlock.originalAvailabilityId;
          console.log('Setting original_availability_id for exception deletion:', 
            availabilityBlock.originalAvailabilityId);
        }
      } else {
        // For regular availability
        insertData.original_availability_id = availabilityBlock.id;
        console.log('Adding original_availability_id reference for deletion:', availabilityBlock.id);
      }

      console.log('Creating new deleted exception with data:', insertData);
      updateResult = await supabase
        .from('availability_exceptions')
        .insert(insertData);

      if (updateResult.error) {
        console.error('Error inserting deleted exception:', updateResult.error);
        throw updateResult.error;
      }

      console.log('Successfully created new deleted exception');
    }

    // Wait a brief moment to ensure the database transaction completes
    await new Promise(resolve => setTimeout(resolve, 300));

    toast({
      title: "Success",
      description: `Availability for ${format(specificDate, 'PPP')} has been cancelled.`,
    });

    // Explicitly refresh the parent component
    setIsDeleteDialogOpen(false);
    onAvailabilityUpdated();
    onClose();
  } catch (error: any) {
    console.error('Error cancelling availability:', error);
    
    // More descriptive error messages based on error type
    let errorMessage = "Failed to cancel availability. Please try again.";
    
    if (error?.code === '23503') {
      errorMessage = "Cannot cancel: referenced availability no longer exists.";
    } else if (error?.message) {
      errorMessage = `Database error: ${error.message}`;
    }
    
    toast({
      title: "Error",
      description: errorMessage,
      variant: "destructive"
    });
  } finally {
    setIsLoading(false);
  }
};

return {
  isLoading,
  startTime,
  setStartTime,
  endTime,
  setEndTime,
  isDeleteDialogOpen,
  setIsDeleteDialogOpen,
  timeOptions,
  handleSaveClick,
  handleDeleteClick,
  confirmDelete
};
};
