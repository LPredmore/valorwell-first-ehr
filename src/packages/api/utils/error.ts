
import { ErrorResponse } from '@/packages/core/types';

export const handleApiError = (error: any): ErrorResponse => {
  console.error('API Error:', error);
  
  return {
    message: error.message || 'An unexpected error occurred',
    code: error.code || 'UNKNOWN_ERROR',
    details: error.details || null
  };
};
