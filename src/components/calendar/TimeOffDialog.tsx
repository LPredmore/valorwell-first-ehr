
import React, { useState } from 'react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TimeOffDialogProps {
  isOpen: boolean;
  onClose: () => void;
  clinicianId: string | null;
  onTimeOffUpdated: () => void;
}

const TimeOffDialog: React.FC<TimeOffDialogProps> = ({ 
  isOpen, 
  onClose, 
  clinicianId,
  onTimeOffUpdated
}) => {
  const [date, setDate] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const handleSave = async () => {
    if (!clinicianId || !date.from || !date.to) {
      toast({
        title: "Missing Information",
        description: "Please select both start and end dates.",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('time_off_blocks')
        .insert({
          clinician_id: clinicianId,
          start_date: format(date.from, 'yyyy-MM-dd'),
          end_date: format(date.to, 'yyyy-MM-dd'),
          note: note.trim() || 'Time Off',
          is_active: true
        });
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Time off block has been added to your calendar."
      });
      
      onTimeOffUpdated();
      handleClose();
    } catch (error) {
      console.error('Error saving time off block:', error);
      toast({
        title: "Error",
        description: "Failed to save time off block. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleClose = () => {
    setDate({ from: undefined, to: undefined });
    setNote('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Time Off</DialogTitle>
          <DialogDescription>
            Block a range of days as unavailable on your calendar.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div>
            <Label htmlFor="dates">Select Dates</Label>
            <div className="mt-2 border rounded-md p-2">
              <Calendar
                initialFocus
                mode="range"
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
                disabled={(date) => date < new Date()}
                className="mx-auto"
              />
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="note">Note (optional)</Label>
            <Textarea
              id="note"
              placeholder="Vacation, Conference, etc."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={100}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={isLoading || !date.from || !date.to}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TimeOffDialog;
