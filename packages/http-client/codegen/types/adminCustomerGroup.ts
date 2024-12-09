/**
 * Generated by orval v7.3.0 🍺
 * Do not edit manually.
 * Medusa API
 * OpenAPI spec version: 1.0.0
 */
import type { AdminCustomerGroupCustomersItem } from './adminCustomerGroupCustomersItem';
import type { AdminCustomerGroupMetadata } from './adminCustomerGroupMetadata';

/**
 * The customer group's details.
 */
export interface AdminCustomerGroup {
  /** The customer group's creation date. */
  created_at: string;
  /** The customer group's customers. */
  customers: AdminCustomerGroupCustomersItem[];
  /** The customer group's ID. */
  id: string;
  /** The customer group's metadata, used to store custom key-value pairs. */
  metadata: AdminCustomerGroupMetadata;
  /** The customer group's name. */
  name: string;
  /** The customer group's update date. */
  updated_at: string;
}
