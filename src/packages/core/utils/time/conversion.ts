
import { DateTime } from 'luxon';
import { ensureIANATimeZone } from './timeZone';

export const createDateTime = (
  date: string | Date,
  time: string,
  timezone: string
): DateTime => {
  const ianaZone = ensureIANATimeZone(timezone);
  const dateStr = typeof date === "string" ? date : date.toISOString().split("T")[0];
  const [hours, minutes] = time.split(":").map(Number);
  
  return DateTime.fromObject(
    { 
      year: parseInt(dateStr.split("-")[0]), 
      month: parseInt(dateStr.split("-")[1]), 
      day: parseInt(dateStr.split("-")[2]),
      hour: hours,
      minute: minutes,
    },
    { zone: ianaZone }
  );
};

export const convertToTimezone = (
  dateTime: DateTime,
  targetTimezone: string
): DateTime => {
  const ianaZone = ensureIANATimeZone(targetTimezone);
  return dateTime.setZone(ianaZone);
};

export const fromUTCToTimezone = (
  utcString: string,
  timezone: string
): DateTime => {
  const ianaZone = ensureIANATimeZone(timezone);
  return DateTime.fromISO(utcString, { zone: "utc" }).setZone(ianaZone);
};
