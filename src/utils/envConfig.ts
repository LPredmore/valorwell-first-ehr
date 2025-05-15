
// Helper to get environment variables with fallbacks
export const getEnvVariable = (name: string, fallback: string = ''): string => {
  // For Vite applications, environment variables are prefixed with VITE_
  const envVar = import.meta.env[`VITE_${name}`];
  return envVar || fallback;
};

// Google Calendar API configuration
export const GOOGLE_API_CONFIG = {
  clientId: getEnvVariable('GOOGLE_CLIENT_ID', ''),
  apiKey: getEnvVariable('GOOGLE_API_KEY', ''),
};
