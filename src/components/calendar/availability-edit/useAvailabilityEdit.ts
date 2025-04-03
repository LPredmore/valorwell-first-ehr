
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
  const [isEditChoiceDialogOpen, setIsEditChoiceDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState<'single' | 'all' | null>(null);

  useEffect(() => {
    if (isOpen && availabilityBlock && specificDate) {
      // Determine the type of availability block
      setIsRecurring(!availabilityBlock.isStandalone);
      setIsException(!!availabilityBlock.isException);
      setIsStandalone(!!availabilityBlock.isStandalone);
      
      // Reset edit mode
      setEditMode(null);
      
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
      
      // If it's a recurring availability (not an exception or standalone), 
      // show the edit choice dialog first
      if (isRecurring && !isException && !isStandalone) {
        setIsEditChoiceDialogOpen(true);
      }
    }
  }, [isOpen, availabilityBlock, specificDate]);

  const handleEditChoice = (choice: 'single' | 'all') => {
    setEditMode(choice);
    setIsEditChoiceDialogOpen(false);
  };

  const handleSaveClick = async () => {
    if (!specificDate || !clinicianId) return;
    
    setIsLoading(true);
    const specificDateStr = format(specificDate, 'yyyy-MM-dd');
    
    try {
      // If no edit mode selected yet and it's recurring, show the choice dialog
      if (!editMode && isRecurring && !isException && !isStandalone) {
        setIsEditChoiceDialogOpen(true);
        setIsLoading(false);
        return;
      }
      
      // If editing a single occurrence of a recurring availability
      if ((editMode === 'single' || (!editMode && (isException || isStandalone))) && 
          isRecurring && !isException) {
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
          title: "Availability Updated",
          description: `Single occurrence for ${format(specificDate, 'MMM d, yyyy')} has been updated.`
        });
      } 
      // If editing all occurrences of a recurring availability
      else if (editMode === 'all' && isRecurring && !isException) {
        // Update the main recurring availability
        const { data, error } = await supabase
          .from('availability')
          .update({
            start_time: `${startTime}:00`,
            end_time: `${endTime}:00`,
          })
          .eq('id', availabilityBlock.id);
          
        if (error) throw error;
        
        toast({
          title: "Availability Updated",
          description: "All occurrences of this recurring availability have been updated."
        });
      } 
      // If editing an existing exception
      else if (isException) {
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
          title: "Availability Updated",
          description: `Exception for ${format(specificDate, 'MMM d, yyyy')} has been updated.`
        });
      } 
      // If editing a standalone one-time availability
      else if (isStandalone) {
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
          title: "Availability Updated",
          description: `One-time availability for ${format(specificDate, 'MMM d, yyyy')} has been updated.`
        });
      } 
      // If creating a new one-time availability
      else {
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
          title: "Availability Created",
          description: `New availability for ${format(specificDate, 'MMM d, yyyy')} has been created.`
        });
      }
      
      onAvailabilityUpdated();
      onClose();
    } catch (error) {
      console.error('Error saving availability:', error);
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
    if (!specificDate || !clinicianId) return;
    
    setIsLoading(true);
    const specificDateStr = format(specificDate, 'yyyy-MM-dd');
    
    try {
      // If deleting a single occurrence of a recurring availability
      if ((editMode === 'single' || (!editMode && (isException || isStandalone))) && 
          isRecurring && !isException) {
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
          title: "Availability Cancelled",
          description: `Availability for ${format(specificDate, 'MMM d, yyyy')} has been cancelled.`
        });
      } 
      // If deleting all occurrences of a recurring availability
      else if (editMode === 'all' && isRecurring && !isException) {
        // Delete the recurring availability pattern
        const { data, error } = await supabase
          .from('availability')
          .update({ is_active: false })
          .eq('id', availabilityBlock.id);
          
        if (error) throw error;
        
        toast({
          title: "Recurring Availability Cancelled",
          description: "All occurrences of this recurring availability have been cancelled."
        });
      } 
      // If deleting an exception or standalone availability
      else if (isException || isStandalone) {
        // Delete the exception or standalone availability
        const { data, error } = await supabase
          .from('availability_exceptions')
          .update({ is_deleted: true })
          .eq('id', availabilityBlock.id);
          
        if (error) throw error;
        
        toast({
          title: "Availability Cancelled",
          description: `Availability for ${format(specificDate, 'MMM d, yyyy')} has been cancelled.`
        });
      }
      
      onAvailabilityUpdated();
      setIsDeleteDialogOpen(false);
      onClose();
    } catch (error) {
      console.error('Error deleting availability:', error);
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
    confirmDelete,
    isRecurring,
    isException,
    isStandalone,
    isEditChoiceDialogOpen,
    setIsEditChoiceDialogOpen,
    handleEditChoice,
    editMode
  };
};
