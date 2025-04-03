
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getUserTimeZone } from '@/utils/timeZoneUtils';
import { getClinicianTimeZone } from '@/hooks/useClinicianData';
import { ClientDetails } from '@/types/client';

export const useCalendarState = (initialClinicianId: string | null = null) => {
  const [showAvailability, setShowAvailability] = useState(false);
  const [selectedClinicianId, setSelectedClinicianId] = useState<string | null>(initialClinicianId);
  const [clinicians, setClinicians] = useState<Array<{ id: string; clinician_professional_name: string }>>([]);
  const [loadingClinicians, setLoadingClinicians] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [clients, setClients] = useState<ClientDetails[]>([]);
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
          setClinicians(data || []);
          if (data && data.length > 0 && !selectedClinicianId) {
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
      if (!selectedClinicianId) return;
      
      setLoadingClients(true);
      setClients([]);
      
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('*')  // Select all columns to satisfy the ClientDetails type
          .eq('client_assigned_therapist', selectedClinicianId)
          .order('client_last_name');
          
        if (error) {
          console.error('Error fetching clients:', error);
        } else {
          setClients(data || []);
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
