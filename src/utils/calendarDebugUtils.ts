
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
  
  if (currentUserId && selectedClinicianId) {
    // Check for ID format differences (e.g. same ID but different format/case)
    const normalizedUserId = currentUserId.toLowerCase().replace(/-/g, '');
    const normalizedClinicianId = selectedClinicianId.toLowerCase().replace(/-/g, '');
    
    if (normalizedUserId !== normalizedClinicianId) {
      if (userRole !== 'admin' && permissionLevel !== 'full') {
        issues.push('User ID and clinician ID do not match - permission issue detected');
        issues.push(`User ID: ${currentUserId}, Clinician ID: ${selectedClinicianId}`);
      }
    } else if (currentUserId !== selectedClinicianId) {
      // They're the same ID but in different formats
      issues.push('ID format mismatch detected - IDs match after normalization but have different formats');
      issues.push(`User ID: ${currentUserId}, Clinician ID: ${selectedClinicianId}`);
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
  stage: 'start' | 'auth-loaded' | 'clinician-selected' | 'events-loading' | 'complete' | 'permission-check' | 'error',
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
    normalizedIdsMatch: calendarState.currentUserId && calendarState.selectedClinicianId ? 
      calendarState.currentUserId.toLowerCase().replace(/-/g, '') === 
      calendarState.selectedClinicianId.toLowerCase().replace(/-/g, '') : false,
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

/**
 * Compare and log ID differences
 */
export const compareIds = (id1: string | null, id2: string | null, label1: string, label2: string): boolean => {
  if (!id1 || !id2) {
    console.log(`[ID Comparison] Cannot compare: ${label1}=${id1}, ${label2}=${id2}`);
    return false;
  }
  
  // Check direct equality
  const directMatch = id1 === id2;
  
  // Check normalized equality (no dashes, lowercase)
  const normalized1 = id1.toLowerCase().replace(/-/g, '');
  const normalized2 = id2.toLowerCase().replace(/-/g, '');
  const normalizedMatch = normalized1 === normalized2;
  
  console.log(`[ID Comparison] ${label1} vs ${label2}:`, {
    directMatch,
    normalizedMatch,
    [label1]: id1,
    [label2]: id2,
    normalized1,
    normalized2
  });
  
  return directMatch || normalizedMatch;
};

export default {
  logCalendarState,
  diagnoseCalendarIssues,
  trackCalendarInitialization,
  logDetailedCalendarState,
  logCalendarEvents,
  compareIds
};
