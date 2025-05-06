
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getUserTimeZone } from '@/utils/timeZoneUtils';
import { getClinicianTimeZone, getClinicianById } from '@/hooks/useClinicianData';
import { TimeZoneService } from '@/utils/timeZoneService';

interface Client {
  id: string;
  displayName: string;
}

// Helper function to ensure consistent ID format for database queries
const ensureStringId = (id: string | null): string | null => {
  if (!id) return null;
  
  // Ensure the ID is a clean string without any format issues
  return id.toString().trim();
};

export const useCalendarState = (initialClinicianId: string | null = null) => {
  const [view, setView] = useState<'week' | 'month'>('week');
  const [showAvailability, setShowAvailability] = useState(false);
  const [selectedClinicianId, setSelectedClinicianId] = useState<string | null>(initialClinicianId);
  const [clinicians, setClinicians] = useState<Array<{ id: string; clinician_professional_name: string }>>([]);
  const [loadingClinicians, setLoadingClinicians] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [appointmentRefreshTrigger, setAppointmentRefreshTrigger] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [clinicianTimeZone, setClinicianTimeZone] = useState<string>(TimeZoneService.DEFAULT_TIMEZONE);
  const [isLoadingTimeZone, setIsLoadingTimeZone] = useState(true);
  const [userTimeZone, setUserTimeZone] = useState<string>(TimeZoneService.DEFAULT_TIMEZONE);

  const formattedClinicianId = ensureStringId(selectedClinicianId);
  
  // Log important state information
  useEffect(() => {
    console.log('[useCalendarState] Current state:', {
      view,
      clinicianId: formattedClinicianId,
      originalClinicianId: selectedClinicianId,
      timeZone: userTimeZone,
      clinicianTimeZone,
      isLoadingTimeZone,
      refreshTrigger: appointmentRefreshTrigger
    });
  }, [view, selectedClinicianId, formattedClinicianId, userTimeZone, clinicianTimeZone, isLoadingTimeZone, appointmentRefreshTrigger]);
  
  // Fetch clinician timezone
  useEffect(() => {
    const fetchClinicianTimeZone = async () => {
      if (formattedClinicianId) {
        setIsLoadingTimeZone(true);
        try {
          const timeZone = await getClinicianTimeZone(formattedClinicianId);
          console.log("[useCalendarState] Fetched clinician timezone:", timeZone);
          setClinicianTimeZone(TimeZoneService.ensureIANATimeZone(timeZone));
        } catch (error) {
          console.error("[useCalendarState] Error fetching clinician timezone:", error);
        } finally {
          setIsLoadingTimeZone(false);
        }
      }
    };
    
    fetchClinicianTimeZone();
  }, [formattedClinicianId]);

  // Set user timezone
  useEffect(() => {
    if (clinicianTimeZone && !isLoadingTimeZone) {
      // For clinician views, use clinician's timezone
      setUserTimeZone(TimeZoneService.ensureIANATimeZone(clinicianTimeZone));
    } else {
      // Fallback to browser timezone
      setUserTimeZone(TimeZoneService.ensureIANATimeZone(getUserTimeZone()));
    }
  }, [clinicianTimeZone, isLoadingTimeZone]);

  // Load clinicians
  useEffect(() => {
    const fetchClinicians = async () => {
      setLoadingClinicians(true);
      try {
        const { data, error } = await supabase
          .from('clinicians')
          .select('id, clinician_professional_name')
          .order('clinician_professional_name');

        if (error) {
          console.error('[useCalendarState] Error fetching clinicians:', error);
        } else {
          console.log('[useCalendarState] Fetched clinicians:', data?.length);
          setClinicians(data || []);
          
          // Only set default clinician if none was provided and we don't already have one
          if (data && data.length > 0 && !initialClinicianId && !selectedClinicianId) {
            console.log('[useCalendarState] Setting default clinician:', data[0].id);
            setSelectedClinicianId(data[0].id);
          }
        }
      } catch (error) {
        console.error('[useCalendarState] Error:', error);
      } finally {
        setLoadingClinicians(false);
      }
    };

    fetchClinicians();
  }, [initialClinicianId]);

  // Load clients for selected clinician
  useEffect(() => {
    const fetchClientsForClinician = async () => {
      if (!formattedClinicianId) {
        console.log('[useCalendarState] Not fetching clients: clinicianId is null');
        return;
      }
      
      console.log('[useCalendarState] Fetching clients for clinician ID:', formattedClinicianId);
      setLoadingClients(true);
      setClients([]);
      
      try {
        // First, fetch the clinician record to get the correctly formatted ID from the database
        console.log('[useCalendarState] Calling getClinicianById with ID:', formattedClinicianId);
        const clinicianRecord = await getClinicianById(formattedClinicianId);
        console.log('[useCalendarState] Clinician record returned:', !!clinicianRecord);
        
        if (!clinicianRecord) {
          console.error('[useCalendarState] Could not find clinician with ID:', formattedClinicianId);
          setLoadingClients(false);
          return;
        }
        
        // Use the database-retrieved ID to ensure exact format match
        const databaseClinicianId = clinicianRecord.id;
        console.log('[useCalendarState] Database-retrieved clinician ID:', databaseClinicianId);
        
        // Query for clients assigned to this clinician
        const { data: clientData, error } = await supabase
          .from('clients')
          .select('id, client_first_name, client_preferred_name, client_last_name')
          .eq('client_assigned_therapist', databaseClinicianId)
          .order('client_last_name');
          
        if (error) {
          console.error('[useCalendarState] Error fetching clients:', error);
        } else {
          console.log(`[useCalendarState] Found ${clientData?.length || 0} clients for clinician:`, databaseClinicianId);
          
          // Format client data for display
          const formattedClients = (clientData || []).map(client => ({
            id: client.id,
            displayName: `${client.client_preferred_name || client.client_first_name || ''} ${client.client_last_name || ''}`.trim() || 'Unnamed Client'
          }));
          
          setClients(formattedClients);
        }
      } catch (error) {
        console.error('[useCalendarState] Error fetching clients:', error);
      } finally {
        setLoadingClients(false);
      }
    };

    fetchClientsForClinician();
  }, [formattedClinicianId]);

  return {
    view,
    setView,
    showAvailability,
    setShowAvailability,
    selectedClinicianId,
    setSelectedClinicianId,
    clinicians,
    loadingClinicians,
    currentDate,
    setCurrentDate,
    clients,
    loadingClients,
    appointmentRefreshTrigger,
    setAppointmentRefreshTrigger,
    isDialogOpen,
    setIsDialogOpen,
    userTimeZone,
    clinicianTimeZone,
    isLoadingTimeZone,
  };
};

export default useCalendarState;
