/**
 * Generated by orval v7.3.0 🍺
 * Do not edit manually.
 * Medusa API
 * OpenAPI spec version: 1.0.0
 */
import type { AdminGetShippingOptionsCreatedAtAndItem } from './adminGetShippingOptionsCreatedAtAndItem';
import type { AdminGetShippingOptionsCreatedAtEq } from './adminGetShippingOptionsCreatedAtEq';
import type { AdminGetShippingOptionsCreatedAtNot } from './adminGetShippingOptionsCreatedAtNot';
import type { AdminGetShippingOptionsCreatedAtOrItem } from './adminGetShippingOptionsCreatedAtOrItem';
import type { AdminGetShippingOptionsUpdatedAtAndItem } from './adminGetShippingOptionsUpdatedAtAndItem';
import type { AdminGetShippingOptionsUpdatedAtEq } from './adminGetShippingOptionsUpdatedAtEq';
import type { AdminGetShippingOptionsUpdatedAtNot } from './adminGetShippingOptionsUpdatedAtNot';
import type { AdminGetShippingOptionsUpdatedAtOrItem } from './adminGetShippingOptionsUpdatedAtOrItem';
import type { AdminGetShippingOptionsDeletedAtAndItem } from './adminGetShippingOptionsDeletedAtAndItem';
import type { AdminGetShippingOptionsDeletedAtEq } from './adminGetShippingOptionsDeletedAtEq';
import type { AdminGetShippingOptionsDeletedAtNot } from './adminGetShippingOptionsDeletedAtNot';
import type { AdminGetShippingOptionsDeletedAtOrItem } from './adminGetShippingOptionsDeletedAtOrItem';

export type AdminGetShippingOptionsParams = {
/**
 * Comma-separated fields that should be included in the returned data. if a field is prefixed with `+` it will be added to the default fields, using `-` will remove it from the default fields. without prefix it will replace the entire default fields.
 */
fields?: string;
/**
 * The number of items to skip when retrieving a list.
 */
offset?: number;
/**
 * Limit the number of items returned in the list.
 */
limit?: number;
/**
 * The field to sort the data by. By default, the sort order is ascending. To change the order to descending, prefix the field name with `-`.
 */
order?: string;
id?: string | string[];
/**
 * Search term to filter the shipping option's searchable properties.
 */
q?: string;
service_zone_id?: string | string[];
shipping_profile_id?: string | string[];
provider_id?: string | string[];
shipping_option_type_id?: string | string[];
/**
 * Filter by a shipping option's creation date.
 */
created_at?: {
  /** Join query parameters with an AND condition. Each object's content is the same type as the expected query parameters. */
  $and?: AdminGetShippingOptionsCreatedAtAndItem[];
  /** Filter arrays that contain all values of this parameter. */
  $contained?: string[];
  /** Filter arrays that contain some of the values of this parameter. */
  $contains?: string[];
  $eq?: AdminGetShippingOptionsCreatedAtEq;
  /** Filter by whether a value for this parameter exists (not `null`). */
  $exists?: boolean;
  /** Filter to apply on full-text properties. */
  $fulltext?: string;
  /** Filter by values greater than this parameter. Useful for numbers and dates only. */
  $gt?: string;
  /** Filter by values greater than or equal to this parameter. Useful for numbers and dates only. */
  $gte?: string;
  /** Apply a case-insensitive `like` filter. Useful for strings only. */
  $ilike?: string;
  /** Filter by values in this array. */
  $in?: string[];
  /** Apply a `like` filter. Useful for strings only. */
  $like?: string;
  /** Filter by values less than this parameter. Useful for numbers and dates only. */
  $lt?: string;
  /** Filter by values less than or equal to this parameter. Useful for numbers and dates only. */
  $lte?: string;
  /** Filter by values not equal to this parameter. */
  $ne?: string;
  /** Filter by values not in this array. */
  $nin?: string[];
  $not?: AdminGetShippingOptionsCreatedAtNot;
  /** Join query parameters with an OR condition. Each object's content is the same type as the expected query parameters. */
  $or?: AdminGetShippingOptionsCreatedAtOrItem[];
  /** Filter arrays that have overlapping values with this parameter. */
  $overlap?: string[];
  /** Apply a regex filter. Useful for strings only. */
  $re?: string;
};
/**
 * Filter by a shipping option's update date.
 */
updated_at?: {
  /** Join query parameters with an AND condition. Each object's content is the same type as the expected query parameters. */
  $and?: AdminGetShippingOptionsUpdatedAtAndItem[];
  /** Filter arrays that contain all values of this parameter. */
  $contained?: string[];
  /** Filter arrays that contain some of the values of this parameter. */
  $contains?: string[];
  $eq?: AdminGetShippingOptionsUpdatedAtEq;
  /** Filter by whether a value for this parameter exists (not `null`). */
  $exists?: boolean;
  /** Filter to apply on full-text properties. */
  $fulltext?: string;
  /** Filter by values greater than this parameter. Useful for numbers and dates only. */
  $gt?: string;
  /** Filter by values greater than or equal to this parameter. Useful for numbers and dates only. */
  $gte?: string;
  /** Apply a case-insensitive `like` filter. Useful for strings only. */
  $ilike?: string;
  /** Filter by values in this array. */
  $in?: string[];
  /** Apply a `like` filter. Useful for strings only. */
  $like?: string;
  /** Filter by values less than this parameter. Useful for numbers and dates only. */
  $lt?: string;
  /** Filter by values less than or equal to this parameter. Useful for numbers and dates only. */
  $lte?: string;
  /** Filter by values not equal to this parameter. */
  $ne?: string;
  /** Filter by values not in this array. */
  $nin?: string[];
  $not?: AdminGetShippingOptionsUpdatedAtNot;
  /** Join query parameters with an OR condition. Each object's content is the same type as the expected query parameters. */
  $or?: AdminGetShippingOptionsUpdatedAtOrItem[];
  /** Filter arrays that have overlapping values with this parameter. */
  $overlap?: string[];
  /** Apply a regex filter. Useful for strings only. */
  $re?: string;
};
/**
 * Filter by a shipping option's deletion date.
 */
deleted_at?: {
  /** Join query parameters with an AND condition. Each object's content is the same type as the expected query parameters. */
  $and?: AdminGetShippingOptionsDeletedAtAndItem[];
  /** Filter arrays that contain all values of this parameter. */
  $contained?: string[];
  /** Filter arrays that contain some of the values of this parameter. */
  $contains?: string[];
  $eq?: AdminGetShippingOptionsDeletedAtEq;
  /** Filter by whether a value for this parameter exists (not `null`). */
  $exists?: boolean;
  /** Filter to apply on full-text properties. */
  $fulltext?: string;
  /** Filter by values greater than this parameter. Useful for numbers and dates only. */
  $gt?: string;
  /** Filter by values greater than or equal to this parameter. Useful for numbers and dates only. */
  $gte?: string;
  /** Apply a case-insensitive `like` filter. Useful for strings only. */
  $ilike?: string;
  /** Filter by values in this array. */
  $in?: string[];
  /** Apply a `like` filter. Useful for strings only. */
  $like?: string;
  /** Filter by values less than this parameter. Useful for numbers and dates only. */
  $lt?: string;
  /** Filter by values less than or equal to this parameter. Useful for numbers and dates only. */
  $lte?: string;
  /** Filter by values not equal to this parameter. */
  $ne?: string;
  /** Filter by values not in this array. */
  $nin?: string[];
  $not?: AdminGetShippingOptionsDeletedAtNot;
  /** Join query parameters with an OR condition. Each object's content is the same type as the expected query parameters. */
  $or?: AdminGetShippingOptionsDeletedAtOrItem[];
  /** Filter arrays that have overlapping values with this parameter. */
  $overlap?: string[];
  /** Apply a regex filter. Useful for strings only. */
  $re?: string;
};
stock_location_id?: string | string[];
/**
 * Filter by whether the shipping option is used for returns.
 */
is_return?: boolean;
/**
 * Filter by whether the shipping option is used by admin users only.
 */
admin_only?: boolean;
};
