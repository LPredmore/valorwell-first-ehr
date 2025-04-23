
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getUserTimeZone } from '@/utils/timeZoneUtils';
import { toast } from 'sonner';  // Use direct import from sonner

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
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoadingClinicians(false);
      }
    };

    fetchClinicians();
  }, []);

  // If clinicians change and no clinician is selected, set the first one
  useEffect(() => {
    if (clinicians.length > 0 && !selectedClinicianId) {
      setSelectedClinicianId(clinicians[0].id);
      console.log('[useCalendarState] Auto-selected clinician:', clinicians[0].id, clinicians[0].clinician_professional_name);
    }
  }, [clinicians, selectedClinicianId]);

  // Load clients for selected clinician
  useEffect(() => {
    const fetchClientsForClinician = async () => {
      if (!selectedClinicianId) {
        setClients([]);
        setLoadingClients(false);
        console.log('[useCalendarState] No clinician selected, skipping client load.');
        return;
      }

      setLoadingClients(true);
      setClients([]);
      console.log('[useCalendarState] Fetching clients for clinician:', selectedClinicianId);

      try {
        // Convert UUID to string for comparison with TEXT column
        const { data, error } = await supabase
          .from('clients')
          .select('id, client_preferred_name, client_last_name')
          .eq('client_assigned_therapist', selectedClinicianId.toString())
          .order('client_last_name');

        if (error) {
          console.error('[useCalendarState] Error fetching clients:', error);
          throw error;
        }

        if (data) {
          const formattedClients = data.map(client => ({
            id: client.id,
            displayName: `${client.client_preferred_name || ''} ${client.client_last_name || ''}`.trim() || 'Unnamed Client'
          }));
          setClients(formattedClients);
          console.log('[useCalendarState] Loaded clients:', formattedClients);
        }
      } catch (error) {
        console.error('[useCalendarState] Error in fetchClientsForClinician:', error);
        // Using Sonner toast directly with message as first param
        toast.error("Unable to load client list. Please try again.");
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
