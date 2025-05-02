
import mockCalendarService from '@/services/mock/MockCalendarService';
import mockAvailabilityService from '@/services/mock/MockAvailabilityService';

/**
 * Initialize mock data for a clinician
 * This can be called early in the application lifecycle to ensure data is available
 */
export function initializeMockCalendarData(clinicianId: string) {
  try {
    console.log('[MockDataInitializer] Initializing mock calendar data for clinician:', clinicianId);
    
    // Store the clinician ID for future use
    localStorage.setItem('last_clinician_id', clinicianId);
    
    // Initialize calendar events
    mockCalendarService.initializeSampleData(clinicianId);
    
    // Initialize availability data
    mockAvailabilityService.getWeeklyAvailabilityForClinician(clinicianId);
    mockAvailabilityService.getSettingsForClinician(clinicianId);
    
    console.log('[MockDataInitializer] Mock calendar data initialized successfully');
    return true;
  } catch (error) {
    console.error('[MockDataInitializer] Error initializing mock calendar data:', error);
    return false;
  }
}

/**
 * Get current timezone or set a default
 */
export function initializeUserTimeZone(defaultTimeZone: string = 'America/Chicago') {
  try {
    const storedTimeZone = localStorage.getItem('user_timezone');
    
    if (!storedTimeZone) {
      // Try to get user's timezone from browser
      let timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      // Fall back to default if not available
      if (!timeZone) {
        timeZone = defaultTimeZone;
      }
      
      localStorage.setItem('user_timezone', timeZone);
      console.log('[MockDataInitializer] Set user timezone:', timeZone);
    }
    
    return localStorage.getItem('user_timezone') || defaultTimeZone;
  } catch (error) {
    console.error('[MockDataInitializer] Error initializing user timezone:', error);
    return defaultTimeZone;
  }
}

// Export a function to initialize all mock data
export function initializeAllMockData() {
  console.log('[MockDataInitializer] Initializing all mock data');
  const timeZone = initializeUserTimeZone();
  const clinicianId = localStorage.getItem('last_clinician_id') || '';
  
  if (!clinicianId) {
    console.log('[MockDataInitializer] No clinician ID found, initializing with default');
    initializeMockCalendarData('default_clinician');
  } else {
    initializeMockCalendarData(clinicianId);
  }
  
  console.log('[MockDataInitializer] Mock data initialization complete');
  console.log('[MockDataInitializer] User timezone:', timeZone);
  console.log('[MockDataInitializer] Clinician ID:', localStorage.getItem('last_clinician_id'));
}

// Auto-initialize when imported
initializeAllMockData();

export default {
  initializeMockCalendarData,
  initializeUserTimeZone,
  initializeAllMockData,
};
