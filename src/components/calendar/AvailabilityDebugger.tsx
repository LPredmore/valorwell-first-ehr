
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';

interface AvailabilityDebuggerProps {
  clinicianId: string | null;
  specificDate?: Date | null;
}

const AvailabilityDebugger: React.FC<AvailabilityDebuggerProps> = ({ 
  clinicianId, 
  specificDate = null 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [availabilityData, setAvailabilityData] = useState<any[]>([]);
  const [exceptionsData, setExceptionsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const fetchData = async () => {
    if (!clinicianId) return;
    
    setLoading(true);
    
    try {
      // Fetch recurring availability
      const { data: recurrData, error: recurrError } = await supabase
        .from('availability')
        .select('*')
        .eq('clinician_id', clinicianId)
        .eq('is_active', true);
        
      if (recurrError) throw recurrError;
      
      // Fetch availability exceptions
      const { data: exceptData, error: exceptError } = await supabase
        .from('availability_exceptions')
        .select('*')
        .eq('clinician_id', clinicianId);
        
      if (exceptError) throw exceptError;
      
      setAvailabilityData(recurrData || []);
      setExceptionsData(exceptData || []);
    } catch (error) {
      console.error('Error fetching availability data for debugging:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleOpen = () => {
    setIsOpen(true);
    fetchData();
  };
  
  const handleFixIssue = async () => {
    if (!clinicianId || !specificDate) return;
    
    const dateStr = format(specificDate, 'yyyy-MM-dd');
    
    try {
      setLoading(true);
      
      // Find exceptions with is_deleted=true but have start_time/end_time values
      const { data: inconsistentData, error } = await supabase
        .from('availability_exceptions')
        .select('*')
        .eq('clinician_id', clinicianId)
        .eq('specific_date', dateStr)
        .eq('is_deleted', true)
        .not('start_time', 'is', null);
        
      if (error) throw error;
      
      // Fix any inconsistent records
      if (inconsistentData && inconsistentData.length > 0) {
        for (const record of inconsistentData) {
          const { error: updateError } = await supabase
            .from('availability_exceptions')
            .update({ 
              is_deleted: false
            })
            .eq('id', record.id);
            
          if (updateError) throw updateError;
        }
        
        alert(`Fixed ${inconsistentData.length} inconsistent exception records.`);
        await fetchData();
      } else {
        alert('No inconsistent records found for this date.');
      }
    } catch (error) {
      console.error('Error fixing availability exceptions:', error);
      alert('Failed to fix issues. See console for details.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 z-50 bg-red-100 hover:bg-red-200 text-red-800"
        onClick={handleOpen}
      >
        Debug Availability
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>Availability Debugger</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 h-full">
            <div className="border rounded-md p-2">
              <h3 className="font-medium mb-2">Recurring Availability ({availabilityData.length})</h3>
              <ScrollArea className="h-[50vh]">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(availabilityData, null, 2)}
                </pre>
              </ScrollArea>
            </div>
            
            <div className="border rounded-md p-2">
              <h3 className="font-medium mb-2">
                Availability Exceptions ({exceptionsData.length})
                {specificDate && (
                  <span> - Specific date: {format(specificDate, 'yyyy-MM-dd')}</span>
                )}
              </h3>
              <ScrollArea className="h-[50vh]">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(
                    specificDate 
                      ? exceptionsData.filter(exc => 
                          exc.specific_date === format(specificDate, 'yyyy-MM-dd')
                        )
                      : exceptionsData, 
                    null, 2
                  )}
                </pre>
              </ScrollArea>
            </div>
          </div>
          
          <DialogFooter>
            {specificDate && (
              <Button variant="destructive" onClick={handleFixIssue} disabled={loading}>
                Fix Data Issues for This Date
              </Button>
            )}
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Close
            </Button>
            <Button onClick={fetchData} disabled={loading}>
              Refresh Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AvailabilityDebugger;
