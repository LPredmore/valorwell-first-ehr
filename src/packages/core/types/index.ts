
// Re-export all types
export * from './auth';
export * from './client';
export * from './common';
export * from './clinician';
export * from './sessionNote';

// Export specific error types
export interface ErrorResponse {
  message: string;
  code: string;
  details: any | null;
}

// Export paginated response type
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
