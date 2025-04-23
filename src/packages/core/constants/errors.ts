
export const ERROR_MESSAGES = {
  GENERAL: {
    UNKNOWN: 'An unknown error occurred',
    NETWORK: 'Network error occurred',
    UNAUTHORIZED: 'You are not authorized to perform this action',
    NOT_FOUND: 'Resource not found',
    VALIDATION: 'Please check your input and try again'
  },
  AUTH: {
    INVALID_CREDENTIALS: 'Invalid email or password',
    EMAIL_EXISTS: 'An account with this email already exists',
    WEAK_PASSWORD: 'Password must be at least 8 characters long',
    INVALID_RESET_LINK: 'Password reset link is invalid or has expired'
  },
  FORM: {
    REQUIRED: 'This field is required',
    INVALID_EMAIL: 'Please enter a valid email address',
    INVALID_PHONE: 'Please enter a valid phone number',
    PASSWORDS_DONT_MATCH: 'Passwords do not match'
  }
} as const;
