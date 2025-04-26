
/**
 * @deprecated Import timezone options from TimeZoneService.TIMEZONE_OPTIONS instead
 */
import { TIMEZONE_OPTIONS } from './timeZoneService';

console.warn(
  'You are importing from timezoneOptions.ts, which is deprecated. ' +
  'Please import TIMEZONE_OPTIONS from TimeZoneService instead.'
);

export const timezoneOptions = TIMEZONE_OPTIONS;
