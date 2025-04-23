
export const ROUTES = {
  // Auth routes
  LOGIN: '/login',
  SIGNUP: '/signup',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  
  // Client routes
  CLIENT_DASHBOARD: '/patient-dashboard',
  CLIENT_PROFILE: '/patient-profile',
  CLIENT_DOCUMENTS: '/patient-documents',
  CLIENT_APPOINTMENTS: '/patient-appointments',
  
  // Clinician routes
  CLINICIAN_DASHBOARD: '/clinician-dashboard',
  CLINICIAN_CLIENTS: '/clients',
  CLINICIAN_CALENDAR: '/calendar',
  CLINICIAN_PROFILE: '/clinician-profile',
  
  // Admin routes
  ADMIN_DASHBOARD: '/admin-dashboard',
  ADMIN_USERS: '/admin/users',
  ADMIN_SETTINGS: '/admin/settings',
  
  // Common routes
  HOME: '/',
  NOT_FOUND: '/404'
} as const;
