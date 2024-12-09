/**
 * Generated by orval v7.3.0 🍺
 * Do not edit manually.
 * Medusa API
 * OpenAPI spec version: 1.0.0
 */
import type { BaseCapture } from './baseCapture';
import type { AdminPaymentData } from './adminPaymentData';
import type { AdminPaymentPaymentCollection } from './adminPaymentPaymentCollection';
import type { AdminPaymentSession } from './adminPaymentSession';
import type { AdminRefund } from './adminRefund';

/**
 * The payment's details.
 */
export interface AdminPayment {
  /** The payment's amount. */
  amount: number;
  /** The amount authorized of the payment. */
  authorized_amount?: number;
  /** The date the payment was canceled. */
  canceled_at?: string;
  /** The captured amount of the payment. */
  captured_amount?: number;
  /** The date the payment was captured. */
  captured_at?: string;
  /** The details of payment captures. */
  captures?: BaseCapture[];
  /** The ID of the associated cart. */
  cart_id?: string;
  /** The date the payment was created. */
  created_at?: string;
  /** The payment's currency code. */
  currency_code: string;
  /** ID of the associated customer. */
  customer_id?: string;
  /** The payment's data, useful for processing by the payment provider. */
  data?: AdminPaymentData;
  /** The payment's ID. */
  id: string;
  /** The ID of the associated order edit. */
  order_edit_id?: string;
  /** The ID of the associated order. */
  order_id?: string;
  payment_collection?: AdminPaymentPaymentCollection;
  payment_session?: AdminPaymentSession;
  /** The ID of the payment provider used to process this payment. */
  provider_id: string;
  /** The refunded amount of the payment. */
  refunded_amount?: number;
  /** The details of payment refunds. */
  refunds?: AdminRefund[];
  /** The date the payment was updated. */
  updated_at?: string;
}
