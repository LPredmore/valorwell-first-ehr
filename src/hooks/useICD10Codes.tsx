
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ICD10Code {
  id: number;
  icd10: string;
  diagnosis_name: string;
}

export function useICD10Codes(searchTerm: string = "") {
  return useQuery({
    queryKey: ["icd10Codes", searchTerm],
    queryFn: async () => {
      let query = supabase.from("icd10").select("*");
      
      // If search term is provided, filter results
      if (searchTerm) {
        query = query.ilike("diagnosis_name", `%${searchTerm}%`);
      }
      
      // Limit results to prevent performance issues
      query = query.limit(100);
      
      const { data, error } = await query;
      
      if (error) {
        console.error("Error fetching ICD10 codes:", error);
        throw error;
      }
      
      return data as ICD10Code[];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}
