
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { generateTimeOptions, TimeOption } from './utils';

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

  const saveChanges = async (mode: 'single' | 'series') => {
    if (!specificDate || !clinicianId) return;
    
    setIsLoading(true);
    const specificDateStr = format(specificDate, 'yyyy-MM-dd');
    
    try {
      if (mode === 'single') {
        if (isRecurring && !isException) {
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
        }
      } else if (mode === 'series' && isRecurring) {
        // Update the recurring series
        const { data, error } = await supabase
          .from('availability')
          .update({
            start_time: `${startTime}:00`,
            end_time: `${endTime}:00`
          })
          .eq('id', availabilityBlock.id);
          
        if (error) throw error;
      }
      
      onAvailabilityUpdated();
      onClose();
    } catch (error) {
      console.error('Error saving availability:', error);
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
      if (isRecurring && !isException) {
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
      } else if (isException || isStandalone) {
        // Delete the exception or standalone availability
        const { data, error } = await supabase
          .from('availability_exceptions')
          .update({ is_deleted: true })
          .eq('id', availabilityBlock.id);
          
        if (error) throw error;
      }
      
      onAvailabilityUpdated();
      setIsDeleteDialogOpen(false);
      onClose();
    } catch (error) {
      console.error('Error deleting availability:', error);
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
