import { supabase } from './client';
import mockCalendarService from '@/services/mock/MockCalendarService';
import mockAvailabilityService from '@/services/mock/MockAvailabilityService';

/**
 * List of tables that should be intercepted and mocked
 */
const MOCK_TABLES = [
  'appointments',
  'availability_blocks',
  'availability_exceptions',
  'availability_settings',
  'calendar_events',
  'calendar_events_with_rules',
  'calendar_exceptions',
  'calendar_settings',
  'recurrence_patterns',
  'recurrence_rules',
  'time_off',
  'unified_calendar_view',
];

/**
 * Create a mock implementation for Supabase's from() method
 */
const originalFrom = supabase.from;
supabase.from = function(table: string) {
  console.log(`[MockClient] Intercepting request to table: ${table}`);

  // If this table should be mocked
  if (MOCK_TABLES.includes(table)) {
    console.log(`[MockClient] Using mock implementation for table: ${table}`);
    
    // Return mock implementation
    return {
      select: () => ({
        eq: (column: string, value: any) => ({
          single: () => mockQueryHandler(table, 'select-eq-single', { column, value }),
          maybeSingle: () => mockQueryHandler(table, 'select-eq-maybeSingle', { column, value }),
          order: () => ({
            range: () => mockQueryHandler(table, 'select-eq-order-range', { column, value }),
          }),
          gte: (column2: string, value2: any) => ({
            lte: (column3: string, value3: any) => 
              mockQueryHandler(table, 'select-eq-gte-lte', { column, value, column2, value2, column3, value3 }),
          }),
        }),
        in: (column: string, values: any[]) => ({
          order: () => mockQueryHandler(table, 'select-in-order', { column, values }),
        }),
        order: () => mockQueryHandler(table, 'select-order', {}),
        range: () => mockQueryHandler(table, 'select-range', {}),
        single: () => mockQueryHandler(table, 'select-single', {}),
        maybeSingle: () => mockQueryHandler(table, 'select-maybeSingle', {}),
      }),
      insert: (data: any) => ({
        select: () => ({
          single: () => mockQueryHandler(table, 'insert-select-single', { data }),
          maybeSingle: () => mockQueryHandler(table, 'insert-select-maybeSingle', { data }),
        }),
      }),
      update: (data: any) => ({
        eq: (column: string, value: any) => ({
          select: () => ({
            single: () => mockQueryHandler(table, 'update-eq-select-single', { data, column, value }),
            maybeSingle: () => mockQueryHandler(table, 'update-eq-select-maybeSingle', { data, column, value }),
          }),
        }),
      }),
      delete: () => ({
        eq: (column: string, value: any) => mockQueryHandler(table, 'delete-eq', { column, value }),
      }),
    };
  }
  
  // Otherwise use the original implementation
  return originalFrom.call(supabase, table);
};

/**
 * Handle mocked queries based on the operation type and table
 */
async function mockQueryHandler(
  table: string, 
  operation: string, 
  params: any
): Promise<{ data: any; error: any }> {
  try {
    console.log(`[MockClient] Handling operation: ${operation} for table: ${table}`, params);
    
    switch (table) {
      case 'calendar_events':
      case 'calendar_events_with_rules':
      case 'unified_calendar_view':
        return handleCalendarEventsQuery(operation, params);
      
      case 'availability_blocks':
      case 'availability_settings':
      case 'availability_exceptions':
        return handleAvailabilityQuery(operation, params);
      
      case 'appointments':
        return handleAppointmentsQuery(operation, params);
      
      case 'time_off':
        return handleTimeOffQuery(operation, params);
      
      case 'recurrence_patterns':
      case 'recurrence_rules':
      case 'calendar_exceptions':
        return handleRecurrenceQuery(operation, params);
      
      case 'calendar_settings':
        return handleCalendarSettingsQuery(operation, params);
      
      default:
        console.warn(`[MockClient] No mock implementation for table: ${table}`);
        return { data: null, error: null };
    }
  } catch (error) {
    console.error(`[MockClient] Error handling mock query:`, error);
    return { data: null, error: { message: String(error) } };
  }
}

/**
 * Handle calendar events queries
 */
async function handleCalendarEventsQuery(
  operation: string,
  params: any
): Promise<{ data: any; error: any }> {
  switch (operation) {
    case 'select-eq-single':
    case 'select-eq-maybeSingle':
      if (params.column === 'id') {
        // Get event by ID - simulate by getting all events and filtering
        const clinicianId = localStorage.getItem('last_clinician_id') || '';
        const timezone = localStorage.getItem('user_timezone') || 'America/Chicago';
        const allEvents = await mockCalendarService.getAllEvents(clinicianId, timezone);
        const event = allEvents.find(e => e.id === params.value);
        return { data: event || null, error: null };
      }
      
      if (params.column === 'clinician_id') {
        // Store clinician ID for later use
        localStorage.setItem('last_clinician_id', params.value);
        
        // Get events by clinician ID
        const timezone = localStorage.getItem('user_timezone') || 'America/Chicago';
        const events = await mockCalendarService.getAllEvents(params.value, timezone);
        return { data: events, error: null };
      }
      
      return { data: null, error: null };
    
    case 'select-eq-gte-lte':
      // This is typically used for date range queries
      if (
        params.column === 'clinician_id' && 
        params.column2 === 'start_time' && 
        params.column3 === 'end_time'
      ) {
        const timezone = localStorage.getItem('user_timezone') || 'America/Chicago';
        const events = await mockCalendarService.getEventsInRange(
          params.value,  // clinicianId
          params.value2, // startDate
          params.value3, // endDate
          timezone
        );
        return { data: events, error: null };
      }
      
      return { data: [], error: null };
    
    case 'insert-select-single':
    case 'insert-select-maybeSingle':
      // Create a new calendar event
      const timezone = localStorage.getItem('user_timezone') || 'America/Chicago';
      const newEvent = await mockCalendarService.createEvent(params.data, timezone);
      return { data: newEvent, error: null };
    
    case 'update-eq-select-single':
    case 'update-eq-select-maybeSingle':
      // Update an existing calendar event
      if (params.column === 'id') {
        const timezone = localStorage.getItem('user_timezone') || 'America/Chicago';
        const updatedEvent = await mockCalendarService.updateEvent(
          { ...params.data, id: params.value },
          timezone
        );
        return { data: updatedEvent, error: null };
      }
      
      return { data: null, error: null };
    
    case 'delete-eq':
      // Delete a calendar event
      if (params.column === 'id') {
        const success = await mockCalendarService.deleteEvent(params.value);
        return { data: success ? {} : null, error: success ? null : { message: 'Failed to delete event' } };
      }
      
      return { data: null, error: null };
    
    default:
      console.warn(`[MockClient] Unhandled calendar events operation: ${operation}`);
      return { data: null, error: null };
  }
}

/**
 * Handle availability queries
 */
async function handleAvailabilityQuery(
  operation: string,
  params: any
): Promise<{ data: any; error: any }> {
  switch (operation) {
    case 'select-eq-single':
    case 'select-eq-maybeSingle':
      if (params.column === 'clinician_id') {
        // For availability_settings
        if (operation.includes('availability_settings')) {
          const settings = await mockAvailabilityService.getSettingsForClinician(params.value);
          return { data: settings, error: null };
        }
      }
      
      return { data: null, error: null };
    
    case 'insert-select-single':
    case 'insert-select-maybeSingle':
      // For creating new availability slots or settings
      if (params.data.event_type === 'availability' || params.data.availability_type) {
        const clinicianId = params.data.clinician_id;
        const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' }) as any;
        const startTime = params.data.start_time ? new Date(params.data.start_time).toTimeString().slice(0, 5) : '09:00';
        const endTime = params.data.end_time ? new Date(params.data.end_time).toTimeString().slice(0, 5) : '10:00';
        const result = await mockAvailabilityService.createAvailabilitySlot(
          clinicianId,
          dayOfWeek,
          startTime,
          endTime,
          params.data.availability_type === 'recurring',
          params.data.recurrence_rule,
          params.data.time_zone
        );
        return { data: { id: result.id }, error: null };
      }
      
      if (operation.includes('availability_settings')) {
        const settings = await mockAvailabilityService.updateSettings(params.data.clinician_id, params.data);
        return { data: settings, error: null };
      }
      
      return { data: null, error: null };
    
    case 'update-eq-select-single':
    case 'update-eq-select-maybeSingle':
      // For updating availability slots or settings
      if (params.column === 'id') {
        const success = await mockAvailabilityService.updateAvailabilitySlot(params.value, params.data);
        return { data: success ? { id: params.value } : null, error: success ? null : { message: 'Failed to update slot' } };
      }
      
      if (params.column === 'clinician_id' && operation.includes('availability_settings')) {
        const settings = await mockAvailabilityService.updateSettings(params.value, params.data);
        return { data: settings, error: null };
      }
      
      return { data: null, error: null };
    
    case 'delete-eq':
      // For deleting availability slots
      if (params.column === 'id') {
        const success = await mockAvailabilityService.deleteAvailabilitySlot(params.value);
        return { data: success ? {} : null, error: success ? null : { message: 'Failed to delete slot' } };
      }
      
      return { data: null, error: null };
    
    default:
      console.warn(`[MockClient] Unhandled availability operation: ${operation}`);
      return { data: null, error: null };
  }
}

/**
 * Handle appointments queries
 */
async function handleAppointmentsQuery(
  operation: string,
  params: any
): Promise<{ data: any; error: any }> {
  // Treat appointments as special calendar events
  return handleCalendarEventsQuery(operation, params);
}

/**
 * Handle time off queries
 */
async function handleTimeOffQuery(
  operation: string,
  params: any
): Promise<{ data: any; error: any }> {
  // Treat time off as special calendar events
  return handleCalendarEventsQuery(operation, params);
}

/**
 * Handle recurrence queries
 */
async function handleRecurrenceQuery(
  operation: string,
  params: any
): Promise<{ data: any; error: any }> {
  // Simple mock for recurrence patterns
  switch (operation) {
    case 'insert-select-single':
    case 'insert-select-maybeSingle':
      return { data: { id: `mock_recurrence_${Date.now()}`, ...params.data }, error: null };
    
    default:
      return { data: null, error: null };
  }
}

/**
 * Handle calendar settings queries
 */
async function handleCalendarSettingsQuery(
  operation: string,
  params: any
): Promise<{ data: any; error: any }> {
  // Use availability settings for calendar settings
  return handleAvailabilityQuery(operation, params);
}

// Initialize with some sample data
mockCalendarService.initializeSampleData('default_clinician');

// Export the mocked supabase client
export { supabase };

export const availabilityService = {
  getSettingsForClinician: MockAvailabilityService.getSettingsForClinician,
  createAvailabilitySlot: MockAvailabilityService.createAvailabilitySlot,
  updateSettings: MockAvailabilityService.updateSettings,
  updateAvailabilitySlot: MockAvailabilityService.updateAvailabilitySlot,
  deleteAvailabilitySlot: MockAvailabilityService.deleteAvailabilitySlot,
  getWeeklyAvailabilityForClinician: () => ({
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: []
  }),
  calculateAvailableSlots: () => []
};
