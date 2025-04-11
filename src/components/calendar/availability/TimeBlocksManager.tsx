
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Calendar } from '@/components/ui/calendar';
import { TimeInput } from '@/components/ui/time-input';
import { Spinner } from '@/components/ui/spinner';
import { CalendarIcon, Trash2, Clock, Ban, PlusCircle } from 'lucide-react';
import { format, isValid, isBefore, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

interface TimeBlock {
  id: string;
  blockDate: string;
  startTime: string;
  endTime: string;
  reason?: string;
}

interface TimeBlocksManagerProps {
  clinicianId: string | null;
}

const TimeBlocksManager: React.FC<TimeBlocksManagerProps> = ({ clinicianId }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [reason, setReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (clinicianId) {
      fetchTimeBlocks();
    }
  }, [clinicianId]);

  const fetchTimeBlocks = async () => {
    if (!clinicianId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('time_blocks')
        .select('*')
        .eq('clinician_id', clinicianId)
        .order('block_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;

      const formattedBlocks = data?.map(block => ({
        id: block.id,
        blockDate: block.block_date,
        startTime: block.start_time.slice(0, 5),
        endTime: block.end_time.slice(0, 5),
        reason: block.reason || '',
      })) || [];

      setTimeBlocks(formattedBlocks);
    } catch (error) {
      console.error('Error fetching time blocks:', error);
      toast({
        title: "Error",
        description: "Failed to load time blocks",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const validateTimeBlock = (): boolean => {
    if (!selectedDate) {
      toast({
        title: "Invalid Date",
        description: "Please select a valid date",
        variant: "destructive",
      });
      return false;
    }

    if (!startTime || !endTime) {
      toast({
        title: "Invalid Times",
        description: "Please enter valid start and end times",
        variant: "destructive",
      });
      return false;
    }

    const start = parseISO(`2000-01-01T${startTime}`);
    const end = parseISO(`2000-01-01T${endTime}`);
    
    if (!isValid(start) || !isValid(end)) {
      toast({
        title: "Invalid Time Format",
        description: "Please enter times in a valid format",
        variant: "destructive",
      });
      return false;
    }
    
    if (!isBefore(start, end)) {
      toast({
        title: "Invalid Time Range",
        description: "End time must be after start time",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleAddTimeBlock = async () => {
    if (!clinicianId) {
      toast({
        title: "Error",
        description: "User ID not available",
        variant: "destructive",
      });
      return;
    }

    if (!validateTimeBlock()) {
      return;
    }

    setIsSaving(true);

    try {
      const formattedDate = format(selectedDate!, 'yyyy-MM-dd');
      
      const { data, error } = await supabase.from('time_blocks').insert({
        clinician_id: clinicianId,
        block_date: formattedDate,
        start_time: startTime,
        end_time: endTime,
        reason: reason.trim() || null
      }).select();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Time block added successfully",
      });

      setIsAdding(false);
      setSelectedDate(new Date());
      setStartTime('09:00');
      setEndTime('10:00');
      setReason('');
      
      fetchTimeBlocks();
    } catch (error) {
      console.error('Error adding time block:', error);
      toast({
        title: "Error",
        description: "Failed to add time block",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveTimeBlock = async (id: string) => {
    if (!clinicianId) return;

    try {
      const { error } = await supabase
        .from('time_blocks')
        .delete()
        .eq('id', id)
        .eq('clinician_id', clinicianId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Time block removed successfully",
      });

      fetchTimeBlocks();
    } catch (error) {
      console.error('Error removing time block:', error);
      toast({
        title: "Error",
        description: "Failed to remove time block",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Blocked Time Periods</h3>
        <Button 
          onClick={() => setIsAdding(!isAdding)}
          variant={isAdding ? "secondary" : "outline"}
        >
          {isAdding ? "Cancel" : (
            <>
              <Ban className="h-4 w-4 mr-2" />
              Add Blocked Time
            </>
          )}
        </Button>
      </div>

      {isAdding && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Time Block</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div>
                <Label htmlFor="date">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="date"
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startTime">Start Time</Label>
                  <TimeInput
                    id="startTime" 
                    value={startTime} 
                    onChange={setStartTime} 
                  />
                </div>
                <div>
                  <Label htmlFor="endTime">End Time</Label>
                  <TimeInput
                    id="endTime" 
                    value={endTime} 
                    onChange={setEndTime} 
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="reason">Reason (Optional)</Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Vacation, Meeting, etc."
                  className="resize-none"
                />
              </div>

              <Button 
                onClick={handleAddTimeBlock}
                disabled={isSaving}
                className="mt-2"
              >
                {isSaving ? <Spinner className="mr-2 h-4 w-4" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                Add Time Block
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center p-8">
          <Spinner />
        </div>
      ) : timeBlocks.length > 0 ? (
        <div className="space-y-2">
          {timeBlocks.map((block) => (
            <Card key={block.id} className="overflow-hidden">
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-start">
                  <div className="mr-4">
                    <CalendarIcon className="h-5 w-5 text-gray-500" />
                  </div>
                  <div>
                    <div className="font-medium">{format(new Date(block.blockDate), 'PPP')}</div>
                    <div className="text-sm text-gray-500 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {block.startTime} - {block.endTime}
                    </div>
                    {block.reason && (
                      <div className="text-sm text-gray-500 mt-1">{block.reason}</div>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveTimeBlock(block.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8">
          <div className="text-center text-gray-500">
            <Ban className="h-8 w-8 mx-auto mb-2" />
            <p>No time blocks defined</p>
            <p className="text-sm mt-1">
              Add time blocks to mark periods when you're unavailable
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default TimeBlocksManager;
