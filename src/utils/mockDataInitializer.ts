import mockCalendarService from '@/services/mock/MockCalendarService';
import MockAvailabilityService from '@/services/mock/MockAvailabilityService';

/**
 * Initialize mock data for a clinician
 * This can be called early in the application lifecycle to ensure data is available
 */
export const initializeMockCalendarData = async (clinicianId: string) => {
  try {
    console.log(`Initializing mock calendar data for clinician: ${clinicianId}`);
    
    // Get or generate weekly availability
    const weeklyAvailability = await MockAvailabilityService.getWeeklyAvailabilityForClinician(clinicianId);
    console.log('Generated mock weekly availability:', weeklyAvailability);
    
    // Get or generate availability settings
    const settings = await MockAvailabilityService.getSettingsForClinician(clinicianId);
    console.log('Generated mock availability settings:', settings);
    
    return {
      weeklyAvailability,
      settings
    };
  } catch (error) {
    console.error('Error initializing mock calendar data:', error);
    throw error;
  }
};

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
