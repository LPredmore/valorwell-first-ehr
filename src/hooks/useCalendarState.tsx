
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getUserTimeZone } from '@/utils/timeZoneUtils';

interface Client {
  id: string;
  displayName: string;
}

export const useCalendarState = (initialClinicianId: string | null = null) => {
  const [showAvailability, setShowAvailability] = useState(false);
  const [selectedClinicianId, setSelectedClinicianId] = useState<string | null>(initialClinicianId);
  const [clinicians, setClinicians] = useState<Array<{ id: string; clinician_professional_name: string }>>([]);
  const [loadingClinicians, setLoadingClinicians] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [appointmentRefreshTrigger, setAppointmentRefreshTrigger] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
          .select('id, client_preferred_name, client_last_name')
          .eq('client_assigned_therapist', selectedClinicianId)
          .order('client_last_name');
          
        if (error) {
          console.error('Error fetching clients:', error);
        } else {
          const formattedClients = data.map(client => ({
            id: client.id,
            displayName: `${client.client_preferred_name || ''} ${client.client_last_name || ''}`.trim() || 'Unnamed Client'
          }));
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
  };
};
