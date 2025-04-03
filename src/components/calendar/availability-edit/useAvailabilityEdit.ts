
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
      // Format the times from "HH:MM:SS" format to "HH:MM" format if needed
      // Add null/undefined checks to prevent errors
      const formattedStartTime = availabilityBlock.start_time ? availabilityBlock.start_time.substring(0, 5) : '09:00';
      const formattedEndTime = availabilityBlock.end_time ? availabilityBlock.end_time.substring(0, 5) : '17:00';

      console.log('Setting times from availability block:', {
        original: { start: availabilityBlock.start_time, end: availabilityBlock.end_time },
        formatted: { start: formattedStartTime, end: formattedEndTime }
      });

      setStartTime(formattedStartTime);
      setEndTime(formattedEndTime);
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
        originalAvailabilityId: availabilityBlock.id,
        startTime,
        endTime,
        isException: availabilityBlock.isException
      });

      // For recurring availability (not an exception), we need to:
      // 1. Check if an exception already exists
      // 2. If it exists, update it; if not, create a new one
      if (!availabilityBlock.isException) {
        // Check if an exception already exists for this date and availability block
        const { data: existingException, error: checkError } = await supabase
          .from('availability_exceptions')
          .select('id, is_deleted')
          .eq('clinician_id', clinicianId)
          .eq('specific_date', formattedDate)
          .eq('original_availability_id', availabilityBlock.id)
          .maybeSingle();

        if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is 'not found' error
          throw checkError;
        }

        if (existingException) {
          // Update existing exception
          console.log('Updating existing exception:', existingException.id);
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
            throw updateError;
          }
        } else {
          // Create new exception
          console.log('Creating new exception for recurring availability');
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
            throw insertError;
          }
        }
      } else {
        // This is already a one-time availability or an exception
        console.log('Updating one-time availability exception');
        
        // If this is modifying an exception, update it
        if (availabilityBlock.id !== 'new') {
          const { error: updateError } = await supabase
            .from('availability_exceptions')
            .update({
              start_time: startTime,
              end_time: endTime,
              updated_at: new Date().toISOString()
            })
            .eq('id', availabilityBlock.id);

          if (updateError) {
            throw updateError;
          }
        } else {
          // This is a new one-time availability (no original_availability_id)
          console.log('Creating brand new one-time availability');
          const { error: insertError } = await supabase
            .from('availability_exceptions')
            .insert({
              clinician_id: clinicianId,
              specific_date: formattedDate,
              start_time: startTime,
              end_time: endTime,
              is_deleted: false
            });

          if (insertError) {
            throw insertError;
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
        originalAvailabilityId: availabilityBlock.id,
        isException: availabilityBlock.isException
      });

      if (!availabilityBlock.isException) {
        // This is a recurring availability, so we need to create a "deletion" exception
        const { data: existingException, error: checkError } = await supabase
          .from('availability_exceptions')
          .select('id')
          .eq('clinician_id', clinicianId)
          .eq('specific_date', formattedDate)
          .eq('original_availability_id', availabilityBlock.id)
          .maybeSingle();

        if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is 'not found' error
          throw checkError;
        }

        if (existingException) {
          // Update existing exception to mark as deleted
          console.log('Updating existing exception to deleted:', existingException.id);
          const { error: updateError } = await supabase
            .from('availability_exceptions')
            .update({
              is_deleted: true,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingException.id);

          if (updateError) {
            throw updateError;
          }
        } else {
          // Create new exception marked as deleted
          console.log('Creating new exception for cancellation');
          const { error: insertError } = await supabase
            .from('availability_exceptions')
            .insert({
              clinician_id: clinicianId,
              specific_date: formattedDate,
              original_availability_id: availabilityBlock.id,
              is_deleted: true
            });

          if (insertError) {
            throw insertError;
          }
        }
      } else {
        // This is a one-time availability, so we can either delete it or mark it as deleted
        console.log('Deleting one-time availability exception');
        
        // If this is an existing exception, mark it as deleted
        if (availabilityBlock.id !== 'new') {
          const { error: updateError } = await supabase
            .from('availability_exceptions')
            .update({
              is_deleted: true,
              updated_at: new Date().toISOString()
            })
            .eq('id', availabilityBlock.id);

          if (updateError) {
            throw updateError;
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
