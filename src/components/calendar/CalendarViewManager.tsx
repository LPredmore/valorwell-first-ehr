
import React, { useState, useCallback, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import FullCalendarView from './FullCalendarView';
import CalendarErrorBoundary from './CalendarErrorBoundary';
import CalendarError from './CalendarError';
import { Loader2 } from 'lucide-react';

interface CalendarViewManagerProps {
  clinicianId: string | null;
  timeZone: string;
  showAvailability: boolean;
  onAvailabilityClick: (event: any) => void;
  onError?: (error: Error) => void;
}

const CalendarViewManager: React.FC<CalendarViewManagerProps> = ({
  clinicianId,
  timeZone,
  showAvailability,
  onAvailabilityClick,
  onError,
}) => {
  const [calendarKey, setCalendarKey] = useState<number>(0);
  const [calendarError, setCalendarError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const handleCalendarRefresh = useCallback(() => {
    console.log('[CalendarViewManager] Refreshing calendar with new key');
    setCalendarKey(prev => prev + 1);
    setCalendarError(null);
    setRetryCount(prev => prev + 1);
  }, []);

  const handleCalendarError = useCallback((error: Error) => {
    console.error('[CalendarViewManager] Calendar encountered an error:', error);
    setCalendarError(error);
    if (onError) onError(error);
  }, [onError]);

  if (!clinicianId) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-500">
          Please select a clinician to view their calendar.
        </p>
      </Card>
    );
  }

  return (
    <CalendarErrorBoundary 
      onRetry={handleCalendarRefresh} 
      fallbackUI={
        <CalendarError 
          error={calendarError} 
          onRetry={handleCalendarRefresh}
          retryCount={retryCount}
        />
      }
    >
      <Card className="p-4">
        <FullCalendarView 
          key={calendarKey} 
          clinicianId={clinicianId} 
          userTimeZone={timeZone} 
          view='timeGridWeek'
          height="700px" 
          showAvailability={showAvailability}
          onAvailabilityClick={onAvailabilityClick}
        />
      </Card>
    </CalendarErrorBoundary>
  );
};

// Memoize to prevent unnecessary re-renders
export default React.memo(CalendarViewManager);
