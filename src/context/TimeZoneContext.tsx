
import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TimeZoneService } from "@/utils/timeZoneService";

interface TimeZoneContextType {
  userTimeZone: string;
  isLoading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
  updateUserTimeZone?: (newTimeZone: string) => Promise<void>;
}

const defaultTimeZone = "America/Chicago";

const TimeZoneContext = createContext<TimeZoneContextType>({
  userTimeZone: defaultTimeZone,
  isLoading: true,
  error: null,
  isAuthenticated: false
});

export const useTimeZone = () => useContext(TimeZoneContext);

export const TimeZoneProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userTimeZone, setUserTimeZone] = useState<string>(defaultTimeZone);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const updateUserTimeZone = async (newTimeZone: string): Promise<void> => {
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user?.id) {
        throw new Error('User not authenticated');
      }

      const validTimeZone = TimeZoneService.ensureIANATimeZone(newTimeZone);
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ time_zone: validTimeZone })
        .eq('id', authData.user.id);

      if (updateError) throw updateError;
      
      setUserTimeZone(validTimeZone);
    } catch (err) {
      console.error('[TimeZoneContext] Error updating time zone:', err);
      throw err;
    }
  };

  useEffect(() => {
    const fetchTimeZone = async () => {
      console.log('[TimeZoneContext] Initializing time zone detection...');
      try {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          setIsAuthenticated(false);
          const browserTimeZone = TimeZoneService.getUserTimeZone();
          setUserTimeZone(browserTimeZone);
          setIsLoading(false);
          return;
        }
        
        if (authData?.user) {
          setIsAuthenticated(true);
          
          const { data, error: profileError } = await supabase
            .from("profiles")
            .select("time_zone")
            .eq("id", authData.user.id)
            .maybeSingle();
            
          if (data?.time_zone) {
            const validTimeZone = TimeZoneService.ensureIANATimeZone(data.time_zone);
            setUserTimeZone(validTimeZone);
          } else {
            const browserTimeZone = TimeZoneService.getUserTimeZone();
            setUserTimeZone(browserTimeZone);
          }
        } else {
          setIsAuthenticated(false);
          const browserTimeZone = TimeZoneService.getUserTimeZone();
          setUserTimeZone(browserTimeZone);
        }
      } catch (err) {
        console.error('[TimeZoneContext] Error in time zone initialization:', err);
        setError(err as Error);
        setIsAuthenticated(false);
        
        const browserTimeZone = TimeZoneService.getUserTimeZone();
        setUserTimeZone(browserTimeZone);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTimeZone();
  }, []);

  const value = {
    userTimeZone,
    isLoading,
    error,
    isAuthenticated,
    updateUserTimeZone
  };

  return (
    <TimeZoneContext.Provider value={value}>
      {children}
    </TimeZoneContext.Provider>
  );
};
