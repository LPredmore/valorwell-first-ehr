
import React, { createContext, useContext } from "react";
import { TimeZoneContext as NewTimeZoneContext, useTimeZone as useNewTimeZone } from "../../../src/context/TimeZoneContext";

/**
 * @deprecated Use TimeZoneContext from src/context/TimeZoneContext.tsx instead
 */
interface TimeZoneContextType {
  userTimeZone: string;
  isLoading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
  updateUserTimeZone?: (newTimeZone: string) => Promise<void>;
}

const TimeZoneContext = createContext<TimeZoneContextType>({
  userTimeZone: "America/Chicago",
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
  return useNewTimeZone();
};

/**
 * @deprecated Use the TimeZoneProvider from src/context/TimeZoneContext.tsx instead
 */
export const TimeZoneProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  console.warn(
    'You are using a deprecated TimeZoneProvider from packages/core/contexts/TimeZoneContext.tsx. ' +
    'Please import from src/context/TimeZoneContext.tsx instead.'
  );
  
  // Forward to new context
  return <NewTimeZoneContext.Provider>{children}</NewTimeZoneContext.Provider>;
};
