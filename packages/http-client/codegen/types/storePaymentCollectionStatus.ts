/**
 * Generated by orval v7.3.0 🍺
 * Do not edit manually.
 * Medusa API
 * OpenAPI spec version: 1.0.0
 */

/**
 * The payment collection's status.
 */
export type StorePaymentCollectionStatus = typeof StorePaymentCollectionStatus[keyof typeof StorePaymentCollectionStatus];


// eslint-disable-next-line @typescript-eslint/no-redeclare
export const StorePaymentCollectionStatus = {
  canceled: 'canceled',
  not_paid: 'not_paid',
  awaiting: 'awaiting',
  authorized: 'authorized',
  partially_authorized: 'partially_authorized',
} as const;
