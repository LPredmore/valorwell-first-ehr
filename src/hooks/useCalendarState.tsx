import { useState, useEffect, useCallback, useMemo } from 'react';
import { useEntityState } from './useEntityState';
import { useAsyncState } from './useAsyncState';
import { useUserTimeZone } from '@/hooks/useUserTimeZone';
import { TimeZoneService } from '@/utils/timeZoneService';
import { ClientData } from '@/types/availability';
import { componentMonitor } from '@/utils/performance/componentMonitor';

/**
 * @hook useCalendarState
 * @description Hook for managing calendar state including clinician selection, client data,
 * appointment refresh state, and timezone handling. Provides a centralized state management
 * solution for calendar-related components.
 *
 * @param {string | null} initialClinicianId - Optional initial clinician ID to pre-select
 * @returns {object} Calendar state and actions
 * @returns {string | null} .selectedClinicianId - Currently selected clinician ID
 * @returns {function} .setSelectedClinicianId - Function to update the selected clinician
 * @returns {Array} .clinicians - List of available clinicians
 * @returns {boolean} .loadingClinicians - Whether clinicians are currently loading
 * @returns {Array<ClientData>} .clients - Normalized client data for the selected clinician
 * @returns {boolean} .loadingClients - Whether clients are currently loading
 * @returns {number} .appointmentRefreshTrigger - Counter to trigger appointment refresh
 * @returns {function} .refreshAppointments - Function to trigger appointment refresh
 * @returns {boolean} .isDialogOpen - Whether the calendar dialog is open
 * @returns {function} .setIsDialogOpen - Function to control dialog visibility
 * @returns {string} .timeZone - Current timezone in IANA format
 * @returns {function} .refreshClients - Function to refresh client data
 *
 * @example
 * // Basic usage in a calendar component
 * const {
 *   selectedClinicianId,
 *   setSelectedClinicianId,
 *   clinicians,
 *   clients,
 *   timeZone,
 *   refreshAppointments
 * } = useCalendarState();
 *
 * // Using the state to render a clinician selector
 * return (
 *   <div>
 *     <select
 *       value={selectedClinicianId || ''}
 *       onChange={(e) => setSelectedClinicianId(e.target.value || null)}
 *     >
 *       {clinicians.map(clinician => (
 *         <option key={clinician.id} value={clinician.id}>
 *           {clinician.clinician_professional_name}
 *         </option>
 *       ))}
 *     </select>
 *
 *     <CalendarView
 *       clinicianId={selectedClinicianId}
 *       clients={clients}
 *       timeZone={timeZone}
 *       onAppointmentChange={refreshAppointments}
 *     />
 *   </div>
 * );
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

  // Local state
  const [selectedClinicianId, setSelectedClinicianId] = useState<string | null>(initialClinicianId);
  const [appointmentRefreshTrigger, setAppointmentRefreshTrigger] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
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
  
  // Auto-select first clinician if needed
  useEffect(() => {
    if (clinicians.length > 0 && !selectedClinicianId) {
      setSelectedClinicianId(clinicians[0].id);
    }
  }, [clinicians, selectedClinicianId]);
  
  // Update clients query when clinician changes
  useEffect(() => {
    if (selectedClinicianId) {
      setClientsQuery({ client_assigned_therapist: selectedClinicianId });
    } else {
      setClientsQuery({});
    }
  }, [selectedClinicianId, setClientsQuery]);
  
  // Memoized refresh function
  const refreshAppointments = useCallback(() => {
    setAppointmentRefreshTrigger(prev => prev + 1);
  }, []);
  
  // Memoize return values to prevent unnecessary re-renders
  const calendarState = useMemo(() => ({
    selectedClinicianId,
    setSelectedClinicianId,
    clinicians,
    loadingClinicians,
    clients,
    loadingClients,
    appointmentRefreshTrigger,
    refreshAppointments,
    isDialogOpen,
    setIsDialogOpen,
    timeZone: TimeZoneService.ensureIANATimeZone(timeZone || 'UTC'),
    
    // Add additional methods for refreshing data
    refreshClients,
  }), [
    selectedClinicianId,
    clinicians,
    loadingClinicians,
    clients,
    loadingClients,
    appointmentRefreshTrigger,
    refreshAppointments,
    isDialogOpen,
    timeZone,
    refreshClients
  ]);
  
  return calendarState;
};
