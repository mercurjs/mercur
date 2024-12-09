/**
 * Generated by orval v7.3.0 🍺
 * Do not edit manually.
 * Medusa API
 * OpenAPI spec version: 1.0.0
 */
import type { GeoZoneZipPostalExpression } from './geoZoneZipPostalExpression';
import type { GeoZoneZipType } from './geoZoneZipType';

export interface GeoZoneZip {
  /** The city name of the geo zone. */
  city: string;
  /** The country code of the geo zone. */
  country_code: string;
  /** The postal code expression for the geo zone. */
  postal_expression: GeoZoneZipPostalExpression;
  /** The province code of the geo zone. */
  province_code: string;
  /** The type of the geo zone. */
  type: GeoZoneZipType;
}
