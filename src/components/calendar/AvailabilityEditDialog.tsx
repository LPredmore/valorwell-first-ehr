
import React, { useState } from 'react';
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
  const [startTime, setStartTime] = useState(availabilityBlock?.start_time || '09:00');
  const [endTime, setEndTime] = useState(availabilityBlock?.end_time || '17:00');
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

  // Update state when props change
  React.useEffect(() => {
    if (availabilityBlock) {
      setStartTime(availabilityBlock.start_time);
      setEndTime(availabilityBlock.end_time);
    }
  }, [availabilityBlock]);

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
      
      // Check if an exception already exists for this day and availability block
      const { data: existingException, error: checkError } = await supabase
        .from('availability_exceptions')
        .select('id')
        .eq('clinician_id', clinicianId)
        .eq('specific_date', formattedDate)
        .eq('original_availability_id', availabilityBlock.id)
        .single();
        
      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is 'not found' error
        throw checkError;
      }
      
      if (existingException) {
        // Update existing exception
        const { error: updateError } = await supabase
          .from('availability_exceptions')
          .update({
            start_time: startTime,
            end_time: endTime,
            is_deleted: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingException.id);
          
        if (updateError) throw updateError;
      } else {
        // Create new exception
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
          
        if (insertError) throw insertError;
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
      
      // Check if an exception already exists
      const { data: existingException, error: checkError } = await supabase
        .from('availability_exceptions')
        .select('id')
        .eq('clinician_id', clinicianId)
        .eq('specific_date', formattedDate)
        .eq('original_availability_id', availabilityBlock.id)
        .single();
        
      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is 'not found' error
        throw checkError;
      }
      
      if (existingException) {
        // Update existing exception to mark as deleted
        const { error: updateError } = await supabase
          .from('availability_exceptions')
          .update({
            is_deleted: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingException.id);
          
        if (updateError) throw updateError;
      } else {
        // Create new exception marked as deleted
        const { error: insertError } = await supabase
          .from('availability_exceptions')
          .insert({
            clinician_id: clinicianId,
            specific_date: formattedDate,
            original_availability_id: availabilityBlock.id,
            is_deleted: true
          });
          
        if (insertError) throw insertError;
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
