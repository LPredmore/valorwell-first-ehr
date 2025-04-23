
import { format, parseISO, isValid } from 'date-fns';

export const formatDate = (date: string | Date | null, formatStr: string = 'MM/dd/yyyy'): string => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return isValid(dateObj) ? format(dateObj, formatStr) : '';
};

export const formatDateForDB = (date: Date | null): string | null => {
  if (!date || !isValid(date)) return null;
  return format(date, 'yyyy-MM-dd');
};

export const formatDateTime = (date: string | Date | null, formatStr: string = 'MM/dd/yyyy h:mm a'): string => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return isValid(dateObj) ? format(dateObj, formatStr) : '';
};
