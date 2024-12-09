/**
 * Generated by orval v7.3.0 🍺
 * Do not edit manually.
 * Medusa API
 * OpenAPI spec version: 1.0.0
 */

/**
 * A slug indicating the type of the error.
 */
export type ErrorType = typeof ErrorType[keyof typeof ErrorType];


// eslint-disable-next-line @typescript-eslint/no-redeclare
export const ErrorType = {
  QueryRunnerAlreadyReleasedError: 'QueryRunnerAlreadyReleasedError',
  TransactionAlreadyStartedError: 'TransactionAlreadyStartedError',
  TransactionNotStartedError: 'TransactionNotStartedError',
  conflict: 'conflict',
  unauthorized: 'unauthorized',
  payment_authorization_error: 'payment_authorization_error',
  duplicate_error: 'duplicate_error',
  not_allowed: 'not_allowed',
  invalid_data: 'invalid_data',
  not_found: 'not_found',
  database_error: 'database_error',
  unexpected_state: 'unexpected_state',
  invalid_argument: 'invalid_argument',
  unknown_error: 'unknown_error',
} as const;
