/**
 * Generated by orval v7.3.0 🍺
 * Do not edit manually.
 * Medusa API
 * OpenAPI spec version: 1.0.0
 */
import type { StoreCartLineItemTaxLinesItemAllOfItem } from './storeCartLineItemTaxLinesItemAllOfItem';

/**
 * The tax line's details.
 */
export type StoreCartLineItemTaxLinesItemAllOf = {
  /** The code that the tax rate is identified by. */
  code: string;
  /** The date the tax line was created. */
  created_at: string;
  /** The tax line's description. */
  description?: string;
  /** The tax line's ID. */
  id: string;
  /** The details of the item that the tax line belongs to. */
  item: StoreCartLineItemTaxLinesItemAllOfItem;
  /** The ID of the line item this tax line belongs to. */
  item_id: string;
  /** The ID of the tax provider used to calculate the tax line. */
  provider_id?: string;
  /** The charged rate. */
  rate: number;
  /** The item's total excluding taxes, including promotions. */
  subtotal: number;
  /** The ID of the applied tax rate. */
  tax_rate_id?: string;
  /** The item's total including taxes and promotions. */
  total: number;
  /** The date the tax line was updated. */
  updated_at: string;
};
