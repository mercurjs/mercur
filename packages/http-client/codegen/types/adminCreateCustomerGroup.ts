/**
 * Generated by orval v7.3.0 🍺
 * Do not edit manually.
 * Medusa API
 * OpenAPI spec version: 1.0.0
 */
import type { AdminCreateCustomerGroupMetadata } from './adminCreateCustomerGroupMetadata';

/**
 * The customer group's details.
 */
export interface AdminCreateCustomerGroup {
  /** The customer group's metadata, used to store custom key-value pairs. */
  metadata?: AdminCreateCustomerGroupMetadata;
  /** The customer group's name. */
  name: string;
}
