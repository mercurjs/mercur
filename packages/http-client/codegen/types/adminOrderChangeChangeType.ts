/**
 * Generated by orval v7.3.0 🍺
 * Do not edit manually.
 * Medusa API
 * OpenAPI spec version: 1.0.0
 */

/**
 * The order change's type.
 */
export type AdminOrderChangeChangeType = typeof AdminOrderChangeChangeType[keyof typeof AdminOrderChangeChangeType];


// eslint-disable-next-line @typescript-eslint/no-redeclare
export const AdminOrderChangeChangeType = {
  return: 'return',
  exchange: 'exchange',
  claim: 'claim',
  edit: 'edit',
} as const;
