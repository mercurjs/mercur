/**
 * Generated by orval v7.3.0 🍺
 * Do not edit manually.
 * Medusa API
 * OpenAPI spec version: 1.0.0
 */
import type { AdminOrderAddress } from './adminOrderAddress';
import type { AdminCustomer } from './adminCustomer';
import type { AdminOrderPreviewFulfillmentStatus } from './adminOrderPreviewFulfillmentStatus';
import type { AdminOrderFulfillment } from './adminOrderFulfillment';
import type { AdminOrderPreviewItemsItem } from './adminOrderPreviewItemsItem';
import type { AdminOrderPreviewMetadata } from './adminOrderPreviewMetadata';
import type { AdminOrderChange } from './adminOrderChange';
import type { AdminPaymentCollection } from './adminPaymentCollection';
import type { AdminOrderPreviewPaymentStatus } from './adminOrderPreviewPaymentStatus';
import type { AdminSalesChannel } from './adminSalesChannel';
import type { AdminOrderPreviewShippingMethodsItem } from './adminOrderPreviewShippingMethodsItem';
import type { BaseOrderSummary } from './baseOrderSummary';
import type { BaseOrderTransaction } from './baseOrderTransaction';

/**
 * A preview of an order if a change, such as exchange, return, edit, or claim is applied on it.
 */
export interface AdminOrderPreview {
  billing_address?: AdminOrderAddress;
  /** The date the order was created. */
  created_at: string;
  /** The order's currency code. */
  currency_code: string;
  customer?: AdminCustomer;
  /** The ID of the customer that placed the order. */
  customer_id: string;
  /** The tax total of order's discount or promotion. */
  discount_tax_total: number;
  /** The order's discount or promotions total. */
  discount_total: number;
  /** The order's display ID. */
  display_id?: number;
  /** The email of the customer that placed the order. */
  email: string;
  /** The order's fulfillment status. */
  fulfillment_status: AdminOrderPreviewFulfillmentStatus;
  /** The order's fulfillments. */
  fulfillments?: AdminOrderFulfillment[];
  /** The tax total of the order's gift card. */
  gift_card_tax_total: number;
  /** The order's gift card total. */
  gift_card_total: number;
  /** The order's ID. */
  id: string;
  /** The total of the order's items excluding taxes, including promotions. */
  item_subtotal: number;
  /** The tax total of the order's items including promotions. */
  item_tax_total: number;
  /** The total of the order's items including taxes and promotions. */
  item_total: number;
  /** The order's items. */
  items?: AdminOrderPreviewItemsItem[];
  /** The order's metadata, can hold custom key-value pairs. */
  metadata?: AdminOrderPreviewMetadata;
  order_change: AdminOrderChange;
  /** The total of the order's items excluding taxes, including promotions. */
  original_item_subtotal: number;
  /** The tax total of the order's items excluding promotions. */
  original_item_tax_total: number;
  /** The total of the order's items including taxes, excluding promotions. */
  original_item_total: number;
  /** The order's shipping total excluding taxes, including promotions. */
  original_shipping_subtotal: number;
  /** The tax total of the order's shipping excluding promotions. */
  original_shipping_tax_total: number;
  /** The order's shipping total including taxes, excluding promotions. */
  original_shipping_total: number;
  /** The order's total excluding taxes, including promotions. */
  original_subtotal: number;
  /** The order's tax total, excluding promotions. */
  original_tax_total: number;
  /** The order's total excluding promotions, including taxes. */
  original_total: number;
  /** The order's payment collections. */
  payment_collections: AdminPaymentCollection[];
  /** The order's payment status. */
  payment_status: AdminOrderPreviewPaymentStatus;
  /** The ID of the order's associated region. */
  region_id: string;
  /** The total of the requested return. */
  return_requested_total: number;
  sales_channel?: AdminSalesChannel;
  /** The ID of the sales channel that the order was placed in. */
  sales_channel_id: string;
  shipping_address?: AdminOrderAddress;
  /** The order's shipping methods. */
  shipping_methods?: AdminOrderPreviewShippingMethodsItem[];
  /** The order's shipping total excluding taxes, including promotions. */
  shipping_subtotal: number;
  /** The tax total of the order's shipping. */
  shipping_tax_total: number;
  /** The order's shipping total including taxes and promotions. */
  shipping_total: number;
  /** The order's total excluding taxes, including promotions. */
  subtotal: number;
  summary: BaseOrderSummary;
  /** The order's tax total including promotions. */
  tax_total: number;
  /** The order's total including taxes and promotions. */
  total: number;
  /** The order's transactions. */
  transactions?: BaseOrderTransaction[];
  /** The date the order was updated. */
  updated_at: string;
  /** The order's version when this preview is applied. */
  version: number;
}
