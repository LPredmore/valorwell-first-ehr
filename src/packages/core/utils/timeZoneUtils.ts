
export const formatTimeZoneDisplay = (timeZone: string): string => {
  try {
    return new Intl.DateTimeFormat('en', {
      timeZoneName: 'long',
      timeZone
    }).formatToParts().find(part => part.type === 'timeZoneName')?.value || timeZone;
  } catch (e) {
    return timeZone;
  }
};

export const timezoneOptions = Intl.supportedValuesOf('timeZone').map(tz => ({
  label: formatTimeZoneDisplay(tz),
  value: tz
}));
