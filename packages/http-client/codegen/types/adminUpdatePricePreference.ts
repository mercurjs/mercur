/**
 * Generated by orval v7.3.0 🍺
 * Do not edit manually.
 * Medusa API
 * OpenAPI spec version: 1.0.0
 */

/**
 * The details to update in the price preference.
 */
export interface AdminUpdatePricePreference {
  /** The price preference's attribute. */
  attribute?: string;
  /** Whether prices are tax inclusive for this price preference. */
  is_tax_inclusive?: boolean;
  /** The price preference's value. */
  value?: string;
}
