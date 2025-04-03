
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
      console.log('Availability block received in hook:', availabilityBlock);
      
      // Ensure we have valid time strings before trying to format them
      if (typeof availabilityBlock.start_time === 'string' && availabilityBlock.start_time.length >= 5) {
        const formattedStartTime = availabilityBlock.start_time.substring(0, 5);
        setStartTime(formattedStartTime);
      } else {
        console.warn('Invalid start_time format, using default:', availabilityBlock.start_time);
        setStartTime('09:00');
      }
      
      if (typeof availabilityBlock.end_time === 'string' && availabilityBlock.end_time.length >= 5) {
        const formattedEndTime = availabilityBlock.end_time.substring(0, 5);
        setEndTime(formattedEndTime);
      } else {
        console.warn('Invalid end_time format, using default:', availabilityBlock.end_time);
        setEndTime('17:00');
      }
    }
  }, [availabilityBlock, isOpen]);

  const handleSaveClick = async () => {
    if (!clinicianId || !specificDate) {
      toast({
        title: "Missing Information",
        description: "Unable to save availability exception. Missing clinician ID or date.",
        variant: "destructive"
      });
      return;
    }
    
    if (!availabilityBlock || !availabilityBlock.id) {
      toast({
        title: "Missing Information",
        description: "Unable to save availability exception. Invalid availability data.",
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
        originalAvailabilityId: availabilityBlock.id,
        startTime,
        endTime,
        isException: availabilityBlock.isException
      });

      let existingException = null;
      let checkError = null;

      // If it's not already an exception, check if an exception exists
      if (!availabilityBlock.isException) {
        const result = await supabase
          .from('availability_exceptions')
          .select('id')
          .eq('clinician_id', clinicianId)
          .eq('specific_date', formattedDate)
          .eq('original_availability_id', availabilityBlock.id)
          .maybeSingle();

        existingException = result.data;
        checkError = result.error;

        console.log('Existing exception check result:', { existingException, error: checkError });
      } else {
        // For existing exceptions, just look for it by ID
        const result = await supabase
          .from('availability_exceptions')
          .select('id')
          .eq('id', availabilityBlock.id)
          .maybeSingle();

        existingException = result.data;
        checkError = result.error;

        console.log('Existing exception (by ID) check result:', { existingException, error: checkError });
      }

      if (checkError) {
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

        // Only add original_availability_id if this is modifying a regular availability
        if (!availabilityBlock.isException) {
          insertData.original_availability_id = availabilityBlock.id;
        }

        updateResult = await supabase
          .from('availability_exceptions')
          .insert(insertData);

        if (updateResult.error) {
          console.error('Error inserting exception:', updateResult.error);
          throw updateResult.error;
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
    if (!clinicianId || !specificDate) {
      toast({
        title: "Missing Information",
        description: "Unable to delete availability. Missing clinician ID or date.",
        variant: "destructive"
      });
      return;
    }
    
    if (!availabilityBlock || !availabilityBlock.id) {
      toast({
        title: "Missing Information",
        description: "Unable to delete availability. Invalid availability data.",
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
        originalAvailabilityId: availabilityBlock.id,
        isException: availabilityBlock.isException
      });

      let existingException = null;
      let checkError = null;

      // If it's not already an exception, check if an exception exists for the original availability
      if (!availabilityBlock.isException) {
        const result = await supabase
          .from('availability_exceptions')
          .select('id, original_availability_id')
          .eq('clinician_id', clinicianId)
          .eq('specific_date', formattedDate)
          .eq('original_availability_id', availabilityBlock.id)
          .maybeSingle();

        existingException = result.data;
        checkError = result.error;
      } else {
        // For existing exceptions, look it up by ID
        const result = await supabase
          .from('availability_exceptions')
          .select('id, original_availability_id')
          .eq('id', availabilityBlock.id)
          .maybeSingle();

        existingException = result.data;
        checkError = result.error;
      }

      console.log('Existing exception check for delete:', { existingException, error: checkError });

      if (checkError) {
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
      } else {
        // Create new exception marked as deleted
        const insertData: any = {
          clinician_id: clinicianId,
          specific_date: formattedDate,
          is_deleted: true
        };

        // Only add original_availability_id if it references a valid entry in the availability table
        if (!availabilityBlock.isException) {
          insertData.original_availability_id = availabilityBlock.id;
        }

        console.log('Creating new deleted exception with data:', insertData);
        updateResult = await supabase
          .from('availability_exceptions')
          .insert(insertData);

        if (updateResult.error) {
          console.error('Error inserting deleted exception:', updateResult.error);
          throw updateResult.error;
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
