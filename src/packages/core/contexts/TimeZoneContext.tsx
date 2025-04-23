
import React, { createContext, useContext, useState, useEffect } from 'react';

interface TimeZoneContextType {
  userTimeZone: string;
  setUserTimeZone: (timeZone: string) => void;
  isLoading: boolean;
}

const TimeZoneContext = createContext<TimeZoneContextType>({
  userTimeZone: 'America/Chicago',
  setUserTimeZone: () => {},
  isLoading: true,
});

export const TimeZoneProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userTimeZone, setUserTimeZone] = useState('America/Chicago');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setUserTimeZone(timeZone);
    } catch (error) {
      console.error('Error getting timezone:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <TimeZoneContext.Provider value={{ userTimeZone, setUserTimeZone, isLoading }}>
      {children}
    </TimeZoneContext.Provider>
  );
};

export const useTimeZone = () => useContext(TimeZoneContext);
