/**
 * Generated by orval v7.3.0 🍺
 * Do not edit manually.
 * Medusa API
 * OpenAPI spec version: 1.0.0
 */
import type { AdminPostDraftOrdersBodyAllOfShippingMethodsItemAmount } from './adminPostDraftOrdersBodyAllOfShippingMethodsItemAmount';
import type { AdminPostDraftOrdersBodyAllOfShippingMethodsItemData } from './adminPostDraftOrdersBodyAllOfShippingMethodsItemData';

/**
 * The shipping method's details.
 */
export type AdminPostDraftOrdersBodyAllOfShippingMethodsItem = {
  amount: AdminPostDraftOrdersBodyAllOfShippingMethodsItemAmount;
  /** The shipping method's data, useful for fulfillment providers. */
  data?: AdminPostDraftOrdersBodyAllOfShippingMethodsItemData;
  /** The shipping method's name. */
  name: string;
  /** The ID of the shipping option this method is created from. */
  option_id: string;
  /** The ID of an existing shipping method. */
  shipping_method_id?: string;
};
