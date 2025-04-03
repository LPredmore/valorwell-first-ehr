
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { generateTimeOptions, TimeOption } from './utils';
import { toast } from '@/hooks/use-toast';

export const useAvailabilityEdit = (
  isOpen: boolean,
  onClose: () => void,
  availabilityBlock: any,
  specificDate: Date | null,
  clinicianId: string | null,
  onAvailabilityUpdated: () => void
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [timeOptions, setTimeOptions] = useState<TimeOption[]>([]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [isException, setIsException] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [editOption, setEditOption] = useState<'single' | 'series'>('single');

  useEffect(() => {
    if (isOpen && availabilityBlock && specificDate) {
      // Determine the type of availability block
      setIsRecurring(!availabilityBlock.isStandalone);
      setIsException(!!availabilityBlock.isException);
      setIsStandalone(!!availabilityBlock.isStandalone);
      
      // Set initial times from the block
      if (availabilityBlock.start_time) {
        setStartTime(availabilityBlock.start_time.slice(0, 5));
      } else if (availabilityBlock.start) {
        setStartTime(format(availabilityBlock.start, 'HH:mm'));
      }
      
      if (availabilityBlock.end_time) {
        setEndTime(availabilityBlock.end_time.slice(0, 5));
      } else if (availabilityBlock.end) {
        setEndTime(format(availabilityBlock.end, 'HH:mm'));
      }
      
      // Generate time options in 15-minute increments
      setTimeOptions(generateTimeOptions());
    }
  }, [isOpen, availabilityBlock, specificDate]);

  const handleSaveClick = async () => {
    if (!specificDate || !clinicianId) {
      toast({
        title: "Error",
        description: "Missing required information",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    const specificDateStr = format(specificDate, 'yyyy-MM-dd');
    
    try {
      // Handling based on availability type and edit option
      if (isRecurring && !isException && editOption === 'single') {
        // Create an exception to the recurring availability
        const { data, error } = await supabase
          .from('availability_exceptions')
          .insert({
            clinician_id: clinicianId,
            specific_date: specificDateStr,
            original_availability_id: availabilityBlock.id,
            start_time: `${startTime}:00`,
            end_time: `${endTime}:00`,
            is_deleted: false
          });
          
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Availability updated for this date only"
        });
      } else if (isRecurring && !isException && editOption === 'series') {
        // Update the recurring availability pattern
        const { data, error } = await supabase
          .from('availability')
          .update({
            start_time: `${startTime}:00`,
            end_time: `${endTime}:00`
          })
          .eq('id', availabilityBlock.id);
          
        if (error) throw error;
        
        // Clean up any future exceptions that might conflict
        const { error: cleanupError } = await supabase
          .from('availability_exceptions')
          .delete()
          .eq('original_availability_id', availabilityBlock.id)
          .gte('specific_date', specificDateStr);
        
        if (cleanupError) console.error("Error cleaning up exceptions:", cleanupError);
        
        toast({
          title: "Success",
          description: "Recurring availability pattern updated"
        });
      } else if (isException) {
        // Update an existing exception
        const { data, error } = await supabase
          .from('availability_exceptions')
          .update({
            start_time: `${startTime}:00`,
            end_time: `${endTime}:00`,
            is_deleted: false
          })
          .eq('id', availabilityBlock.id);
          
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Availability exception updated"
        });
      } else if (isStandalone) {
        // Update a standalone one-time availability
        const { data, error } = await supabase
          .from('availability_exceptions')
          .update({
            start_time: `${startTime}:00`,
            end_time: `${endTime}:00`,
            is_deleted: false
          })
          .eq('id', availabilityBlock.id);
          
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "One-time availability updated"
        });
      } else {
        // Create a new one-time availability
        const { data, error } = await supabase
          .from('availability_exceptions')
          .insert({
            clinician_id: clinicianId,
            specific_date: specificDateStr,
            original_availability_id: null,
            start_time: `${startTime}:00`,
            end_time: `${endTime}:00`,
            is_deleted: false
          });
          
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "New one-time availability created"
        });
      }
      
      onAvailabilityUpdated();
      onClose();
    } catch (error) {
      console.error('Error saving availability:', error);
      toast({
        title: "Error",
        description: "Failed to update availability",
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
    if (!specificDate || !clinicianId) return;
    
    setIsLoading(true);
    const specificDateStr = format(specificDate, 'yyyy-MM-dd');
    
    try {
      if (isRecurring && !isException && editOption === 'single') {
        // Create a deletion exception for the recurring availability
        const { data, error } = await supabase
          .from('availability_exceptions')
          .insert({
            clinician_id: clinicianId,
            specific_date: specificDateStr,
            original_availability_id: availabilityBlock.id,
            start_time: null,
            end_time: null,
            is_deleted: true
          });
          
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Availability canceled for this date only"
        });
      } else if (isRecurring && !isException && editOption === 'series') {
        // Delete the entire recurring availability pattern
        const { data, error } = await supabase
          .from('availability')
          .update({ is_active: false })
          .eq('id', availabilityBlock.id);
          
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Recurring availability pattern has been canceled"
        });
      } else if (isException || isStandalone) {
        // Delete the exception or standalone availability
        const { data, error } = await supabase
          .from('availability_exceptions')
          .update({ is_deleted: true })
          .eq('id', availabilityBlock.id);
          
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Availability has been canceled"
        });
      }
      
      onAvailabilityUpdated();
      setIsDeleteDialogOpen(false);
      onClose();
    } catch (error) {
      console.error('Error deleting availability:', error);
      toast({
        title: "Error",
        description: "Failed to cancel availability",
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
    confirmDelete,
    isRecurring,
    isException,
    isStandalone,
    editOption,
    setEditOption
  };
};
