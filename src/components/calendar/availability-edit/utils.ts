
export interface TimeOption {
  value: string;
  label: string;
}

export const generateTimeOptions = (): TimeOption[] => {
  const options: TimeOption[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const formattedHour = hour.toString().padStart(2, '0');
      const formattedMinute = minute.toString().padStart(2, '0');
      const value = `${formattedHour}:${formattedMinute}`;
      
      // Format for display (12-hour format)
      const hourDisplay = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      const ampm = hour < 12 ? 'AM' : 'PM';
      const label = `${hourDisplay}:${formattedMinute.padStart(2, '0')} ${ampm}`;
      
      options.push({ value, label });
    }
  }
  return options;
};
