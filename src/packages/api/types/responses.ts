
import { ClientDetails } from '@/packages/core/types/client';
import { SessionNoteFormData } from '@/packages/core/types/sessionNote';
import { Clinician } from '@/packages/core/types/client/clinician';

export interface ErrorResponse {
  message: string;
  code?: string;
  details?: any;
}

export interface ClientResponse {
  client: ClientDetails;
}

export interface ClinicianResponse {
  clinician: Clinician;
}

export interface SessionNoteResponse {
  sessionNote: SessionNoteFormData;
}

export interface PHQ9Response {
  exists: boolean;
  data: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
