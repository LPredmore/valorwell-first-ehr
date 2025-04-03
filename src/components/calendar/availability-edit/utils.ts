
import { format } from 'date-fns';

// Define TimeOption type
export type TimeOption = string;

// Generate time options for the select dropdown
export const generateTimeOptions = () => {
  const options: TimeOption[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const formattedHour = hour.toString().padStart(2, '0');
      const formattedMinute = minute.toString().padStart(2, '0');
      options.push(`${formattedHour}:${formattedMinute}`);
    }
  }
  return options;
};

// Format time for display
export const formatDisplayTime = (time: string) => {
  return format(new Date(`2023-01-01T${time}`), 'h:mm a');
};
