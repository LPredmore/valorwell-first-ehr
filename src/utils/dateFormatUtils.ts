
import { DateTime } from 'luxon';

export const getWeekdayName = (date: Date | string): string => {
  const dateTime = typeof date === 'string' 
    ? DateTime.fromISO(date)
    : DateTime.fromJSDate(date);
  
  return dateTime.toFormat('cccc').toLowerCase(); // 'cccc' gives full weekday name
};
