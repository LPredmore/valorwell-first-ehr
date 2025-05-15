
import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ensureIANATimeZone } from "@/utils/timeZoneUtils";

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

export const useTimeZone = () => useContext(TimeZoneContext);

export const TimeZoneProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userTimeZone, setUserTimeZone] = useState<string>(defaultTimeZone);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    const fetchTimeZone = async () => {
      console.log('[TimeZoneContext] Initializing time zone detection...');
      try {
        // Get current user
        const { data: authData, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          console.log('[TimeZoneContext] Not authenticated:', authError.message);
          setIsAuthenticated(false);
          // Still use browser time zone for unauthenticated users
          const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          setUserTimeZone(browserTimeZone);
          setIsLoading(false);
          return;
        }
        
        if (authData?.user) {
          setIsAuthenticated(true);
          console.log(`[TimeZoneContext] User authenticated: ${authData.user.id}`);
          // Fetch user's time zone from profiles
          const { data, error: profileError } = await supabase
            .from("profiles")
            .select("time_zone")
            .eq("id", authData.user.id)
            .single();
            
          if (profileError) {
            console.error("[TimeZoneContext] Error fetching user time zone:", profileError);
            // Don't throw here, just use the browser's time zone as fallback
          }
          
          if (data?.time_zone) {
            // Ensure time zone is in IANA format
            const validTimeZone = ensureIANATimeZone(data.time_zone);
            console.log(`[TimeZoneContext] User time zone set from DB: ${validTimeZone}`);
            setUserTimeZone(validTimeZone);
          } else {
            // If no time zone in profile, use browser's time zone
            const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            console.log(`[TimeZoneContext] No time zone in profile. Using browser time zone: ${browserTimeZone}`);
            setUserTimeZone(browserTimeZone);
          }
        } else {
          // No authenticated user, use browser's time zone
          setIsAuthenticated(false);
          const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          console.log(`[TimeZoneContext] No authenticated user. Using browser time zone: ${browserTimeZone}`);
          setUserTimeZone(browserTimeZone);
        }
      } catch (err) {
        console.error("[TimeZoneContext] Error in time zone initialization:", err);
        setError(err as Error);
        setIsAuthenticated(false);
        
        // Fallback to browser time zone on error
        const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        setUserTimeZone(browserTimeZone);
      } finally {
        setIsLoading(false);
        console.log('[TimeZoneContext] Time zone initialization completed.');
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
