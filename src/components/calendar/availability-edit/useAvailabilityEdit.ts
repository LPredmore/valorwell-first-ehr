
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { generateTimeOptions, TimeOption } from './utils';
import { toast } from 'sonner';

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
  const [isEditChoiceDialogOpen, setIsEditChoiceDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState<'single' | 'series'>('single');

  useEffect(() => {
    if (isOpen && availabilityBlock && specificDate) {
      console.log('Editing availability block:', availabilityBlock);
      
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

  const handleSaveClick = () => {
    if (isRecurring && !isException) {
      setIsEditChoiceDialogOpen(true);
    } else {
      saveChanges('single');
    }
  };

  const handleEditSingle = () => {
    setEditMode('single');
    setIsEditChoiceDialogOpen(false);
    saveChanges('single');
  };

  const handleEditSeries = () => {
    setEditMode('series');
    setIsEditChoiceDialogOpen(false);
    saveChanges('series');
  };

  // Helper function to check if an exception already exists
  const checkExistingException = async (specificDateStr: string, originalAvailabilityId: string | null = null) => {
    if (!clinicianId) return null;
    
    try {
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
      return data;
    } catch (error) {
      console.error('Error checking for existing exception:', error);
      return null;
    }
  };

  const saveChanges = async (mode: 'single' | 'series') => {
    if (!specificDate || !clinicianId) return;
    
    setIsLoading(true);
    const specificDateStr = format(specificDate, 'yyyy-MM-dd');
    
    try {
      if (mode === 'single') {
        if (isRecurring && !isException) {
          // Create or update an exception to the recurring availability
          console.log('Creating exception for recurring availability:', {
            clinicianId,
            specificDate: specificDateStr,
            originalAvailabilityId: availabilityBlock.id,
            startTime,
            endTime
          });
          
          // Check if an exception already exists
          const existingException = await checkExistingException(specificDateStr, availabilityBlock.id);
          
          if (existingException) {
            console.log('Updating existing exception:', existingException);
            // Update existing exception
            const { error } = await supabase
              .from('availability_exceptions')
              .update({
                start_time: `${startTime}:00`,
                end_time: `${endTime}:00`,
                is_deleted: false
              })
              .eq('id', existingException.id);
              
            if (error) throw error;
            toast.success("Updated existing modified availability");
          } else {
            console.log('Creating new exception');
            // Create new exception
            const { error } = await supabase
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
            toast.success("Availability updated for this occurrence only");
          }
        } else if (isException) {
          // Update an existing exception
          console.log('Updating existing exception:', {
            id: availabilityBlock.id,
            startTime,
            endTime
          });
          
          const { error } = await supabase
            .from('availability_exceptions')
            .update({
              start_time: `${startTime}:00`,
              end_time: `${endTime}:00`,
              is_deleted: false
            })
            .eq('id', availabilityBlock.id);
            
          if (error) throw error;
          toast.success("Modified availability updated");
        } else if (isStandalone) {
          // Update a standalone one-time availability
          console.log('Updating standalone availability:', {
            id: availabilityBlock.id,
            startTime,
            endTime
          });
          
          const { error } = await supabase
            .from('availability_exceptions')
            .update({
              start_time: `${startTime}:00`,
              end_time: `${endTime}:00`,
              is_deleted: false
            })
            .eq('id', availabilityBlock.id);
            
          if (error) throw error;
          toast.success("One-time availability updated");
        } else {
          // Create a new one-time availability
          console.log('Creating new one-time availability:', {
            clinicianId,
            specificDate: specificDateStr,
            startTime,
            endTime
          });
          
          // Check if a standalone availability already exists
          const existingAvailability = await checkExistingException(specificDateStr);
          
          if (existingAvailability) {
            // Update existing standalone availability
            const { error } = await supabase
              .from('availability_exceptions')
              .update({
                start_time: `${startTime}:00`,
                end_time: `${endTime}:00`,
                is_deleted: false
              })
              .eq('id', existingAvailability.id);
              
            if (error) throw error;
            toast.success("Existing one-time availability updated");
          } else {
            // Create new standalone availability
            const { error } = await supabase
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
            toast.success("New one-time availability created");
          }
        }
      } else if (mode === 'series' && isRecurring) {
        // Update the recurring series
        console.log('Updating recurring series:', {
          id: availabilityBlock.id,
          startTime,
          endTime
        });
        
        const { error } = await supabase
          .from('availability')
          .update({
            start_time: `${startTime}:00`,
            end_time: `${endTime}:00`
          })
          .eq('id', availabilityBlock.id);
          
        if (error) throw error;
        toast.success("All recurring availabilities updated");
      }
      
      onAvailabilityUpdated();
      onClose();
    } catch (error) {
      console.error('Error saving availability:', error);
      toast.error("Failed to update availability");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async (deleteMode: 'single' | 'series' = 'single') => {
    if (!specificDate || !clinicianId) return;
    
    setIsLoading(true);
    const specificDateStr = format(specificDate, 'yyyy-MM-dd');
    
    try {
      if (deleteMode === 'single') {
        // Handle single occurrence deletion
        if (isRecurring && !isException) {
          // Create a deletion exception for the recurring availability
          console.log('Creating deletion exception for recurring availability:', {
            clinicianId,
            specificDate: specificDateStr,
            originalAvailabilityId: availabilityBlock.id
          });
          
          // Check if an exception already exists
          const existingException = await checkExistingException(specificDateStr, availabilityBlock.id);
          
          if (existingException) {
            console.log('Updating existing exception to mark as deleted:', existingException);
            // Update existing exception to mark as deleted
            const { error } = await supabase
              .from('availability_exceptions')
              .update({
                start_time: null,
                end_time: null,
                is_deleted: true
              })
              .eq('id', existingException.id);
              
            if (error) throw error;
            toast.success("Availability cancelled for this occurrence only");
          } else {
            console.log('Creating new deletion exception');
            // Create new deletion exception
            const { error } = await supabase
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
            toast.success("Availability cancelled for this occurrence only");
          }
        } else if (isException || isStandalone) {
          // Delete the exception or standalone availability
          console.log('Deleting exception or standalone availability:', {
            id: availabilityBlock.id
          });
          
          const { error } = await supabase
            .from('availability_exceptions')
            .update({ is_deleted: true })
            .eq('id', availabilityBlock.id);
            
          if (error) throw error;
          
          if (isException) {
            toast.success("Modified availability cancelled");
          } else {
            toast.success("One-time availability cancelled");
          }
        }
      } else if (deleteMode === 'series' && isRecurring) {
        // Delete the entire recurring series
        console.log('Deleting entire recurring series:', {
          id: availabilityBlock.id
        });
        
        const { error } = await supabase
          .from('availability')
          .update({ is_active: false })
          .eq('id', availabilityBlock.id);
          
        if (error) throw error;
        toast.success("Recurring availability series cancelled");
      }
      
      onAvailabilityUpdated();
      setIsDeleteDialogOpen(false);
      onClose();
    } catch (error) {
      console.error('Error deleting availability:', error);
      toast.error("Failed to cancel availability");
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
    isEditChoiceDialogOpen,
    setIsEditChoiceDialogOpen,
    handleEditSingle,
    handleEditSeries
  };
};
