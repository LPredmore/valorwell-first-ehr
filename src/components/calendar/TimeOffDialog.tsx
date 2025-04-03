
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { format, addDays, isAfter, isBefore, startOfDay } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { DateRange } from 'react-day-picker';
import { toast } from '@/hooks/use-toast';

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
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(),
    to: addDays(new Date(), 1)
  });
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setDateRange({
        from: new Date(),
        to: addDays(new Date(), 1)
      });
      setNote('');
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!clinicianId) {
      toast({
        title: "Error",
        description: "Clinician ID is required",
        variant: "destructive"
      });
      return;
    }

    if (!dateRange.from || !dateRange.to) {
      toast({
        title: "Error",
        description: "Please select a date range",
        variant: "destructive"
      });
      return;
    }

    // Ensure to date is not before from date
    if (isBefore(dateRange.to, dateRange.from)) {
      toast({
        title: "Error",
        description: "End date cannot be before start date",
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
          start_date: format(dateRange.from, 'yyyy-MM-dd'),
          end_date: format(dateRange.to, 'yyyy-MM-dd'),
          note: note.trim() || null
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Time off block has been added",
      });

      onTimeOffUpdated();
      onClose();
    } catch (error) {
      console.error('Error saving time off block:', error);
      toast({
        title: "Error",
        description: "Failed to save time off block",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle date range selection
  const handleDateRangeChange = (range: DateRange | undefined) => {
    if (range?.from) {
      setDateRange({
        from: range.from,
        to: range.to || range.from
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Time Off</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Date Range</Label>
            <div className="grid grid-cols-2 gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !dateRange.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? format(dateRange.from, 'PPP') : <span>From date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={handleDateRangeChange}
                    initialFocus
                    defaultMonth={dateRange.from}
                  />
                </PopoverContent>
              </Popover>

              <div className="flex items-center">
                <span className="mx-2">to</span>
                <div className="w-full">
                  {dateRange.to ? format(dateRange.to, 'PPP') : <span className="text-muted-foreground">End date</span>}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Note (optional)</Label>
            <Textarea 
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note about this time off"
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {isLoading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TimeOffDialog;
