
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface AvailabilityBlock {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  clinician_id?: string;
  is_active?: boolean;
  isException?: boolean;
}

interface AvailabilityEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  availabilityBlock: AvailabilityBlock | null;
  specificDate: Date | null;
  clinicianId: string | null;
  onAvailabilityUpdated: () => void;
}

const AvailabilityEditDialog: React.FC<AvailabilityEditDialogProps> = ({
  isOpen,
  onClose,
  availabilityBlock,
  specificDate,
  clinicianId,
  onAvailabilityUpdated
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  // Generate time options for the select dropdown
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const formattedHour = hour.toString().padStart(2, '0');
        const formattedMinute = minute.toString().padStart(2, '0');
        options.push(`${formattedHour}:${formattedMinute}`);
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  // Initialize state when props change
  useEffect(() => {
    if (availabilityBlock && isOpen) {
      // Format the times from "HH:MM:SS" format to "HH:MM" format if needed
      const formattedStartTime = availabilityBlock.start_time.substring(0, 5);
      const formattedEndTime = availabilityBlock.end_time.substring(0, 5);
      
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
        endTime
      });
      
      // Check if an exception already exists for this day and availability block
      const { data: existingException, error: checkError } = await supabase
        .from('availability_exceptions')
        .select('id')
        .eq('clinician_id', clinicianId)
        .eq('specific_date', formattedDate)
        .eq('original_availability_id', availabilityBlock.id)
        .maybeSingle();
        
      console.log('Existing exception check result:', { existingException, error: checkError });
      
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
          console.error('Error updating exception:', updateError);
          throw updateError;
        }
      } else {
        // Create new exception
        console.log('Creating new exception');
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
          console.error('Error inserting exception:', insertError);
          throw insertError;
        }
      }
      
      toast({
        title: "Success",
        description: `Availability for ${format(specificDate, 'PPP')} has been updated.`,
      });
      
      onClose();
      onAvailabilityUpdated();
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

  const handleDeleteClick = async () => {
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
      
      // Check if an exception already exists
      const { data: existingException, error: checkError } = await supabase
        .from('availability_exceptions')
        .select('id, original_availability_id')
        .eq('clinician_id', clinicianId)
        .eq('specific_date', formattedDate)
        .eq('original_availability_id', availabilityBlock.id)
        .maybeSingle();
        
      console.log('Existing exception check for delete:', { existingException, error: checkError });
      
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
          console.error('Error updating exception to deleted:', updateError);
          throw updateError;
        }
      } else {
        // Create new exception marked as deleted
        // For availability blocks that are already exceptions, use null for original_availability_id
        const insertData = {
          clinician_id: clinicianId,
          specific_date: formattedDate,
          is_deleted: true
        };

        // Only add original_availability_id if it references a valid entry in the availability table
        // If it's an exception, don't include the original_availability_id field
        if (!availabilityBlock.isException) {
          // @ts-ignore - TypeScript doesn't know we're conditionally adding a field
          insertData.original_availability_id = availabilityBlock.id;
        }
        
        console.log('Creating new deleted exception with data:', insertData);
        const { error: insertError } = await supabase
          .from('availability_exceptions')
          .insert(insertData);
          
        if (insertError) {
          console.error('Error inserting deleted exception:', insertError);
          throw insertError;
        }
      }
      
      toast({
        title: "Success",
        description: `Availability for ${format(specificDate, 'PPP')} has been cancelled.`,
      });
      
      setIsDeleteDialogOpen(false);
      onClose();
      onAvailabilityUpdated();
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

  if (!availabilityBlock || !specificDate) {
    return null;
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Availability for {format(specificDate, 'EEEE, MMMM d, yyyy')}</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Select value={startTime} onValueChange={setStartTime}>
                <SelectTrigger id="startTime">
                  <SelectValue placeholder="Select start time" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((time) => (
                    <SelectItem key={`start-${time}`} value={time}>
                      {format(new Date(`2023-01-01T${time}`), 'h:mm a')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="endTime">End Time</Label>
              <Select value={endTime} onValueChange={setEndTime}>
                <SelectTrigger id="endTime">
                  <SelectValue placeholder="Select end time" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((time) => (
                    <SelectItem key={`end-${time}`} value={time}>
                      {format(new Date(`2023-01-01T${time}`), 'h:mm a')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="mt-2 p-3 bg-blue-50 text-sm rounded-md border border-blue-100">
              <div className="font-medium text-blue-700 mb-1">One-time Change</div>
              <p className="text-blue-600">
                This will only modify your availability for {format(specificDate, 'MMMM d, yyyy')}. 
                Your regular weekly schedule will remain unchanged.
              </p>
            </div>
          </div>
          
          <DialogFooter className="flex justify-between">
            <Button variant="destructive" onClick={handleDeleteClick} disabled={isLoading}>
              Cancel Availability
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} disabled={isLoading}>
                Close
              </Button>
              <Button type="button" onClick={handleSaveClick} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Availability</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel your availability for {specificDate && format(specificDate, 'EEEE, MMMM d, yyyy')}?
              This will not affect your regular weekly schedule.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {isLoading ? "Processing..." : "Yes, Cancel Availability"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AvailabilityEditDialog;
