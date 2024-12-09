/**
 * Generated by orval v7.3.0 🍺
 * Do not edit manually.
 * Medusa API
 * OpenAPI spec version: 1.0.0
 */
import type { AdminCreateReturnReasonMetadata } from './adminCreateReturnReasonMetadata';

/**
 * The details of the return reason to create.
 */
export interface AdminCreateReturnReason {
  /** The return reason's description. */
  description?: string;
  /** The return reason's label. */
  label: string;
  /** The return reason's metadata, can hold custom key-value pairs. */
  metadata?: AdminCreateReturnReasonMetadata;
  /** The ID of the parent return reason. */
  parent_return_reason_id?: string;
  /** The return reason's value. */
  value: string;
}
