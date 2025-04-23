
import { ClientDetails } from '@/packages/core/types/client';
import { SessionNoteFormData } from '@/packages/core/types/sessionNote';
import { Clinician } from '@/packages/core/types/client/clinician';

export interface ClientResponse {
  client: ClientDetails;
}

export interface ClinicianResponse {
  clinician: Clinician;
}

export interface SessionNoteResponse {
  sessionNote: SessionNoteFormData;
}

export interface ErrorResponse {
  error: {
    message: string;
    code?: string;
    details?: any;
  };
}
