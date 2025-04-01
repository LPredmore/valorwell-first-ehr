
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { parseISO, isToday, isFuture, isBefore } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type Appointment = {
  id: string;
  client_id: string;
  date: string;
  start_time: string;
  end_time: string;
  type: string;
  status: string;
  video_room_url: string | null;
  client?: {
    client_first_name: string;
    client_last_name: string;
  };
};

export const useAppointments = (clinicianId: string | null) => {
  const { toast } = useToast();

  const { 
    data: appointments, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['clinician-appointments', clinicianId],
    queryFn: async () => {
      if (!clinicianId) return [];
      
      console.log('Fetching appointments for clinician:', clinicianId);
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          client_id,
          date,
          start_time,
          end_time,
          type,
          status,
          video_room_url,
          clients (
            client_first_name,
            client_last_name
          )
        `)
        .eq('clinician_id', clinicianId)
        .order('date')
        .order('start_time');

      if (error) {
        console.error('Error fetching appointments:', error);
        throw error;
      }

      return data.map((appointment: any) => ({
        ...appointment,
        client: appointment.clients
      }));
    },
    enabled: !!clinicianId
  });

  // Filter appointments by type
  const todayAppointments = appointments?.filter(appointment => {
    const appointmentDate = parseISO(appointment.date);
    return isToday(appointmentDate);
  }) || [];

  const upcomingAppointments = appointments?.filter(appointment => {
    const appointmentDate = parseISO(appointment.date);
    return isFuture(appointmentDate) && !isToday(appointmentDate);
  }) || [];

  const pastAppointments = appointments?.filter(appointment => {
    const appointmentDate = parseISO(appointment.date);
    return isBefore(appointmentDate, new Date()) && !isToday(appointmentDate);
  }) || [];

  return { 
    appointments,
    todayAppointments, 
    upcomingAppointments, 
    pastAppointments,
    isLoading, 
    error, 
    refetch 
  };
};
