/**
 * Generated by orval v7.3.0 🍺
 * Do not edit manually.
 * Medusa API
 * OpenAPI spec version: 1.0.0
 */

/**
 * Apply filters on the parent tax region's ID to retrieve its child tax regions.
 */
export type AdminGetTaxRegionsParentIdOneOf = {
  /** Filter arrays that contain some of the values of this parameter. */
  $contains?: string[];
  /** Filter by an exact match. */
  $eq?: string;
  /** Filter by values greater than this parameter. Useful for numbers and dates only. */
  $gt?: string;
  /** Filter by values greater than or equal to this parameter. Useful for numbers and dates only. */
  $gte?: string;
  /** Apply a case-insensitive `like` filter. Useful for strings only. */
  $ilike?: string;
  /** Filter by values in this array's items. */
  $in?: string[];
  /** Apply a `like` filter. Useful for strings only. */
  $like?: string;
  /** Filter by values less than this parameter. Useful for numbers and dates only. */
  $lt?: string;
  /** Filter by values less than or equal to this parameter. Useful for numbers and dates only. */
  $lte?: string;
  /** Filter by values not matching this parameter. */
  $ne?: string;
  /** Filter by values not in this array's items. */
  $nin?: string[];
  /** Apply a regex filter. Useful for strings only. */
  $re?: string;
};
