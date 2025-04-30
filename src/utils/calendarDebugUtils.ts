
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
  
  // UUID validation check
  if (selectedClinicianId) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(selectedClinicianId)) {
      issues.push(`Clinician ID has invalid UUID format: "${selectedClinicianId}"`);
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
  stage: 'start' | 'auth-loaded' | 'clinician-selected' | 'events-loading' | 'complete' | 'error',
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
    totalClinicians: calendarState.clinicians?.length || 0,
    firstClinicianId: calendarState.clinicians?.[0]?.id || 'none'
  });
  console.log('Permissions:', {
    permissionLevel: calendarState.permissionLevel,
    permissionError: calendarState.permissionError,
    canManageAvailability: calendarState.canManageAvailability
  });
  console.log('Time Zone:', {
    timeZone: calendarState.timeZone,
    isTimeZoneValid: !!calendarState.timeZone,
    timeZoneSource: calendarState.timeZoneSource || 'unknown'
  });
  
  // Add UUID validation check
  if (calendarState.selectedClinicianId) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    console.log('UUID Validation:', {
      selectedClinicianId: calendarState.selectedClinicianId,
      isValidUUID: uuidRegex.test(calendarState.selectedClinicianId),
      formattedId: calendarState.formattedClinicianId || 'not formatted'
    });
  }
  
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
 * Track clinician selection lifecycle with detailed information
 */
export const trackClinicianSelection = (
  stage: 'init' | 'auto-select' | 'user-select' | 'validation' | 'error' | 'applied',
  details: {
    source: string;
    selectedClinicianId?: string | null;
    previousClinicianId?: string | null;
    availableClinicians?: Array<{id: string, name?: string}>;
    userId?: string | null;
    error?: Error | null;
    [key: string]: any;
  }
) => {
  console.log(`[ClinicianSelection] Stage: ${stage} | Source: ${details.source}`, {
    ...details,
    timestamp: new Date().toISOString()
  });
  
  // Add extra validation info for debugging
  if (details.selectedClinicianId) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isValidUUID = uuidRegex.test(details.selectedClinicianId);
    console.log(`[ClinicianSelection] UUID validation for "${details.selectedClinicianId}": ${isValidUUID ? 'VALID' : 'INVALID'}`);
    
    if (!isValidUUID) {
      // Try to diagnose format issues
      const cleaned = details.selectedClinicianId.replace(/[^a-f0-9]/gi, '');
      console.log(`[ClinicianSelection] Cleaned ID: "${cleaned}" (length: ${cleaned.length}, expected: 32)`);
      console.log(`[ClinicianSelection] Original ID type: ${typeof details.selectedClinicianId}`);
      console.log(`[ClinicianSelection] Contains hyphens: ${details.selectedClinicianId.includes('-')}`);
    }
  }
};

/**
 * Track API requests for calendar data
 */
export const trackCalendarApi = (
  operation: 'request' | 'success' | 'error',
  details: {
    endpoint?: string;
    params?: Record<string, any>;
    clinicianId?: string;
    error?: any;
    resultCount?: number;
    [key: string]: any;
  }
) => {
  console.log(`[CalendarAPI] ${operation.toUpperCase()}`, details);
};

/**
 * Enhanced debugging for UUID validation failures
 */
export const debugUuidValidation = (
  id: string | null | undefined,
  context: string,
  details?: Record<string, any>
) => {
  if (!id) {
    console.log(`[UUID Validation] ${context}: Empty or null ID provided`, details);
    return;
  }
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const isValid = uuidRegex.test(id);
  
  if (isValid) {
    console.log(`[UUID Validation] ${context}: Valid UUID "${id}"`, details);
  } else {
    console.warn(`[UUID Validation] ${context}: Invalid UUID "${id}"`, {
      ...details,
      idType: typeof id,
      length: id.length,
      containsHyphens: id.includes('-'),
      cleanedIdLength: id.replace(/[^a-f0-9]/gi, '').length,
      hasUppercase: /[A-F]/.test(id)
    });
    
    // Try to suggest fixes
    const cleaned = id.replace(/[^a-f0-9]/gi, '');
    if (cleaned.length === 32) {
      const formatted = 
        cleaned.substring(0, 8) + '-' + 
        cleaned.substring(8, 12) + '-' + 
        cleaned.substring(12, 16) + '-' + 
        cleaned.substring(16, 20) + '-' + 
        cleaned.substring(20);
      console.log(`[UUID Validation] ${context}: Suggested fix: "${formatted}"`);
    }
  }
};

export default {
  logCalendarState,
  diagnoseCalendarIssues,
  trackCalendarInitialization,
  logDetailedCalendarState,
  logCalendarEvents,
  trackClinicianSelection,
  trackCalendarApi,
  debugUuidValidation
};
