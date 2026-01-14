// types/index.ts

/**
 * Session phases - forward-only flow
 */
export type SessionPhase = 'input' | 'loading' | 'complete';

/**
 * Full session state for page component
 */
export interface SessionState {
  phase: SessionPhase;
  question: string;
  userResponse: string;
  reflection: string;
  exitSentence: string;
  error: string | null;
}

/**
 * API request body
 */
export interface SelahRequest {
  message: string;
  question: string;
}

/**
 * API success response
 */
export interface SelahResponse {
  reflection: string;
  exitSentence: string;
}

/**
 * API error types
 */
export type ErrorType =
  | 'validation_error'
  | 'rate_limit'
  | 'api_error'
  | 'config_error';

/**
 * API error response
 */
export interface SelahErrorResponse {
  error: ErrorType;
  message: string;
}

/**
 * Validation result discriminated union
 */
export type ValidationResult =
  | { valid: true; data: SelahRequest }
  | { valid: false; error: string };
