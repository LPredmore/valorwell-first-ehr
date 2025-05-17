
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppointmentType } from "@/types/appointment";
import { useToast } from "@/hooks/use-toast";
import { processAppointmentsForLegacyComponents } from "@/utils/calendarUtils";

interface UseAppointmentsProps {
  clientId?: string | null;
  clinicianId?: string | null;
  limit?: number;
  pastAppointments?: boolean;
  timeZone?: string;
}

export const useAppointments = ({
  clientId = null,
  clinicianId = null,
  limit = 10,
  pastAppointments = false,
  timeZone = 'America/Chicago'
}: UseAppointmentsProps) => {
  const [appointments, setAppointments] = useState<AppointmentType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        console.log(`Fetching appointments for ${clientId ? 'client: ' + clientId : ''} ${clinicianId ? 'clinician: ' + clinicianId : ''}`);
        console.log(`Using time zone: ${timeZone}`);

        // Construct the query
        let query = supabase
          .from('appointments')
          .select(`
            id,
            client_id,
            clinician_id,
            start_at,
            end_at,
            type,
            status,
            notes,
            video_room_url,
            recurring_group_id,
            appointment_recurring,
            clients:client_id (
              client_first_name,
              client_last_name
            )
          `)
          .order('start_at', { ascending: !pastAppointments });

        if (clientId) {
          query = query.eq('client_id', clientId);
        }

        if (clinicianId) {
          query = query.eq('clinician_id', clinicianId);
        }

        // Filter by date - today or future for upcoming, past for history
        const now = new Date().toISOString();
        if (pastAppointments) {
          query = query.lt('start_at', now);
        } else {
          query = query.gte('start_at', now);
        }

        if (limit > 0) {
          query = query.limit(limit);
        }

        const { data, error } = await query;

        if (error) {
          throw error;
        }

        console.log("Appointments data from Supabase:", data);

        if (!data || data.length === 0) {
          console.log("No appointments found or empty data array");
          setAppointments([]);
          return;
        }

        // Process appointments to:
        // 1. Format dates according to user timezone
        // 2. Add clientName for convenience
        const processedAppointments = data.map((apt: any) => {
          // Add clientName for easier access
          const clientName = 
            apt.clients && 
            `${apt.clients.client_first_name || ''} ${apt.clients.client_last_name || ''}`.trim();

          return {
            ...apt,
            clientName: clientName || 'Unknown Client'
          };
        });

        // Apply legacy field adapter for components we can't modify
        const adaptedAppointments = processAppointmentsForLegacyComponents(processedAppointments);
        setAppointments(adaptedAppointments);
      } catch (err) {
        console.error("Error fetching appointments:", err);
        setError(err as Error);
        toast({
          title: "Error",
          description: "Failed to load appointments",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (clientId || clinicianId) {
      fetchAppointments();
    } else {
      setAppointments([]);
      setLoading(false);
    }
  }, [clientId, clinicianId, limit, pastAppointments, timeZone, toast]);

  return { appointments, loading, error };
};
