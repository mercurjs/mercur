/**
 * Generated by orval v7.3.0 🍺
 * Do not edit manually.
 * Medusa API
 * OpenAPI spec version: 1.0.0
 */
import type { StoreOrderLineItemTaxLinesItemAllOfItemVariantCalculatedPrice } from './storeOrderLineItemTaxLinesItemAllOfItemVariantCalculatedPrice';
import type { StoreOrderLineItemTaxLinesItemAllOfItemVariantMetadata } from './storeOrderLineItemTaxLinesItemAllOfItemVariantMetadata';
import type { StoreOrderLineItemTaxLinesItemAllOfItemVariantOptionsItem } from './storeOrderLineItemTaxLinesItemAllOfItemVariantOptionsItem';
import type { StoreOrderLineItemTaxLinesItemAllOfItemVariantProduct } from './storeOrderLineItemTaxLinesItemAllOfItemVariantProduct';

/**
 * The item's variant.
 */
export type StoreOrderLineItemTaxLinesItemAllOfItemVariant = {
  /** The variant's allow backorder. */
  allow_backorder: boolean;
  /** The variant's barcode. */
  barcode: string;
  /** The variant's calculated price. */
  calculated_price?: StoreOrderLineItemTaxLinesItemAllOfItemVariantCalculatedPrice;
  /** The variant's created at. */
  created_at: string;
  /** The variant's deleted at. */
  deleted_at: string;
  /** The variant's ean. */
  ean: string;
  /** The variant's height. */
  height: number;
  /** The variant's hs code. */
  hs_code: string;
  /** The variant's ID. */
  id: string;
  /** The variant's inventory quantity. */
  inventory_quantity?: number;
  /** The variant's length. */
  length: number;
  /** The variant's manage inventory. */
  manage_inventory: boolean;
  /** The variant's material. */
  material: string;
  /** The variant's metadata. */
  metadata?: StoreOrderLineItemTaxLinesItemAllOfItemVariantMetadata;
  /** The variant's mid code. */
  mid_code: string;
  /** The variant's options. */
  options: StoreOrderLineItemTaxLinesItemAllOfItemVariantOptionsItem[];
  /** The variant's origin country. */
  origin_country: string;
  /** The variant's product. */
  product?: StoreOrderLineItemTaxLinesItemAllOfItemVariantProduct;
  /** The variant's product id. */
  product_id?: string;
  /** The variant's sku. */
  sku: string;
  /** The variant's title. */
  title: string;
  /** The variant's upc. */
  upc: string;
  /** The variant's updated at. */
  updated_at: string;
  /** The variant's variant rank. */
  variant_rank?: number;
  /** The variant's weight. */
  weight: number;
  /** The variant's width. */
  width: number;
};
