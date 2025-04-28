
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import FullCalendarView from './FullCalendarView';
import CalendarErrorBoundary from './CalendarErrorBoundary';
import CalendarError from './CalendarError';
import { Loader2 } from 'lucide-react';
import { componentMonitor } from '@/utils/performance/componentMonitor';

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
  // Performance monitoring
  const renderStartTime = React.useRef(performance.now());
  
  useEffect(() => {
    const renderTime = performance.now() - renderStartTime.current;
    componentMonitor.recordRender('CalendarViewManager', renderTime, {
      props: { clinicianId, timeZone, showAvailability }
    });
  });

  const [calendarKey, setCalendarKey] = useState<number>(0);
  const [calendarError, setCalendarError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Memoize callbacks with proper dependency arrays
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
  
  // Memoize the calendar view props to prevent unnecessary re-renders
  const calendarViewProps = useMemo(() => ({
    clinicianId,
    userTimeZone: timeZone,
    view: 'timeGridWeek' as const,
    height: "700px",
    showAvailability,
    onAvailabilityClick
  }), [clinicianId, timeZone, showAvailability, onAvailabilityClick]);

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
          {...calendarViewProps}
        />
      </Card>
    </CalendarErrorBoundary>
  );
};

// Memoize to prevent unnecessary re-renders
export default React.memo(CalendarViewManager);
