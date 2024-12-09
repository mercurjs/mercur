/**
 * Generated by orval v7.3.0 🍺
 * Do not edit manually.
 * Medusa API
 * OpenAPI spec version: 1.0.0
 */
import type { AdminProductVariant } from './adminProductVariant';
import type { AdminBatchProductVariantResponseDeleted } from './adminBatchProductVariantResponseDeleted';

/**
 * The details of the product variants created, updated, or deleted.
 */
export interface AdminBatchProductVariantResponse {
  /** The created product variants. */
  created: AdminProductVariant[];
  /** The details of the deleted product variants. */
  deleted: AdminBatchProductVariantResponseDeleted;
  /** The updated product variants. */
  updated: AdminProductVariant[];
}
