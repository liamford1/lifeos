import type { ZodError } from 'zod';

interface ValidationErrors {
  [field: string]: string;
}

// Utility to map Zod errors to a { field: message } object
export function mapZodErrors(error: ZodError): ValidationErrors {
  const errors: ValidationErrors = {};
  if (error && error.errors) {
    error.errors.forEach(err => {
      if (err.path && err.path[0]) {
        errors[err.path[0]] = err.message;
      }
    });
  }
  return errors;
}
