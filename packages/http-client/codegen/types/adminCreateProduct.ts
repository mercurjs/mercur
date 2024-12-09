/**
 * Generated by orval v7.3.0 🍺
 * Do not edit manually.
 * Medusa API
 * OpenAPI spec version: 1.0.0
 */
import type { AdminCreateProductCategoriesItem } from './adminCreateProductCategoriesItem';
import type { AdminCreateProductImagesItem } from './adminCreateProductImagesItem';
import type { AdminCreateProductMetadata } from './adminCreateProductMetadata';
import type { AdminCreateProductOption } from './adminCreateProductOption';
import type { AdminCreateProductSalesChannelsItem } from './adminCreateProductSalesChannelsItem';
import type { AdminCreateProductStatus } from './adminCreateProductStatus';
import type { AdminCreateProductTagsItem } from './adminCreateProductTagsItem';
import type { AdminCreateProductVariant } from './adminCreateProductVariant';

/**
 * The product's details.
 */
export interface AdminCreateProduct {
  /** The categories the product belongs to. */
  categories?: AdminCreateProductCategoriesItem[];
  /** The ID of the collection the product belongs to. */
  collection_id?: string;
  /** The product's description. */
  description?: string;
  /** Whether the product is discountable. */
  discountable?: boolean;
  /** The ID of the product in an external or third-party system. */
  external_id?: string;
  /** The product's handle. */
  handle?: string;
  /** The product's height. */
  height?: number;
  /** The product's HS code. */
  hs_code?: string;
  /** The product's images. */
  images?: AdminCreateProductImagesItem[];
  /** Whether the product is a gift card. */
  is_giftcard?: boolean;
  /** The product's length. */
  length?: number;
  /** The product's material. */
  material?: string;
  /** The product's metadata, used to store custom key-value pairs. */
  metadata?: AdminCreateProductMetadata;
  /** The product's MID code. */
  mid_code?: string;
  /** The product's options. */
  options: AdminCreateProductOption[];
  /** The product's origin country. */
  origin_country?: string;
  /** The sales channels the product is available in. */
  sales_channels?: AdminCreateProductSalesChannelsItem[];
  /** The product's status. */
  status?: AdminCreateProductStatus;
  /** The product's subtitle. */
  subtitle?: string;
  /** The product's tags. */
  tags?: AdminCreateProductTagsItem[];
  /** The URL of the product's thumbnail. */
  thumbnail?: string;
  /** The product's title. */
  title: string;
  /** The ID of the type the product belongs to. */
  type_id?: string;
  /** The product's variants. */
  variants?: AdminCreateProductVariant[];
  /** The product's weight. */
  weight?: number;
  /** The product's width. */
  width?: number;
}
