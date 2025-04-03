
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { format, isAfter } from 'date-fns';
import { Calendar, Clock, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface TimeOffBlock {
  id: string;
  start_date: string;
  end_date: string;
  note: string;
}

interface TimeOffBlocksListProps {
  clinicianId: string | null;
  onTimeOffUpdated: () => void;
}

const TimeOffBlocksList: React.FC<TimeOffBlocksListProps> = ({ 
  clinicianId,
  onTimeOffUpdated
}) => {
  const [timeOffBlocks, setTimeOffBlocks] = useState<TimeOffBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [blockToDelete, setBlockToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchTimeOffBlocks();
  }, [clinicianId]);

  const fetchTimeOffBlocks = async () => {
    if (!clinicianId) {
      setTimeOffBlocks([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('time_off_blocks')
        .select('*')
        .eq('clinician_id', clinicianId)
        .eq('is_active', true)
        .order('start_date', { ascending: true });

      if (error) throw error;
      
      // Filter to only show future and current blocks
      const now = new Date();
      const filteredBlocks = data.filter(block => {
        const endDate = new Date(block.end_date);
        return isAfter(endDate, now);
      });
      
      setTimeOffBlocks(filteredBlocks);
    } catch (error) {
      console.error('Error fetching time off blocks:', error);
      toast({
        title: "Error",
        description: "Failed to load time off blocks.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!blockToDelete) return;

    try {
      const { error } = await supabase
        .from('time_off_blocks')
        .update({ is_active: false })
        .eq('id', blockToDelete);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Time off block has been removed."
      });
      
      setTimeOffBlocks(blocks => blocks.filter(block => block.id !== blockToDelete));
      onTimeOffUpdated();
    } catch (error) {
      console.error('Error deleting time off block:', error);
      toast({
        title: "Error",
        description: "Failed to delete time off block.",
        variant: "destructive"
      });
    } finally {
      setBlockToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (timeOffBlocks.length === 0) {
    return (
      <div className="text-center p-4 text-gray-500">
        No time-off blocks scheduled.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {timeOffBlocks.map(block => (
        <Card key={block.id} className="p-3 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center text-sm font-medium">
                <Calendar className="h-4 w-4 mr-1 text-gray-500" />
                <span>
                  {format(new Date(block.start_date), 'MMM d, yyyy')} - {format(new Date(block.end_date), 'MMM d, yyyy')}
                </span>
              </div>
              {block.note && (
                <div className="text-gray-600 mt-1 text-sm">
                  {block.note}
                </div>
              )}
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setBlockToDelete(block.id)}
              className="h-8 w-8 text-gray-500 hover:text-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      ))}

      <AlertDialog open={!!blockToDelete} onOpenChange={(open) => !open && setBlockToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Time Off Block</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the time off block from your calendar. Any appointments during this time will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TimeOffBlocksList;
