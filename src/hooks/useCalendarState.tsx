
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
  const { userId, isClinician } = useUser();
  
  // Local state
  const [selectedClinicianId, setSelectedClinicianId] = useState<string | null>(null);
  const [appointmentRefreshTrigger, setAppointmentRefreshTrigger] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Log initialization with initial clinician ID
  useEffect(() => {
    console.log('[useCalendarState] Initialized with:', {
      initialClinicianId,
      userId,
      isClinician,
      selectedClinicianId: selectedClinicianId
    });
    
    // Format any IDs to ensure consistent UUID format
    if (initialClinicianId && initialClinicianId !== selectedClinicianId) {
      const formattedId = isValidUUID(initialClinicianId) 
        ? initialClinicianId 
        : formatAsUUID(initialClinicianId);
        
      if (formattedId) {
        trackClinicianSelection('init', {
          source: 'initialClinicianId',
          selectedClinicianId: formattedId,
          previousClinicianId: null,
          userId
        });
        
        setSelectedClinicianId(formattedId);
      }
    }
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
    // Only proceed if we don't have a selected clinician ID yet
    if (!selectedClinicianId) {
      // If the user is a clinician, use their ID
      if (isClinician && userId) {
        const formattedId = isValidUUID(userId) ? userId : formatAsUUID(userId);
        if (formattedId) {
          console.log(`[useCalendarState] Setting clinician ID to current user (clinician): ${formattedId}`);
          
          trackClinicianSelection('auto-select', {
            source: 'currentUserIsClinician',
            selectedClinicianId: formattedId,
            previousClinicianId: selectedClinicianId,
            userId
          });
          
          setSelectedClinicianId(formattedId);
          return;
        }
      }
      
      // If we have an initialClinicianId, use that
      if (initialClinicianId) {
        const formattedId = isValidUUID(initialClinicianId) ? initialClinicianId : formatAsUUID(initialClinicianId);
        if (formattedId) {
          console.log(`[useCalendarState] Setting clinician ID to initialClinicianId: ${formattedId}`);
          
          trackClinicianSelection('auto-select', {
            source: 'initialClinicianId',
            selectedClinicianId: formattedId,
            previousClinicianId: selectedClinicianId,
            userId
          });
          
          setSelectedClinicianId(formattedId);
          return;
        }
      }
      
      // If clinicians are loaded and there's at least one, use the first one
      if (!loadingClinicians && clinicians.length > 0) {
        const firstClinicianId = clinicians[0].id;
        const formattedId = isValidUUID(firstClinicianId) ? firstClinicianId : formatAsUUID(firstClinicianId);
        
        if (formattedId) {
          console.log(`[useCalendarState] Setting clinician ID to first available clinician: ${formattedId}`);
          
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
          return;
        }
      }
    } else {
      // We have a selected clinician ID, but let's make sure it's formatted properly
      const formattedId = isValidUUID(selectedClinicianId) ? selectedClinicianId : formatAsUUID(selectedClinicianId);
      if (formattedId && formattedId !== selectedClinicianId) {
        console.log(`[useCalendarState] Reformatting clinician ID: ${selectedClinicianId} → ${formattedId}`);
        setSelectedClinicianId(formattedId);
      }
    }
  }, [userId, isClinician, initialClinicianId, clinicians, loadingClinicians, selectedClinicianId]);
  
  // Update clients query when clinician changes
  useEffect(() => {
    if (selectedClinicianId) {
      setClientsQuery({ client_assigned_therapist: selectedClinicianId });
    } else {
      setClientsQuery({});
    }
  }, [selectedClinicianId, setClientsQuery]);
  
  // Custom setter for selectedClinicianId that ensures UUID format
  const setFormattedClinicianId = useCallback((id: string | null) => {
    if (!id) {
      setSelectedClinicianId(null);
      return;
    }
    
    const formattedId = isValidUUID(id) ? id : formatAsUUID(id);
    
    if (formattedId && formattedId !== id) {
      console.log(`[useCalendarState] Formatted clinician ID during set: ${id} → ${formattedId}`);
    }
    
    setSelectedClinicianId(formattedId || id);
  }, []);
  
  // Memoized refresh function
  const refreshAppointments = useCallback(() => {
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
    userId
  ]);
  
  return calendarState;
};
