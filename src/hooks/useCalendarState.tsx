
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useEntityState } from './useEntityState';
import { useAsyncState } from './useAsyncState';
import { useUserTimeZone } from '@/hooks/useUserTimeZone';
import { TimeZoneService } from '@/utils/timezone';
import { ClientData } from '@/types/availability';
import { componentMonitor } from '@/utils/performance/componentMonitor';
import { useUser } from '@/context/UserContext';
import { formatAsUUID, isValidUUID } from '@/utils/validation/uuidUtils';
import { trackClinicianSelection } from '@/utils/calendarDebugUtils';

/**
 * @hook useCalendarState
 * @description Hook for managing calendar state including clinician selection, client data,
 * appointment refresh state, and timezone handling. Provides a centralized state management
 * solution for calendar-related components.
 */
export const useCalendarState = (initialClinicianId: string | null = null) => {
  // Performance monitoring
  useEffect(() => {
    const hookStartTime = performance.now();
    
    return () => {
      const totalHookTime = performance.now() - hookStartTime;
      componentMonitor.recordRender('useCalendarState', totalHookTime);
    };
  }, []);

  // User context to get current user data
  const { userId, isClinician, isLoading: isUserLoading } = useUser();
  
  // Local state
  const [selectedClinicianId, setSelectedClinicianId] = useState<string | null>(null);
  const [appointmentRefreshTrigger, setAppointmentRefreshTrigger] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [initializing, setInitializing] = useState(true);
  
  // Log initialization with initial clinician ID
  useEffect(() => {
    console.log('[useCalendarState] Initialized with:', {
      initialClinicianId,
      userId,
      isClinician,
      isUserLoading,
      selectedClinicianId
    });
  }, []);
  
  // Get user timezone
  const { timeZone } = useUserTimeZone(selectedClinicianId);
  
  // Fetch clinicians using useEntityState
  const {
    data: clinicians,
    isLoading: loadingClinicians,
  } = useEntityState<{ id: string; clinician_professional_name: string }>({
    entityType: 'clinicians',
    orderBy: { column: 'clinician_professional_name', ascending: true },
  });
  
  // Fetch clients for the selected clinician using useEntityState
  const {
    data: clientsRaw,
    isLoading: loadingClients,
    setQuery: setClientsQuery,
    refresh: refreshClients,
  } = useEntityState<Record<string, any>>({
    entityType: 'clients',
    initialQuery: selectedClinicianId ? { client_assigned_therapist: selectedClinicianId } : {},
    orderBy: { column: 'client_last_name', ascending: true },
    cacheTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Normalize client data
  const clients = useMemo(() => {
    return clientsRaw.map(client => {
      // Extract client fields with proper naming
      const normalizedClient: ClientData = {
        id: client.id,
        name: `${client.client_first_name || ''} ${client.client_last_name || ''}`.trim(),
        displayName: client.client_preferred_name || `${client.client_first_name || ''} ${client.client_last_name || ''}`.trim(),
        email: client.client_email || '',
        phone: client.client_phone || '',
        timeZone: client.client_time_zone || '',
        createdAt: client.created_at,
        updatedAt: client.updated_at,
      };
      
      return normalizedClient;
    });
  }, [clientsRaw]);

  // Initialize clinician ID selection with proper priority
  useEffect(() => {
    // Skip initialization if user context is still loading
    if (isUserLoading) {
      console.log('[useCalendarState] User context still loading, deferring clinician initialization');
      return;
    }
    
    // Skip if we've already initialized
    if (!initializing) return;
    
    console.log('[useCalendarState] Running clinician initialization', {
      userId,
      isClinician,
      initialClinicianId,
      selectedClinicianId,
      cliniciansLoaded: !loadingClinicians && clinicians.length > 0
    });
    
    // PRIORITY 1: If the user is a clinician, use their ID
    if (isClinician && userId) {
      const formattedId = formatAsUUID(userId);
      console.log('[useCalendarState] Setting clinician ID to current user (clinician):', formattedId);
      
      trackClinicianSelection('auto-select', {
        source: 'currentUserIsClinician',
        selectedClinicianId: formattedId,
        previousClinicianId: selectedClinicianId,
        userId
      });
      
      setSelectedClinicianId(formattedId);
      setInitializing(false);
      return;
    }
    
    // PRIORITY 2: If we have an initialClinicianId, use that
    if (initialClinicianId) {
      const formattedId = formatAsUUID(initialClinicianId);
      console.log('[useCalendarState] Setting clinician ID to initialClinicianId:', formattedId);
      
      trackClinicianSelection('auto-select', {
        source: 'initialClinicianId',
        selectedClinicianId: formattedId,
        previousClinicianId: selectedClinicianId,
        userId
      });
      
      setSelectedClinicianId(formattedId);
      setInitializing(false);
      return;
    }
    
    // PRIORITY 3: If clinicians are loaded and there's at least one, use the first one
    if (!loadingClinicians && clinicians.length > 0) {
      const firstClinicianId = clinicians[0].id;
      const formattedId = formatAsUUID(firstClinicianId);
      
      console.log('[useCalendarState] Setting clinician ID to first available clinician:', formattedId);
      
      trackClinicianSelection('auto-select', {
        source: 'firstAvailableClinician',
        selectedClinicianId: formattedId,
        previousClinicianId: selectedClinicianId,
        userId,
        availableClinicians: clinicians.map(c => ({
          id: c.id,
          name: c.clinician_professional_name
        }))
      });
      
      setSelectedClinicianId(formattedId);
      setInitializing(false);
      return;
    }
    
    // If we've loaded clinicians but there aren't any, mark as initialized
    if (!loadingClinicians) {
      setInitializing(false);
    }
    
  }, [
    userId, 
    isClinician, 
    initialClinicianId, 
    clinicians, 
    loadingClinicians, 
    selectedClinicianId, 
    isUserLoading, 
    initializing
  ]);
  
  // Update clients query when clinician changes
  useEffect(() => {
    if (selectedClinicianId) {
      console.log(`[useCalendarState] Updating clients query for clinician: ${selectedClinicianId}`);
      setClientsQuery({ client_assigned_therapist: selectedClinicianId });
    } else {
      setClientsQuery({});
    }
  }, [selectedClinicianId, setClientsQuery]);
  
  // Custom setter for selectedClinicianId that ensures UUID format
  const setFormattedClinicianId = useCallback((id: string | null) => {
    if (!id) {
      console.log('[useCalendarState] Setting clinician ID to null');
      setSelectedClinicianId(null);
      return;
    }
    
    const formattedId = formatAsUUID(id);
    
    console.log(`[useCalendarState] Setting clinician ID: ${id} → ${formattedId}`);
    setSelectedClinicianId(formattedId);
  }, []);
  
  // Memoized refresh function
  const refreshAppointments = useCallback(() => {
    console.log('[useCalendarState] Triggering appointment refresh');
    setAppointmentRefreshTrigger(prev => prev + 1);
  }, []);
  
  // Memoize return values to prevent unnecessary re-renders
  const calendarState = useMemo(() => ({
    selectedClinicianId,
    setSelectedClinicianId: setFormattedClinicianId,
    clinicians,
    loadingClinicians,
    clients,
    loadingClients,
    appointmentRefreshTrigger,
    refreshAppointments,
    isDialogOpen,
    setIsDialogOpen,
    timeZone: TimeZoneService.ensureIANATimeZone(timeZone || 'UTC'),
    isClinician,
    userId,
    isUserLoading,
    initializing,
    
    // Add additional methods for refreshing data
    refreshClients,
  }), [
    selectedClinicianId,
    setFormattedClinicianId,
    clinicians,
    loadingClinicians,
    clients,
    loadingClients,
    appointmentRefreshTrigger,
    refreshAppointments,
    isDialogOpen,
    timeZone,
    refreshClients,
    isClinician,
    userId,
    isUserLoading,
    initializing
  ]);
  
  return calendarState;
};
