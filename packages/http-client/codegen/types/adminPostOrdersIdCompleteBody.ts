/**
 * Generated by orval v7.3.0 🍺
 * Do not edit manually.
 * Medusa API
 * OpenAPI spec version: 1.0.0
 */
import type { AdminPostOrdersIdCompleteBodyAdditionalData } from './adminPostOrdersIdCompleteBodyAdditionalData';

/**
 * Pass additional custom data to the API route. This data is passed to the underlying workflow under the `additional_data` parameter.
 */
export type AdminPostOrdersIdCompleteBody = {
  /** Pass additional custom data to the API route. This data is passed to the underlying workflow under the `additional_data` parameter. */
  additional_data?: AdminPostOrdersIdCompleteBodyAdditionalData;
};
