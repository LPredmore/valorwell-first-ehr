
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import FullCalendarView from './FullCalendarView';
import CalendarErrorBoundary from './CalendarErrorBoundary';
import CalendarError from './CalendarError';
import { Loader2 } from 'lucide-react';
import { componentMonitor } from '@/utils/performance/componentMonitor';
import { useUser } from '@/context/UserContext';
import { formatAsUUID } from '@/utils/validation/uuidUtils';

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
  
  // User context for authentication status
  const { userId, isClinician, isLoading: isUserLoading } = useUser();
  
  // Format clinician ID to ensure consistent UUID format
  const formattedClinicianId = useMemo(() => {
    if (!clinicianId) return null;
    return formatAsUUID(clinicianId);
  }, [clinicianId]);
  
  useEffect(() => {
    const renderTime = performance.now() - renderStartTime.current;
    componentMonitor.recordRender('CalendarViewManager', renderTime, {
      props: { clinicianId: formattedClinicianId, timeZone, showAvailability }
    });
    
    // Log the component props for debugging
    console.log('[CalendarViewManager] Rendering with:', {
      clinicianId: clinicianId,
      formattedClinicianId,
      timeZone,
      showAvailability,
      userId,
      isClinician,
      isUserLoading
    });
  }, [formattedClinicianId, timeZone, showAvailability, userId, isClinician, isUserLoading]);

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
    clinicianId: formattedClinicianId,
    userTimeZone: timeZone,
    view: 'timeGridWeek' as const,
    height: "700px",
    showAvailability,
    onAvailabilityClick
  }), [formattedClinicianId, timeZone, showAvailability, onAvailabilityClick]);

  // Show loading state when user authentication is still loading
  if (isUserLoading) {
    return (
      <Card className="p-8 text-center">
        <div className="flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-gray-500">Loading authentication data...</p>
        </div>
      </Card>
    );
  }

  if (!formattedClinicianId) {
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
