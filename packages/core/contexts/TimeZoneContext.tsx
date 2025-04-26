
import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../api/supabase";
import { TimeZoneService } from "../../src/utils/timeZoneService";

/**
 * @deprecated Use the TimeZoneContext from src/context/TimeZoneContext.tsx instead
 */
interface TimeZoneContextType {
  userTimeZone: string;
  isLoading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
}

const defaultTimeZone = "America/Chicago";

const TimeZoneContext = createContext<TimeZoneContextType>({
  userTimeZone: defaultTimeZone,
  isLoading: true,
  error: null,
  isAuthenticated: false
});

/**
 * @deprecated Use the useTimeZone hook from src/context/TimeZoneContext.tsx instead
 */
export const useTimeZone = () => {
  console.warn(
    'You are using a deprecated TimeZoneContext from packages/core/contexts/TimeZoneContext.tsx. ' +
    'Please import from src/context/TimeZoneContext.tsx instead.'
  );
  return useContext(TimeZoneContext);
};

/**
 * @deprecated Use the TimeZoneProvider from src/context/TimeZoneContext.tsx instead
 */
export const TimeZoneProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  console.warn(
    'You are using a deprecated TimeZoneProvider from packages/core/contexts/TimeZoneContext.tsx. ' +
    'Please import from src/context/TimeZoneContext.tsx instead.'
  );

  const [userTimeZone, setUserTimeZone] = useState<string>(defaultTimeZone);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    const fetchTimeZone = async () => {
      console.log('[Deprecated TimeZoneContext] Initializing time zone detection...');
      try {
        // Get current user
        const { data: authData, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          setIsAuthenticated(false);
          // Still use browser time zone for unauthenticated users
          const browserTimeZone = TimeZoneService.getUserTimeZone();
          setUserTimeZone(browserTimeZone);
          setIsLoading(false);
          return;
        }
        
        if (authData?.user) {
          setIsAuthenticated(true);
          // Fetch user's time zone from profiles
          const { data, error: profileError } = await supabase
            .from("profiles")
            .select("time_zone")
            .eq("id", authData.user.id)
            .single();
            
          if (profileError) {
            // Don't throw here, just use the browser's time zone as fallback
          }
          
          if (data?.time_zone) {
            // Ensure time zone is in IANA format
            const validTimeZone = TimeZoneService.ensureIANATimeZone(data.time_zone);
            setUserTimeZone(validTimeZone);
          } else {
            // If no time zone in profile, use browser's time zone
            const browserTimeZone = TimeZoneService.getUserTimeZone();
            setUserTimeZone(browserTimeZone);
          }
        } else {
          // No authenticated user, use browser's time zone
          setIsAuthenticated(false);
          const browserTimeZone = TimeZoneService.getUserTimeZone();
          setUserTimeZone(browserTimeZone);
        }
      } catch (err) {
        setError(err as Error);
        setIsAuthenticated(false);
        
        // Fallback to browser time zone on error
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
    isAuthenticated
  };

  return (
    <TimeZoneContext.Provider value={value}>
      {children}
    </TimeZoneContext.Provider>
  );
};
