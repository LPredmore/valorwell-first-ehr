
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
    if (availabilityBlock && isOpen) {
      // Only try to access start_time and end_time if they exist
      if (availabilityBlock.start_time && availabilityBlock.end_time) {
        // Format the times from "HH:MM:SS" format to "HH:MM" format if needed
        const formattedStartTime = availabilityBlock.start_time.substring(0, 5);
        const formattedEndTime = availabilityBlock.end_time.substring(0, 5);
        
        console.log('Setting times from availability block:', {
          original: { start: availabilityBlock.start_time, end: availabilityBlock.end_time },
          formatted: { start: formattedStartTime, end: formattedEndTime }
        });
        
        setStartTime(formattedStartTime);
        setEndTime(formattedEndTime);
      } else {
        console.log('Availability block has undefined time values:', availabilityBlock);
        // Set default times if the values are undefined
        setStartTime('09:00');
        setEndTime('17:00');
      }
    }
  }, [availabilityBlock, isOpen]);

  const handleSaveClick = async () => {
    if (!clinicianId || !specificDate || !availabilityBlock) {
      toast({
        title: "Missing Information",
        description: "Unable to save availability exception. Missing required data.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const formattedDate = format(specificDate, 'yyyy-MM-dd');
      
      console.log('Saving availability exception:', {
        clinicianId,
        specificDate: formattedDate,
        availabilityBlockId: availabilityBlock.id,
        isException: availabilityBlock.isException,
        startTime,
        endTime
      });
      
      // First check if we're dealing with an existing exception or a regular availability
      if (availabilityBlock.isException) {
        // This is already an exception, we should update it directly by ID
        console.log('Updating existing exception with ID:', availabilityBlock.id);
        
        const { error } = await supabase
          .from('availability_exceptions')
          .update({
            start_time: startTime,
            end_time: endTime,
            is_deleted: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', availabilityBlock.id);
          
        if (error) {
          console.error('Error updating existing exception:', error);
          throw error;
        } else {
          console.log('Successfully updated existing exception');
        }
      } else {
        // This is a regular availability - check if an exception already exists
        console.log('Checking for existing exception for regular availability:', availabilityBlock.id);
        
        const { data: existingException, error: checkError } = await supabase
          .from('availability_exceptions')
          .select('id')
          .eq('clinician_id', clinicianId)
          .eq('specific_date', formattedDate)
          .eq('original_availability_id', availabilityBlock.id)
          .maybeSingle();
          
        if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is 'not found' error
          console.error('Error checking for existing exception:', checkError);
          throw checkError;
        }
        
        if (existingException) {
          // Update existing exception
          console.log('Updating existing exception for regular availability:', existingException.id);
          
          const { error: updateError } = await supabase
            .from('availability_exceptions')
            .update({
              start_time: startTime,
              end_time: endTime,
              is_deleted: false,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingException.id);
            
          if (updateError) {
            console.error('Error updating existing exception for regular availability:', updateError);
            throw updateError;
          } else {
            console.log('Successfully updated existing exception for regular availability');
          }
        } else {
          // Create new exception
          console.log('Creating new exception for regular availability:', availabilityBlock.id);
          
          const { error: insertError } = await supabase
            .from('availability_exceptions')
            .insert({
              clinician_id: clinicianId,
              specific_date: formattedDate,
              original_availability_id: availabilityBlock.id,
              start_time: startTime,
              end_time: endTime,
              is_deleted: false
            });
            
          if (insertError) {
            console.error('Error creating new exception:', insertError);
            throw insertError;
          } else {
            console.log('Successfully created new exception');
          }
        }
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
    } catch (error) {
      console.error('Error updating availability exception:', error);
      toast({
        title: "Error",
        description: "Failed to update availability. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!clinicianId || !specificDate || !availabilityBlock) {
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
      
      console.log('Cancelling availability:', {
        clinicianId,
        specificDate: formattedDate,
        availabilityBlockId: availabilityBlock.id,
        isException: availabilityBlock.isException
      });
      
      if (availabilityBlock.isException) {
        // For existing exceptions, we need to check if it's a standalone exception or not
        const { data: exception, error: fetchError } = await supabase
          .from('availability_exceptions')
          .select('id, original_availability_id')
          .eq('id', availabilityBlock.id)
          .single();
        
        if (fetchError) {
          console.error('Error fetching exception details:', fetchError);
          throw fetchError;
        }
        
        if (exception.original_availability_id) {
          // This is an exception for a regular availability - just mark it as deleted
          console.log('Marking exception as deleted:', availabilityBlock.id);
          
          const { error: updateError } = await supabase
            .from('availability_exceptions')
            .update({
              is_deleted: true,
              updated_at: new Date().toISOString()
            })
            .eq('id', availabilityBlock.id);
            
          if (updateError) {
            console.error('Error marking exception as deleted:', updateError);
            throw updateError;
          }
        } else {
          // This is a standalone exception - we can just delete it
          console.log('Deleting standalone exception:', availabilityBlock.id);
          
          const { error: deleteError } = await supabase
            .from('availability_exceptions')
            .delete()
            .eq('id', availabilityBlock.id);
            
          if (deleteError) {
            console.error('Error deleting standalone exception:', deleteError);
            throw deleteError;
          }
        }
      } else {
        // This is a regular availability - create a deleted exception
        console.log('Creating deleted exception for regular availability:', availabilityBlock.id);
        
        const { data: existingException, error: checkError } = await supabase
          .from('availability_exceptions')
          .select('id')
          .eq('clinician_id', clinicianId)
          .eq('specific_date', formattedDate)
          .eq('original_availability_id', availabilityBlock.id)
          .maybeSingle();
        
        if (checkError && checkError.code !== 'PGRST116') {
          console.error('Error checking for existing exception:', checkError);
          throw checkError;
        }
        
        if (existingException) {
          // Update existing exception to mark as deleted
          console.log('Marking existing exception as deleted:', existingException.id);
          
          const { error: updateError } = await supabase
            .from('availability_exceptions')
            .update({
              is_deleted: true,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingException.id);
            
          if (updateError) {
            console.error('Error marking existing exception as deleted:', updateError);
            throw updateError;
          }
        } else {
          // Create new deleted exception
          console.log('Creating new deleted exception');
          
          const { error: insertError } = await supabase
            .from('availability_exceptions')
            .insert({
              clinician_id: clinicianId,
              specific_date: formattedDate,
              original_availability_id: availabilityBlock.id,
              is_deleted: true
            });
            
          if (insertError) {
            console.error('Error creating new deleted exception:', insertError);
            throw insertError;
          }
        }
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
    } catch (error) {
      console.error('Error cancelling availability:', error);
      toast({
        title: "Error",
        description: "Failed to cancel availability. Please try again.",
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
