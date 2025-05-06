
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getUserTimeZone } from '@/utils/timeZoneUtils';
import { getClinicianTimeZone } from '@/hooks/useClinicianData';
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
  const [clinicianTimeZone, setClinicianTimeZone] = useState<string>('America/Chicago');
  const [isLoadingTimeZone, setIsLoadingTimeZone] = useState(true);
  const [userTimeZone, setUserTimeZone] = useState<string>('');

  const formattedClinicianId = ensureStringId(selectedClinicianId);
  
  // Fetch clinician timezone
  useEffect(() => {
    const fetchClinicianTimeZone = async () => {
      if (formattedClinicianId) {
        setIsLoadingTimeZone(true);
        try {
          const timeZone = await getClinicianTimeZone(formattedClinicianId);
          console.log("Fetched clinician timezone:", timeZone);
          setClinicianTimeZone(timeZone);
        } catch (error) {
          console.error("Error fetching clinician timezone:", error);
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
      setUserTimeZone(TimeZoneService.ensureIANATimeZone(clinicianTimeZone));
    } else {
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
          console.error('Error fetching clinicians:', error);
        } else {
          console.log('Fetched clinicians:', data);
          setClinicians(data || []);
          if (data && data.length > 0 && !selectedClinicianId) {
            console.log('Setting default clinician:', data[0].id);
            setSelectedClinicianId(data[0].id);
          }
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoadingClinicians(false);
      }
    };

    fetchClinicians();
  }, []);

  // Load clients for selected clinician
  useEffect(() => {
    const fetchClientsForClinician = async () => {
      if (!formattedClinicianId) {
        console.log('Not fetching clients: clinicianId is null');
        return;
      }
      
      console.log('useCalendarState - Fetching clients for clinician ID (FORMATTED):', formattedClinicianId);
      console.log('useCalendarState - Original clinician ID before formatting:', selectedClinicianId);
      setLoadingClients(true);
      setClients([]);
      
      try {
        // Use text comparison since client_assigned_therapist is a TEXT column
        const { data, error } = await supabase
          .from('clients')
          .select('id, client_first_name, client_preferred_name, client_last_name')
          .eq('client_assigned_therapist', formattedClinicianId)
          .order('client_last_name');
          
        if (error) {
          console.error('Error fetching clients:', error);
        } else {
          console.log('useCalendarState - Clients fetched successfully:', data);
          console.log('useCalendarState - formattedClinicianId used for query:', formattedClinicianId);
          
          if (data.length === 0) {
            console.log('useCalendarState - No clients found for clinician:', formattedClinicianId);
            console.log('useCalendarState - Database query returned empty for client_assigned_therapist:', formattedClinicianId);
            
            // Additional debug query to check if any clients exist with this therapist
            const { data: rawData, error: rawError } = await supabase
              .rpc('debug_client_therapist_matching', { 
                p_therapist_id: formattedClinicianId 
              });
              
            if (!rawError && rawData) {
              console.log('useCalendarState - Debug query results:', rawData);
            }
          }
          
          const formattedClients = data.map(client => ({
            id: client.id,
            displayName: `${client.client_preferred_name || client.client_first_name || ''} ${client.client_last_name || ''}`.trim() || 'Unnamed Client'
          }));
          console.log('useCalendarState - Formatted clients:', formattedClients);
          setClients(formattedClients);
        }
      } catch (error) {
        console.error('Error:', error);
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
    isLoadingTimeZone,
  };
};
