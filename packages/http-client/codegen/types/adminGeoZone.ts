/**
 * Generated by orval v7.3.0 🍺
 * Do not edit manually.
 * Medusa API
 * OpenAPI spec version: 1.0.0
 */
import type { AdminGeoZonePostalExpression } from './adminGeoZonePostalExpression';
import type { AdminGeoZoneType } from './adminGeoZoneType';

/**
 * The geo zone's geo zones.
 */
export interface AdminGeoZone {
  /** The geo zone's city. */
  city: string;
  /** The geo zone's country code. */
  country_code: string;
  /** The geo zone's created at. */
  created_at: string;
  /** The geo zone's deleted at. */
  deleted_at: string;
  /** The geo zone's ID. */
  id: string;
  /** The geo zone's postal expression. */
  postal_expression: AdminGeoZonePostalExpression;
  /** The geo zone's province code. */
  province_code: string;
  /** The geo zone's type. */
  type: AdminGeoZoneType;
  /** The geo zone's updated at. */
  updated_at: string;
}
