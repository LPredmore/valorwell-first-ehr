
import { useState } from 'react';

interface CalendarDialogsState {
  isAppointmentDialogOpen: boolean;
  isAvailabilitySettingsOpen: boolean;
  isWeeklyAvailabilityOpen: boolean;
  isSingleAvailabilityOpen: boolean;
  selectedAvailabilityDate: string | null;
}

interface CalendarDialogsActions {
  openAppointmentDialog: () => void;
  closeAppointmentDialog: () => void;
  openAvailabilitySettings: () => void;
  closeAvailabilitySettings: () => void;
  openWeeklyAvailability: (date?: string | null) => void;
  closeWeeklyAvailability: () => void;
  openSingleAvailability: () => void;
  closeSingleAvailability: () => void;
}

export const useCalendarDialogs = (): CalendarDialogsState & CalendarDialogsActions => {
  const [isAppointmentDialogOpen, setIsAppointmentDialogOpen] = useState(false);
  const [isAvailabilitySettingsOpen, setIsAvailabilitySettingsOpen] = useState(false);
  const [isWeeklyAvailabilityOpen, setIsWeeklyAvailabilityOpen] = useState(false);
  const [isSingleAvailabilityOpen, setIsSingleAvailabilityOpen] = useState(false);
  const [selectedAvailabilityDate, setSelectedAvailabilityDate] = useState<string | null>(null);

  const openAppointmentDialog = () => setIsAppointmentDialogOpen(true);
  const closeAppointmentDialog = () => setIsAppointmentDialogOpen(false);
  
  const openAvailabilitySettings = () => setIsAvailabilitySettingsOpen(true);
  const closeAvailabilitySettings = () => setIsAvailabilitySettingsOpen(false);
  
  const openWeeklyAvailability = (date: string | null = null) => {
    setSelectedAvailabilityDate(date);
    setIsWeeklyAvailabilityOpen(true);
  };
  
  const closeWeeklyAvailability = () => {
    setIsWeeklyAvailabilityOpen(false);
    setSelectedAvailabilityDate(null);
    localStorage.removeItem('selectedAvailabilitySlotId');
    localStorage.removeItem('selectedAvailabilityDate');
  };
  
  const openSingleAvailability = () => setIsSingleAvailabilityOpen(true);
  const closeSingleAvailability = () => setIsSingleAvailabilityOpen(false);

  return {
    isAppointmentDialogOpen,
    isAvailabilitySettingsOpen,
    isWeeklyAvailabilityOpen,
    isSingleAvailabilityOpen,
    selectedAvailabilityDate,
    openAppointmentDialog,
    closeAppointmentDialog,
    openAvailabilitySettings,
    closeAvailabilitySettings,
    openWeeklyAvailability,
    closeWeeklyAvailability,
    openSingleAvailability,
    closeSingleAvailability
  };
};
