
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, addDays, parseISO } from 'date-fns';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface OneTimeAvailabilityBlock {
  id: string;
  specific_date: string;
  start_time: string;
  end_time: string;
  clinician_id: string;
  is_deleted: boolean;
}

interface OneTimeAvailabilityPanelProps {
  clinicianId: string | null;
  onAvailabilityUpdated: () => void;
  userTimeZone?: string;
}

const OneTimeAvailabilityPanel: React.FC<OneTimeAvailabilityPanelProps> = ({
  clinicianId,
  onAvailabilityUpdated,
  userTimeZone
}) => {
  const { toast } = useToast();
  const [oneTimeBlocks, setOneTimeBlocks] = useState<OneTimeAvailabilityBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddBlockDialogOpen, setIsAddBlockDialogOpen] = useState(false);
  
  // State for adding one-time availability
  const [selectedDate, setSelectedDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  
  useEffect(() => {
    if (clinicianId) {
      fetchOneTimeBlocks();
    }
  }, [clinicianId]);
  
  const fetchOneTimeBlocks = async () => {
    if (!clinicianId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('availability_exceptions')
        .select('*')
        .eq('clinician_id', clinicianId)
        .eq('is_deleted', false)
        .order('specific_date', { ascending: true });
        
      if (error) {
        console.error('Error fetching one-time availability:', error);
        throw error;
      }
      
      setOneTimeBlocks(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to load one-time availability blocks',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteOneTimeBlock = async (blockId: string) => {
    if (!clinicianId) return;
    
    try {
      const { error } = await supabase
        .from('availability_exceptions')
        .update({ is_deleted: true })
        .eq('id', blockId);
        
      if (error) {
        console.error('Error deleting one-time availability:', error);
        throw error;
      }
      
      toast({
        title: 'Success',
        description: 'One-time availability block removed'
      });
      
      fetchOneTimeBlocks();
      onAvailabilityUpdated();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove one-time availability block',
        variant: 'destructive'
      });
    }
  };

  const handleAddOneTimeBlock = async () => {
    if (!clinicianId || !selectedDate) return;
    
    // Validate time inputs
    if (startTime >= endTime) {
      toast({
        title: 'Invalid Time Range',
        description: 'End time must be after start time',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('availability_exceptions')
        .insert({
          clinician_id: clinicianId,
          specific_date: selectedDate,
          start_time: `${startTime}:00`,
          end_time: `${endTime}:00`,
          is_deleted: false
        })
        .select();
        
      if (error) {
        console.error('Error adding one-time availability:', error);
        throw error;
      }
      
      toast({
        title: 'Success',
        description: 'One-time availability block added'
      });
      
      setIsAddBlockDialogOpen(false);
      fetchOneTimeBlocks();
      onAvailabilityUpdated();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to add one-time availability block',
        variant: 'destructive'
      });
    }
  };
  
  // Function to format time for display
  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    return format(new Date(0, 0, 0, parseInt(hours), parseInt(minutes)), 'h:mm a');
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy');
  };

  const handleAddBlock = () => {
    // Reset form fields
    setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
    setStartTime('09:00');
    setEndTime('17:00');
    
    // Open dialog
    setIsAddBlockDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button 
          onClick={handleAddBlock}
          size="sm"
          className="flex items-center"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add One-Time Hours
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <p>Loading one-time availability...</p>
        </div>
      ) : oneTimeBlocks.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">No one-time availability blocks set up</p>
          <Button onClick={handleAddBlock}>
            <Plus className="h-4 w-4 mr-2" />
            Add One-Time Hours
          </Button>
        </div>
      ) : (
        <ul className="space-y-2">
          {oneTimeBlocks.map(block => (
            <li key={block.id} className="flex items-center justify-between bg-gray-50 p-3 rounded">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                <span>
                  {formatDate(block.specific_date)}: {formatTime(block.start_time)} - {formatTime(block.end_time)}
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleDeleteOneTimeBlock(block.id)}
                className="h-8 w-8 p-0"
              >
                <Trash2 className="h-4 w-4 text-gray-500" />
              </Button>
            </li>
          ))}
        </ul>
      )}
      
      {/* Add One-Time Block Dialog */}
      <Dialog open={isAddBlockDialogOpen} onOpenChange={setIsAddBlockDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              Add One-Time Availability
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">
                Date
              </Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="startTime" className="text-right">
                Start Time
              </Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="endTime" className="text-right">
                End Time
              </Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddBlockDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddOneTimeBlock}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OneTimeAvailabilityPanel;
