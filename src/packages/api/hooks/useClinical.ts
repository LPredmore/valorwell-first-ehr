
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  getSessionNotes, 
  getSessionNoteById,
  createSessionNote,
  updateSessionNote,
  getTreatmentPlans,
  getTreatmentPlanById,
  createTreatmentPlan,
  updateTreatmentPlan,
  getClientHistory,
  saveClientHistory,
  getAssessments,
  saveAssessment,
  getIcd10Codes
} from '../services/clinical';
import { getQueryOptions, getPaginatedQueryOptions } from '../utils/cache';

// Session Notes Hooks
export const useSessionNotes = (clientId: string | undefined) => {
  return useQuery({
    ...getQueryOptions(['session-notes', clientId], 'standard'),
    queryFn: async () => {
      if (!clientId) return [];
      return getSessionNotes(clientId);
    },
    enabled: !!clientId
  });
};

export const useSessionNote = (noteId: string | undefined) => {
  return useQuery({
    ...getQueryOptions(['session-note', noteId], 'standard'),
    queryFn: async () => {
      if (!noteId) return null;
      return getSessionNoteById(noteId);
    },
    enabled: !!noteId
  });
};

export const useCreateSessionNote = () => {
  return useMutation({
    mutationFn: (noteData: any) => createSessionNote(noteData)
  });
};

export const useUpdateSessionNote = () => {
  return useMutation({
    mutationFn: ({ noteId, updates }: { noteId: string; updates: any }) => 
      updateSessionNote(noteId, updates)
  });
};

// Treatment Plan Hooks
export const useTreatmentPlans = (clientId: string | undefined) => {
  return useQuery({
    ...getQueryOptions(['treatment-plans', clientId], 'standard'),
    queryFn: async () => {
      if (!clientId) return [];
      return getTreatmentPlans(clientId);
    },
    enabled: !!clientId
  });
};

export const useTreatmentPlan = (planId: string | undefined) => {
  return useQuery({
    ...getQueryOptions(['treatment-plan', planId], 'standard'),
    queryFn: async () => {
      if (!planId) return null;
      return getTreatmentPlanById(planId);
    },
    enabled: !!planId
  });
};

export const useCreateTreatmentPlan = () => {
  return useMutation({
    mutationFn: (planData: any) => createTreatmentPlan(planData)
  });
};

export const useUpdateTreatmentPlan = () => {
  return useMutation({
    mutationFn: ({ planId, updates }: { planId: string; updates: any }) => 
      updateTreatmentPlan(planId, updates)
  });
};

// Client History Hooks
export const useClientHistory = (clientId: string | undefined) => {
  return useQuery({
    ...getQueryOptions(['client-history', clientId], 'persistent'),
    queryFn: async () => {
      if (!clientId) return null;
      return getClientHistory(clientId);
    },
    enabled: !!clientId
  });
};

export const useSaveClientHistory = () => {
  return useMutation({
    mutationFn: (historyData: any) => saveClientHistory(historyData)
  });
};

// Assessment Hooks
export const useAssessmentList = (clientId: string | undefined, assessmentType: string) => {
  return useQuery({
    ...getQueryOptions(['assessments', clientId, assessmentType], 'standard'),
    queryFn: async () => {
      if (!clientId || !assessmentType) return [];
      return getAssessments(clientId, assessmentType);
    },
    enabled: !!clientId && !!assessmentType
  });
};

export const useSaveAssessment = (assessmentType: string) => {
  return useMutation({
    mutationFn: (assessmentData: any) => saveAssessment(assessmentType, assessmentData)
  });
};

// Diagnosis Hooks (ICD-10 Codes)
export const useIcd10Search = (searchTerm: string = '', enabled: boolean = false) => {
  return useQuery({
    ...getQueryOptions(['icd10', searchTerm], 'reference'),
    queryFn: () => getIcd10Codes(searchTerm),
    enabled: enabled && searchTerm.length > 2
  });
};
