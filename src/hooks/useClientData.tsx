
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ClientDetails } from "@/types/client";
import { useQuery } from "@tanstack/react-query";

export const useClientData = (clientId: string | undefined) => {
  return useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      if (!clientId) return null;
      
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();
      
      if (error) throw error;
      return data as ClientDetails;
    },
    enabled: !!clientId
  });
};

export const getCurrentClientAge = (dateOfBirth: string | null): number | null => {
  if (!dateOfBirth) return null;
  
  const dob = new Date(dateOfBirth);
  const today = new Date();
  
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  
  return age;
};
