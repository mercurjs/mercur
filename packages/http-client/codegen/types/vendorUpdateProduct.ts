/**
 * Generated by orval v7.3.0 🍺
 * Do not edit manually.
 * Medusa API
 * OpenAPI spec version: 1.0.0
 */
import type { VendorUpdateProductCategoriesItem } from './vendorUpdateProductCategoriesItem';
import type { VendorUpdateProductImagesItem } from './vendorUpdateProductImagesItem';
import type { VendorUpdateProductMetadata } from './vendorUpdateProductMetadata';
import type { UpdateProductOption } from './updateProductOption';
import type { VendorUpdateProductStatus } from './vendorUpdateProductStatus';
import type { VendorUpdateProductTagsItem } from './vendorUpdateProductTagsItem';
import type { UpdateProductVariant } from './updateProductVariant';

export interface VendorUpdateProduct {
  /** Product category IDs to associate with the product. */
  categories?: VendorUpdateProductCategoriesItem[];
  /**
   * The ID of the collection the product belongs to.
   * @nullable
   */
  collection_id?: string | null;
  /**
   * The description of the product.
   * @nullable
   */
  description?: string | null;
  /** Whether the product can be discounted. */
  discountable?: boolean;
  /**
   * The external ID of the product.
   * @nullable
   */
  external_id?: string | null;
  /**
   * The handle of the product.
   * @nullable
   */
  handle?: string | null;
  /**
   * The height of the product.
   * @nullable
   */
  height?: number | null;
  /**
   * The HS code of the product.
   * @nullable
   */
  hs_code?: string | null;
  /** Images of the product. */
  images?: VendorUpdateProductImagesItem[];
  /** Whether the product is a gift card. */
  is_giftcard?: boolean;
  /**
   * The length of the product.
   * @nullable
   */
  length?: number | null;
  /**
   * The material composition of the product.
   * @nullable
   */
  material?: string | null;
  /**
   * Additional metadata for the product.
   * @nullable
   */
  metadata?: VendorUpdateProductMetadata;
  /**
   * The MID code of the product.
   * @nullable
   */
  mid_code?: string | null;
  /** The product options to update. */
  options?: UpdateProductOption[];
  /**
   * The country of origin of the product.
   * @nullable
   */
  origin_country?: string | null;
  /** The status of the product. */
  status?: VendorUpdateProductStatus;
  /**
   * The subtitle of the product.
   * @nullable
   */
  subtitle?: string | null;
  /** Product tag IDs to associate with the product. */
  tags?: VendorUpdateProductTagsItem[];
  /**
   * The thumbnail of the product.
   * @nullable
   */
  thumbnail?: string | null;
  /** The title of the product. */
  title?: string;
  /**
   * The ID of the product type.
   * @nullable
   */
  type_id?: string | null;
  /** The product variants to update. */
  variants?: UpdateProductVariant[];
  /**
   * The weight of the product.
   * @nullable
   */
  weight?: number | null;
  /**
   * The width of the product.
   * @nullable
   */
  width?: number | null;
}
