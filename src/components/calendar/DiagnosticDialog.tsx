import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useDialogs } from '@/context/DialogContext';

interface DiagnosticResults {
  total_events: number;
  misaligned_timezones: number;
  overlapping_events: number;
}

const CalendarDiagnosticDialog: React.FC<{ selectedClinicianId: string | null }> = ({ selectedClinicianId }) => {
  const { state, closeDialog } = useDialogs();
  const isOpen = state.type === 'diagnostic';
  const [results, setResults] = useState<DiagnosticResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!isOpen || !selectedClinicianId) return;

      setIsLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase.rpc('calendar_diagnostics', {
          clinician_id: selectedClinicianId
        });

        if (error) {
          console.error('Error fetching diagnostics:', error);
          setError(error.message);
        } else {
          setResults(data);
        }
      } catch (err) {
        console.error('Error during diagnostics:', err);
        setError('Failed to run diagnostics. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isOpen, selectedClinicianId]);

  const AlertItem: React.FC<{ issue: any }> = ({ issue }) => {
    return (
      <Alert variant="destructive" className="mb-2">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Issue: {issue.issue_type}</AlertTitle>
        <AlertDescription>
          {issue.description}
          <div className="text-xs mt-1">Count: {issue.count}</div>
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={closeDialog}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Calendar Diagnostics</DialogTitle>
          <DialogDescription>
            Run diagnostics to identify potential issues with the calendar data.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center items-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : results ? (
          <div className="space-y-3">
            <AlertItem issue={{ issue_type: 'Total Events', description: 'Total number of events in the calendar.', count: results.total_events }} />
            <AlertItem issue={{ issue_type: 'Misaligned Timezones', description: 'Events with timezone mismatches.', count: results.misaligned_timezones }} />
            <AlertItem issue={{ issue_type: 'Overlapping Events', description: 'Events that are overlapping in time.', count: results.overlapping_events }} />
          </div>
        ) : (
          <div className="text-center text-gray-500 py-4">
            No diagnostics run yet.
          </div>
        )}

        <Button variant="outline" onClick={closeDialog}>Close</Button>
      </DialogContent>
    </Dialog>
  );
};

export default CalendarDiagnosticDialog;
