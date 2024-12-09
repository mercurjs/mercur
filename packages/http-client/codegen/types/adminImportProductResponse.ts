/**
 * Generated by orval v7.3.0 🍺
 * Do not edit manually.
 * Medusa API
 * OpenAPI spec version: 1.0.0
 */
import type { AdminImportProductResponseSummary } from './adminImportProductResponseSummary';

/**
 * The import process's details.
 */
export interface AdminImportProductResponse {
  /** The import's summary. */
  summary: AdminImportProductResponseSummary;
  /** The ID of the workflow execution's transaction. This is useful to confirm the import using the `/admin/products/:transaction-id/import` API route. */
  transaction_id: string;
}
