
import { format, parse } from 'date-fns';

// Generate time options for the select dropdown
export const generateTimeOptions = () => {
  const options = [];
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
  if (!time) return '';
  
  try {
    // Parse the time string correctly
    const timeObj = parse(time, 'HH:mm', new Date());
    // Format as 12-hour time with AM/PM
    return format(timeObj, 'h:mm a');
  } catch (error) {
    console.error('Error formatting time:', error);
    return time; // Return original time string if formatting fails
  }
};
