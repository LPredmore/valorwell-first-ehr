import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TimeZoneService } from '@/utils/timeZoneService';
import { toast } from '@/hooks/use-toast';
import { useUserTimeZone } from '@/hooks/useUserTimeZone';
import { ClientDataService } from '@/services/ClientDataService';
import { ClientData } from '@/types/availability';

export const useCalendarState = (initialClinicianId: string | null = null) => {
  const [selectedClinicianId, setSelectedClinicianId] = useState<string | null>(initialClinicianId);
  const [clinicians, setClinicians] = useState<Array<{ id: string; clinician_professional_name: string }>>([]);
  const [loadingClinicians, setLoadingClinicians] = useState(true);
  const [clients, setClients] = useState<ClientData[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [appointmentRefreshTrigger, setAppointmentRefreshTrigger] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { timeZone } = useUserTimeZone(selectedClinicianId);

  // Fetch all clinicians
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
          toast({
            title: "Error loading clinicians",
            description: "Unable to load clinician list. Please try again.",
            variant: "destructive"
          });
        } else {
          setClinicians(data || []);
          console.log('[useCalendarState] Loaded clinicians:', data?.length || 0);
        }
      } catch (error) {
        console.error('[useCalendarState] Error:', error);
        toast({
          title: "Error loading clinicians",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoadingClinicians(false);
      }
    };

    fetchClinicians();
  }, []);

  // Auto-select first clinician if needed
  useEffect(() => {
    if (clinicians.length > 0 && !selectedClinicianId) {
      setSelectedClinicianId(clinicians[0].id);
    }
  }, [clinicians, selectedClinicianId]);

  // Fetch clients for the selected clinician
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
        // Using the correct column names as in the database schema
        const { data, error } = await supabase
          .from('clients')
          .select('id, client_first_name, client_last_name, client_preferred_name, client_email, client_phone, client_time_zone, created_at, updated_at')
          .eq('client_assigned_therapist', selectedClinicianId)
          .order('client_last_name', { ascending: true });

        if (error) {
          console.error('[useCalendarState] Error fetching clients:', error);
          toast({
            title: "Error loading clients",
            description: "Unable to load client list. Please try again.",
            variant: "destructive"
          });
          return;
        }

        if (data) {
          console.log('[useCalendarState] Raw client data:', data);
          const normalizedClients: ClientData[] = data.map(client => 
            ClientDataService.normalizeClientData(client)
          );
          setClients(normalizedClients);
          console.log('[useCalendarState] Loaded clients:', normalizedClients.length);
        }
      } catch (error) {
        console.error('[useCalendarState] Error in fetchClientsForClinician:', error);
        toast({
          title: "Error loading clients",
          description: "Unable to load client list. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoadingClients(false);
      }
    };

    fetchClientsForClinician();
  }, [selectedClinicianId]);

  const refreshAppointments = () => {
    setAppointmentRefreshTrigger(prev => prev + 1);
  };

  return {
    selectedClinicianId,
    setSelectedClinicianId,
    clinicians,
    loadingClinicians,
    clients,
    loadingClients,
    appointmentRefreshTrigger,
    setAppointmentRefreshTrigger,
    refreshAppointments,
    isDialogOpen,
    setIsDialogOpen,
    timeZone: TimeZoneService.ensureIANATimeZone(timeZone || 'UTC')
  };
};
