import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ensureIANATimeZone } from '@/utils/timeZoneUtils';
import { toast } from '@/components/ui/use-toast';
import { useUserTimeZone } from '@/hooks/useUserTimeZone';

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
  const { timeZone } = useUserTimeZone(selectedClinicianId);

  const validTimeZone = ensureIANATimeZone(timeZone || 'UTC');

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

  useEffect(() => {
    if (clinicians.length > 0 && !selectedClinicianId) {
      setSelectedClinicianId(clinicians[0].id);
      console.log('[useCalendarState] Auto-selected clinician:', clinicians[0].id, clinicians[0].clinician_professional_name);
    }
  }, [clinicians, selectedClinicianId]);

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
        const { data, error } = await supabase
          .from('clients')
          .select('id, client_preferred_name, client_last_name')
          .eq('client_assigned_therapist', selectedClinicianId.toString())
          .order('client_last_name');

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
          const formattedClients = data.map(client => ({
            id: client.id,
            displayName: `${client.client_preferred_name || ''} ${client.client_last_name || ''}`.trim() || 'Unnamed Client'
          }));
          setClients(formattedClients);
          console.log('[useCalendarState] Loaded clients:', formattedClients.length);
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
    console.log('[useCalendarState] Triggering appointment refresh');
    setAppointmentRefreshTrigger(prev => prev + 1);
  };

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
    refreshAppointments,
    isDialogOpen,
    setIsDialogOpen,
    timeZone: validTimeZone
  };
};
