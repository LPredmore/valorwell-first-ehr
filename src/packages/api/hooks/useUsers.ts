
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  getUserProfile, 
  updateUserProfile,
  getClinicianList,
  getClinicianById,
  updateClinicianProfile,
  getClinicianLicenses,
  addClinicianLicense,
  updateClinicianLicense,
  deleteClinicianLicense,
  getUserPreferences,
  updateUserPreferences,
  updateGoogleCalendarSettings
} from '../services/users';
import { getQueryOptions, getPaginatedQueryOptions } from '../utils/cache';

// User Profile Hooks
export const useUserProfile = (userId: string | undefined) => {
  return useQuery({
    ...getQueryOptions(['user-profile', userId], 'persistent'),
    queryFn: async () => {
      if (!userId) return null;
      return getUserProfile(userId);
    },
    enabled: !!userId
  });
};

export const useUpdateUserProfile = () => {
  return useMutation({
    mutationFn: ({ userId, updates }: { userId: string; updates: any }) => 
      updateUserProfile(userId, updates)
  });
};

// Clinician Hooks
export const useClinicianList = (searchTerm: string = '', limit: number = 50) => {
  return useQuery({
    ...getQueryOptions(['clinician-list', searchTerm, limit], 'standard'),
    queryFn: () => getClinicianList(searchTerm, limit)
  });
};

export const useClinicianDetails = (clinicianId: string | undefined) => {
  return useQuery({
    ...getQueryOptions(['clinician', clinicianId], 'standard'),
    queryFn: async () => {
      if (!clinicianId) return null;
      return getClinicianById(clinicianId);
    },
    enabled: !!clinicianId
  });
};

export const useUpdateClinicianProfile = () => {
  return useMutation({
    mutationFn: ({ clinicianId, updates }: { clinicianId: string; updates: any }) => 
      updateClinicianProfile(clinicianId, updates)
  });
};

// Clinician License Hooks
export const useClinicianLicenses = (clinicianId: string | undefined) => {
  return useQuery({
    ...getQueryOptions(['clinician-licenses', clinicianId], 'persistent'),
    queryFn: async () => {
      if (!clinicianId) return [];
      return getClinicianLicenses(clinicianId);
    },
    enabled: !!clinicianId
  });
};

export const useAddClinicianLicense = () => {
  return useMutation({
    mutationFn: (licenseData: any) => addClinicianLicense(licenseData)
  });
};

export const useUpdateClinicianLicense = () => {
  return useMutation({
    mutationFn: ({ licenseId, updates }: { licenseId: string; updates: any }) => 
      updateClinicianLicense(licenseId, updates)
  });
};

export const useDeleteClinicianLicense = () => {
  return useMutation({
    mutationFn: (licenseId: string) => deleteClinicianLicense(licenseId)
  });
};

// User Preferences Hooks
export const useUserPreferences = (userId: string | undefined) => {
  return useQuery({
    ...getQueryOptions(['user-preferences', userId], 'persistent'),
    queryFn: async () => {
      if (!userId) return null;
      return getUserPreferences(userId);
    },
    enabled: !!userId
  });
};

export const useUpdateUserPreferences = () => {
  return useMutation({
    mutationFn: ({ userId, preferences }: { userId: string; preferences: any }) => 
      updateUserPreferences(userId, preferences)
  });
};

// Google Calendar Integration
export const useUpdateGoogleCalendarSettings = () => {
  return useMutation({
    mutationFn: ({ 
      userId, 
      settings 
    }: { 
      userId: string; 
      settings: { linked: boolean; lastSync?: string; } 
    }) => updateGoogleCalendarSettings(userId, settings)
  });
};
