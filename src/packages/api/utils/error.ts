
export class APIError extends Error {
  code?: string;
  details?: any;

  constructor(message: string, code?: string, details?: any) {
    super(message);
    this.name = 'APIError';
    this.code = code;
    this.details = details;
  }
}

export const handleApiError = (error: any): never => {
  console.error('API Error:', error);
  
  if (error?.code === 'PGRST301') {
    throw new APIError('Authentication required', 'AUTH_REQUIRED');
  }

  const message = error?.message || error?.error_description || 'An unknown error occurred';
  throw new APIError(message, error?.code, error?.details);
};
