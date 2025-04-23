
import { 
  ClientDetails, 
  Clinician, 
  PaginatedResponse, 
  ErrorResponse 
} from '@/packages/core/types';

export interface ApiResponse<T> {
  data: T | null;
  error: ErrorResponse | null;
}

export interface ClientResponse extends ApiResponse<ClientDetails> {}
export interface ClinicianResponse extends ApiResponse<Clinician> {}
export interface ClientListResponse extends ApiResponse<PaginatedResponse<ClientDetails>> {}
