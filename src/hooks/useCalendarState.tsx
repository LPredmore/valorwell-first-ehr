import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TimeZoneService } from '@/utils/timeZoneService';
import { toast } from '@/components/ui/use-toast';
import { useUserTimeZone } from '@/hooks/useUserTimeZone';
import { ClientDataService } from '@/services/ClientDataService';
import { ClientData } from '@/types/availability';

/**
 * Custom hook for managing calendar state
 * This hook manages the state for the calendar page and related components
 */
export const useCalendarState = (initialClinicianId: string | null = null) => {
  const [showAvailability, setShowAvailability] = useState(false);
  const [selectedClinicianId, setSelectedClinicianId] = useState<string | null>(initialClinicianId);
  const [clinicians, setClinicians] = useState<Array<{ id: string; clinician_professional_name: string }>>([]);
  const [loadingClinicians, setLoadingClinicians] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [clients, setClients] = useState<ClientData[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [appointmentRefreshTrigger, setAppointmentRefreshTrigger] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { timeZone } = useUserTimeZone(selectedClinicianId);

  const validTimeZone = TimeZoneService.ensureIANATimeZone(timeZone || 'UTC');

  // Fetch all clinicians
  useEffect(() => {
    const fetchClinicians = async () => {
      setLoadingClinicians(true);
      try {
        // Query profiles for clinicians since clinician_id is now properly typed as UUID
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
      console.log('[useCalendarState] Auto-selected clinician:', clinicians[0].id, clinicians[0].clinician_professional_name);
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
        const { data, error } = await supabase
          .from('clients')
          .select('id, name, email, phone, time_zone, created_at, updated_at')
          .eq('client_assigned_therapist', selectedClinicianId)
          .order('name');

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
          const normalizedClients: ClientData[] = data.map(client => ({
            id: client.id,
            name: client.name || 'Unnamed Client',
            email: client.email,
            phone: client.phone,
            timeZone: client.time_zone || 'America/Chicago',
            displayName: ClientDataService.formatClientName(client, 'Unnamed Client'),
            createdAt: client.created_at,
            updatedAt: client.updated_at
          }));
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

  // Function to refresh appointments
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
