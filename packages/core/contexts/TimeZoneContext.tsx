
/**
 * @deprecated This file will be removed in a future update. Import from src/context/TimeZoneContext.tsx instead.
 */

import React from "react";
import { TimeZoneContext as NewTimeZoneContext, useTimeZone as useNewTimeZone } from "../../../src/context/TimeZoneContext";

console.warn(
  'You are using a deprecated TimeZoneContext from packages/core/contexts/TimeZoneContext.tsx. ' +
  'Please import from src/context/TimeZoneContext.tsx instead. ' +
  'This file will be removed in a future update.'
);

export const useTimeZone = () => {
  console.warn(
    'You are using a deprecated TimeZoneContext from packages/core/contexts/TimeZoneContext.tsx. ' +
    'Please import from src/context/TimeZoneContext.tsx instead.'
  );
  return useNewTimeZone();
};

export const TimeZoneProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  console.warn(
    'You are using a deprecated TimeZoneProvider from packages/core/contexts/TimeZoneContext.tsx. ' +
    'Please import from src/context/TimeZoneContext.tsx instead.'
  );
  
  return <NewTimeZoneContext.Provider>{children}</NewTimeZoneContext.Provider>;
};
