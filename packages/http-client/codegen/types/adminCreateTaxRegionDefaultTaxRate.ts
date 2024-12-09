/**
 * Generated by orval v7.3.0 🍺
 * Do not edit manually.
 * Medusa API
 * OpenAPI spec version: 1.0.0
 */
import type { AdminCreateTaxRegionDefaultTaxRateMetadata } from './adminCreateTaxRegionDefaultTaxRateMetadata';

/**
 * The tax region's default tax rate.
 */
export type AdminCreateTaxRegionDefaultTaxRate = {
  /** The code the tax rate is identified by */
  code: string;
  /** Whether the tax rate should be combined with parent rates. */
  is_combinable?: boolean;
  /** The default tax rate's metadata, used to store custom key-value pairs. */
  metadata?: AdminCreateTaxRegionDefaultTaxRateMetadata;
  /** The default tax rate's name. */
  name: string;
  /** The rate to charge. */
  rate?: number;
};
