/**
 * Generated by orval v7.3.0 🍺
 * Do not edit manually.
 * Medusa API
 * OpenAPI spec version: 1.0.0
 */
import type { AdminUpdateCollectionMetadata } from './adminUpdateCollectionMetadata';

/**
 * The details to update in a collection.
 */
export interface AdminUpdateCollection {
  /** The collection's handle. */
  handle?: string;
  /** The collection's metadata, can hold custom key-value pairs. */
  metadata?: AdminUpdateCollectionMetadata;
  /** The collection's title. */
  title?: string;
}
