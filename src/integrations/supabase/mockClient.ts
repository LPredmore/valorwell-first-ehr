import { AuthChangeEvent, Session, SupabaseClient, User } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import MockAvailabilityService from '@/services/mock/MockAvailabilityService';

// Mock Supabase client
export const createMockSupabaseClient = (): SupabaseClient<Database> => {
  let mockUser: User | null = null;
  let mockSession: Session | null = null;
  let authChangeListeners: ((event: AuthChangeEvent, session: Session | null) => void)[] = [];

  const mockSupabase = {
    auth: {
      getSession: async () => {
        return { data: { session: mockSession }, error: null };
      },
      getUser: async () => {
        return { data: { user: mockUser }, error: null };
      },
      signInWithOAuth: async () => {
        return { data: { session: mockSession, user: mockUser }, error: null };
      },
      signOut: async () => {
        mockSession = null;
        mockUser = null;
        authChangeListeners.forEach(listener => listener('SIGNED_OUT', null));
        return { data: { session: null }, error: null };
      },
      onAuthStateChange: (callback) => {
        authChangeListeners.push(callback);
        return {
          data: {
            subscription: {
              unsubscribe: () => {
                authChangeListeners = authChangeListeners.filter(cb => cb !== callback);
              },
            },
          },
          error: null,
        };
      },
      setSession: async (session: Session | null) => {
        mockSession = session;
        mockUser = session?.user || null;
        authChangeListeners.forEach(listener => listener('SIGNED_IN', session));
        return { data: { session }, error: null };
      },
    },
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          single: async () => {
            return { data: {}, error: null };
          },
        }),
      }),
      insert: () => ({
        select: () => ({
          single: async () => {
            return { data: {}, error: null };
          },
        }),
      }),
    }),
  };

  return mockSupabase as unknown as SupabaseClient<Database>;
};

// Mock implementation for the getOrCreateVideoRoom function
export const getOrCreateVideoRoom = async (appointmentId: string): Promise<{ success: boolean; url?: string; error?: any }> => {
  return { success: true, url: 'https://example.com/video-room' };
};

// Mock implementation for the getAvailability function
const getAvailability = async (
  clinicianId: string,
  timezone: string,
  startDate?: Date | string,
  endDate?: Date | string
): Promise<any[]> => {
  try {
    // Call the mock service to get availability data
    const events = MockAvailabilityService.getMockAvailabilityEvents(
      clinicianId,
      timezone,
      startDate || new Date(),
      endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    );
    return events;
  } catch (error) {
    console.error('Error getting availability:', error);
    return [];
  }
};

// Mock implementation for the getAvailabilitySettings function
const getAvailabilitySettings = async (clinicianId: string): Promise<any> => {
  try {
    // Call the mock service to get availability settings
    return await MockAvailabilityService.getSettingsForClinician(clinicianId);
  } catch (error) {
    console.error('Error getting availability settings:', error);
    return null;
  }
};

// Mock implementation for the createAvailability function
const createAvailability = async (
  clinicianId: string,
  dayOfWeek: string,
  startTime: string,
  endTime: string,
  isRecurring = true
): Promise<any> => {
  try {
    // Call the mock service to create availability
    return await MockAvailabilityService.createAvailabilitySlot(
      clinicianId,
      dayOfWeek as any,
      startTime,
      endTime,
      isRecurring
    );
  } catch (error) {
    console.error('Error creating availability:', error);
    return null;
  }
};

// Mock implementation for the updateAvailabilitySettings function
const updateAvailabilitySettings = async (
  clinicianId: string,
  settings: any
): Promise<any> => {
  try {
    // Call the mock service to update availability settings
    return await MockAvailabilityService.updateSettings(clinicianId, settings);
  } catch (error) {
    console.error('Error updating availability settings:', error);
    return null;
  }
};

// Mock implementation for the updateAvailability function
const updateAvailability = async (
  availabilityId: string,
  updates: any
): Promise<any> => {
  try {
    // Call the mock service to update availability
    return await MockAvailabilityService.updateAvailabilitySlot(availabilityId, updates);
  } catch (error) {
    console.error('Error updating availability:', error);
    return null;
  }
};

// Mock implementation for the deleteAvailability function
const deleteAvailability = async (availabilityId: string): Promise<boolean> => {
  try {
    // Call the mock service to delete availability
    return await MockAvailabilityService.deleteAvailabilitySlot(availabilityId);
  } catch (error) {
    console.error('Error deleting availability:', error);
    return false;
  }
};

export const mockSupabaseClient = createMockSupabaseClient();

export const mockAppointmentService = {
  getAppointments: (clinicianId: string, timezone: string, startDate: Date | string, endDate: Date | string) => {
    return []; // Mock implementation
  },
  getAppointmentById: (appointmentId: string) => {
    return null; // Mock implementation
  },
  createAppointment: (appointmentId: string, appointment: any) => {
    return null; // Mock implementation
  },
  updateAppointment: (appointmentId: string, appointment: any) => {
    return null; // Mock implementation
  },
  deleteAppointment: (appointmentId: string) => {
    return true // Mock implementation
  }
};

export const mockTimeOffService = {
  getTimeOff: (clinicianId: string, timezone: string, startDate: Date | string, endDate: Date | string) => {
    return []; // Mock implementation
  },
  getTimeOffById: (timeOffId: string) => {
    return null; // Mock implementation
  },
  createTimeOff: (timeOffId: string, timeOff: any) => {
    return null; // Mock implementation
  },
  updateTimeOff: (timeOffId: string, timeOff: any) => {
    return null; // Mock implementation
  },
  deleteTimeOff: (timeOffId: string) => {
    return true // Mock implementation
  }
};

export const mockAvailabilityService = {
  getAvailability,
  getAvailabilitySettings,
  createAvailability,
  updateAvailabilitySettings,
  updateAvailability,
  deleteAvailability
};

// Mock implementation for the getWeeklyAvailability function
const getWeeklyAvailability = async (clinicianId: string) => {
  try {
    // Call the mock service to get weekly availability
    return await MockAvailabilityService.getWeeklyAvailabilityForClinician(clinicianId);
  } catch (error) {
    console.error('Error getting weekly availability:', error);
    return null;
  }
};

// Fix the function calls in mockCalendarService
const mockCalendarService = {
  getAvailabilityEvents: (clinicianId: string, timezone: string, startDate: Date | string, endDate: Date | string) => {
    return MockAvailabilityService.getMockAvailabilityEvents(clinicianId, timezone, startDate, endDate);
  },
  getAppointmentEvents: (clinicianId: string, timezone: string, startDate: Date | string, endDate: Date | string) => {
    return []; // Mock implementation
  },
  getTimeOffEvents: (clinicianId: string, timezone: string, startDate: Date | string, endDate: Date | string) => {
    return []; // Mock implementation
  },
  getWeeklyAvailability: (clinicianId: string) => {
    return MockAvailabilityService.getWeeklyAvailabilityForClinician(clinicianId);
  },
  getAvailabilitySettings: (clinicianId: string) => {
    return MockAvailabilityService.getSettingsForClinician(clinicianId);
  }
};

export default mockSupabaseClient;
