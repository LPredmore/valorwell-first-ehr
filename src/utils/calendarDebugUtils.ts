
/**
 * Calendar Debug Utilities
 * 
 * This file contains utility functions for debugging calendar-related issues.
 * It provides centralized logging and diagnostic tools to help troubleshoot
 * calendar display, permissions, and user ID issues.
 */

/**
 * Log calendar state information for debugging purposes
 */
export const logCalendarState = (
  component: string,
  state: {
    currentUserId?: string | null;
    selectedClinicianId?: string | null;
    userRole?: string | null;
    permissionLevel?: string | null;
    timeZone?: string | null;
    [key: string]: any;
  }
) => {
  console.log(`[${component}] Calendar State:`, state);
};

/**
 * Diagnose common calendar issues
 */
export const diagnoseCalendarIssues = (
  currentUserId: string | null,
  selectedClinicianId: string | null,
  userRole: string | null,
  permissionLevel: string | null
): { hasIssues: boolean; issues: string[] } => {
  const issues: string[] = [];
  
  if (!currentUserId) {
    issues.push('No current user ID available - authentication issue');
  }
  
  if (!selectedClinicianId) {
    issues.push('No clinician selected - calendar cannot display without a clinician ID');
  }
  
  if (currentUserId && selectedClinicianId && currentUserId !== selectedClinicianId) {
    if (userRole !== 'admin' && permissionLevel !== 'full') {
      issues.push('Viewing another clinician\'s calendar without proper permissions');
    }
  }
  
  return {
    hasIssues: issues.length > 0,
    issues
  };
};

/**
 * Track calendar initialization sequence
 */
export const trackCalendarInitialization = (
  stage: 'start' | 'auth-loaded' | 'clinician-selected' | 'events-loading' | 'complete',
  details: Record<string, any> = {}
) => {
  console.log(`[CalendarInitialization] Stage: ${stage}`, details);
};

/**
 * Log detailed information about the current calendar state
 */
export const logDetailedCalendarState = (calendarState: any) => {
  console.group('Calendar Detailed State');
  console.log('User Authentication:', {
    currentUserId: calendarState.currentUserId,
    userRole: calendarState.userRole,
    isAuthenticated: calendarState.isAuthenticated
  });
  console.log('Clinician Selection:', {
    selectedClinicianId: calendarState.selectedClinicianId,
    usingCurrentUserAsClinicianId: calendarState.currentUserId === calendarState.selectedClinicianId,
    totalClinicians: calendarState.clinicians?.length || 0
  });
  console.log('Permissions:', {
    permissionLevel: calendarState.permissionLevel,
    permissionError: calendarState.permissionError,
    canManageAvailability: calendarState.canManageAvailability
  });
  console.log('Time Zone:', {
    timeZone: calendarState.timeZone,
    isTimeZoneValid: !!calendarState.timeZone
  });
  console.groupEnd();
};

/**
 * Log calendar events for debugging
 */
export const logCalendarEvents = (
  source: string,
  events: any[],
  timeZone: string | null
) => {
  if (!events || events.length === 0) {
    console.log(`[${source}] No calendar events to display`);
    return;
  }

  console.log(`[${source}] Calendar events summary (${events.length} events, timezone: ${timeZone || 'unknown'}):`);
  
  // Group events by type for better analysis
  const eventsByType: Record<string, number> = {};
  events.forEach(event => {
    const type = event.extendedProps?.eventType || 'unknown';
    eventsByType[type] = (eventsByType[type] || 0) + 1;
  });
  
  console.log(`[${source}] Events by type:`, eventsByType);
  
  // Log a few sample events for inspection
  const sampleSize = Math.min(3, events.length);
  console.log(`[${source}] Sample events (${sampleSize}):`, events.slice(0, sampleSize));
};

export default {
  logCalendarState,
  diagnoseCalendarIssues,
  trackCalendarInitialization,
  logDetailedCalendarState,
  logCalendarEvents
};
