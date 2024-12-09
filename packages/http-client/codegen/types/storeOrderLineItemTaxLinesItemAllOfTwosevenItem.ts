/**
 * Generated by orval v7.3.0 🍺
 * Do not edit manually.
 * Medusa API
 * OpenAPI spec version: 1.0.0
 */
import type { StoreOrderLineItemTaxLinesItemAllOfTwosevenItemAdjustmentsItem } from './storeOrderLineItemTaxLinesItemAllOfTwosevenItemAdjustmentsItem';
import type { StoreOrderLineItemTaxLinesItemAllOfTwosevenItemDetail } from './storeOrderLineItemTaxLinesItemAllOfTwosevenItemDetail';
import type { StoreOrderLineItemTaxLinesItemAllOfTwosevenItemMetadata } from './storeOrderLineItemTaxLinesItemAllOfTwosevenItemMetadata';
import type { StoreOrderLineItemTaxLinesItemAllOfTwosevenItemProduct } from './storeOrderLineItemTaxLinesItemAllOfTwosevenItemProduct';
import type { StoreOrderLineItemTaxLinesItemAllOfTwosevenItemTaxLinesItem } from './storeOrderLineItemTaxLinesItemAllOfTwosevenItemTaxLinesItem';
import type { StoreOrderLineItemTaxLinesItemAllOfTwosevenItemVariant } from './storeOrderLineItemTaxLinesItemAllOfTwosevenItemVariant';
import type { StoreOrderLineItemTaxLinesItemAllOfTwosevenItemVariantOptionValues } from './storeOrderLineItemTaxLinesItemAllOfTwosevenItemVariantOptionValues';

/**
 * The tax line's item.
 */
export type StoreOrderLineItemTaxLinesItemAllOfTwosevenItem = {
  /** The item's adjustments. */
  adjustments?: StoreOrderLineItemTaxLinesItemAllOfTwosevenItemAdjustmentsItem[];
  /** The item's compare at unit price. */
  compare_at_unit_price?: number;
  /** The item's created at. */
  created_at: string;
  detail: StoreOrderLineItemTaxLinesItemAllOfTwosevenItemDetail;
  /** The item's discount tax total. */
  discount_tax_total: number;
  /** The item's discount total. */
  discount_total: number;
  /** The item's ID. */
  id: string;
  /** The item's is discountable. */
  is_discountable: boolean;
  /** The item's is tax inclusive. */
  is_tax_inclusive: boolean;
  /** The item's item subtotal. */
  item_subtotal: number;
  /** The item's item tax total. */
  item_tax_total: number;
  /** The item's item total. */
  item_total: number;
  /** The item's metadata. */
  metadata: StoreOrderLineItemTaxLinesItemAllOfTwosevenItemMetadata;
  /** The item's original subtotal. */
  original_subtotal: number;
  /** The item's original tax total. */
  original_tax_total: number;
  /** The item's original total. */
  original_total: number;
  /** The item's product. */
  product?: StoreOrderLineItemTaxLinesItemAllOfTwosevenItemProduct;
  /** The item's product collection. */
  product_collection: string;
  /** The item's product description. */
  product_description: string;
  /** The item's product handle. */
  product_handle: string;
  /** The item's product id. */
  product_id: string;
  /** The item's product subtitle. */
  product_subtitle: string;
  /** The item's product title. */
  product_title: string;
  /** The item's product type. */
  product_type: string;
  /** The item's quantity. */
  quantity: number;
  /** The item's refundable total. */
  refundable_total: number;
  /** The item's refundable total per unit. */
  refundable_total_per_unit: number;
  /** The item's requires shipping. */
  requires_shipping: boolean;
  /** The item's subtitle. */
  subtitle: string;
  /** The item's subtotal. */
  subtotal: number;
  /** The item's tax lines. */
  tax_lines?: StoreOrderLineItemTaxLinesItemAllOfTwosevenItemTaxLinesItem[];
  /** The item's tax total. */
  tax_total: number;
  /** The item's thumbnail. */
  thumbnail: string;
  /** The item's title. */
  title: string;
  /** The item's total. */
  total: number;
  /** The item's unit price. */
  unit_price: number;
  /** The item's updated at. */
  updated_at: string;
  /** The item's variant. */
  variant?: StoreOrderLineItemTaxLinesItemAllOfTwosevenItemVariant;
  /** The item's variant barcode. */
  variant_barcode: string;
  /** The item's variant id. */
  variant_id: string;
  /** The item's variant option values. */
  variant_option_values: StoreOrderLineItemTaxLinesItemAllOfTwosevenItemVariantOptionValues;
  /** The item's variant sku. */
  variant_sku: string;
  /** The item's variant title. */
  variant_title: string;
};
