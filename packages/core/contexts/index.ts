
/**
 * @deprecated Import contexts directly from src/context/* instead
 */

console.warn(
  'You are importing from packages/core/contexts which is deprecated. ' +
  'Please import directly from src/context/* instead.'
);

export * from './UserContext';
export { useTimeZone, TimeZoneProvider } from '../../../src/context/TimeZoneContext';
