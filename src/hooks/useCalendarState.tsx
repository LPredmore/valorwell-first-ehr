
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getUserTimeZone } from '@/utils/timeZoneUtils';
import { getClinicianTimeZone } from '@/hooks/useClinicianData';

interface Client {
  id: string;
  displayName: string;
}

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

  // Fetch clinician timezone
  useEffect(() => {
    const fetchClinicianTimeZone = async () => {
      if (selectedClinicianId) {
        setIsLoadingTimeZone(true);
        try {
          const timeZone = await getClinicianTimeZone(selectedClinicianId);
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
  }, [selectedClinicianId]);

  // Set user timezone
  useEffect(() => {
    if (clinicianTimeZone && !isLoadingTimeZone) {
      setUserTimeZone(clinicianTimeZone);
    } else {
      setUserTimeZone(getUserTimeZone());
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
      if (!selectedClinicianId) {
        console.log('Not fetching clients: clinicianId is null');
        return;
      }
      
      console.log('useCalendarState - Fetching clients for clinician:', selectedClinicianId);
      setLoadingClients(true);
      setClients([]);
      
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('id, client_preferred_name, client_last_name')
          .eq('client_assigned_therapist', selectedClinicianId)
          .order('client_last_name');
          
        if (error) {
          console.error('Error fetching clients:', error);
        } else {
          console.log('useCalendarState - Clients fetched successfully:', data);
          
          if (data.length === 0) {
            console.log('useCalendarState - No clients found for clinician:', selectedClinicianId);
          }
          
          const formattedClients = data.map(client => ({
            id: client.id,
            displayName: `${client.client_preferred_name || ''} ${client.client_last_name || ''}`.trim() || 'Unnamed Client'
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
  }, [selectedClinicianId]);

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
