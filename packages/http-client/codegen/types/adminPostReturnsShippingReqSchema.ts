/**
 * Generated by orval v7.3.0 🍺
 * Do not edit manually.
 * Medusa API
 * OpenAPI spec version: 1.0.0
 */
import type { AdminPostReturnsShippingReqSchemaMetadata } from './adminPostReturnsShippingReqSchemaMetadata';

/**
 * The shipping method's details.
 */
export interface AdminPostReturnsShippingReqSchema {
  /** Set the price of the shipping method. */
  custom_amount?: number;
  /** The shipping method's description. */
  description?: string;
  /** A note viewed only by admin users. */
  internal_note?: string;
  /** The exchange's metadata, can hold custom key-value pairs. */
  metadata?: AdminPostReturnsShippingReqSchemaMetadata;
  /** The ID of the associated shipping option. */
  shipping_option_id: string;
}
