
import { DateTime } from 'luxon';
import { ensureIANATimeZone } from './timeZone';

export const isDSTTransitionTime = (
  date: string | Date,
  time: string,
  timezone: string
): boolean => {
  const dateTime = createDateTime(date, time, timezone);
  
  // Get times one hour before and after
  const hourBefore = dateTime.minus({ hours: 1 });
  const hourAfter = dateTime.plus({ hours: 1 });
  
  // If the offset changes within this window, we're in a DST transition
  return hourBefore.offset !== hourAfter.offset;
};

export const isValidDateTime = (
  date: string | Date,
  time: string,
  timezone: string
): boolean => {
  try {
    const dateTime = createDateTime(date, time, timezone);
    return dateTime.isValid;
  } catch {
    return false;
  }
};
