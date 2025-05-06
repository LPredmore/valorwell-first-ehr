
/**
 * Standard IANA timezone options for the application
 * Each timezone includes both the IANA identifier and a user-friendly label
 */
export const timezoneOptions = [
  { value: "America/New_York", label: "Eastern Time (ET) - New York" },
  { value: "America/Chicago", label: "Central Time (CT) - Chicago" },
  { value: "America/Denver", label: "Mountain Time (MT) - Denver" },
  { value: "America/Phoenix", label: "Mountain Time - Arizona (no DST)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT) - Los Angeles" },
  { value: "America/Anchorage", label: "Alaska Time (AKT) - Anchorage" },
  { value: "Pacific/Honolulu", label: "Hawaii-Aleutian Time (HST) - Honolulu" },
  { value: "America/Puerto_Rico", label: "Atlantic Time (AT) - Puerto Rico" },
  { value: "Europe/London", label: "Greenwich Mean Time (GMT) - London" },
  { value: "Europe/Paris", label: "Central European Time (CET) - Paris" },
  { value: "Europe/Athens", label: "Eastern European Time (EET) - Athens" },
  { value: "Asia/Dubai", label: "Gulf Standard Time (GST) - Dubai" },
  { value: "Asia/Kolkata", label: "India Standard Time (IST) - Kolkata" },
  { value: "Asia/Tokyo", label: "Japan Standard Time (JST) - Tokyo" },
  { value: "Australia/Sydney", label: "Australian Eastern Time (AET) - Sydney" },
];

/**
 * Get a timezone option by IANA identifier
 */
export function getTimezoneOption(value: string): { value: string, label: string } | undefined {
  return timezoneOptions.find(option => option.value === value);
}

/**
 * Get a timezone label by IANA identifier
 */
export function getTimezoneLabel(value: string): string {
  const option = getTimezoneOption(value);
  return option ? option.label : value;
}
