import { model } from "@medusajs/framework/utils";

/**
 * @class SplitOrderPayment
 * @description Represents a split order payment in the system.
 *
 * This model defines the structure for storing split order payment information. Each split order payment
 * is associated with a specific status, currency code, authorized amount, captured amount, refunded amount,
 * and payment collection id.
 */
export const SplitOrderPayment = model.define("split_order_payment", {
  /**
   * @property {string} id - The ID of the split order payment.
   * @description Auto-generated primary key with prefix 'sp_ord_pay'
   * @example "sp_ord_pay_01H9X8Y7Z6W5V4U3T2S1R0Q"
   */
  id: model.id({ prefix: "sp_ord_pay" }).primaryKey(),
  /**
   * @property {string} status - The status of the split order payment.
   * @description The status of the split order payment.
   * @example "pending"
   */
  status: model.text(),
  /**
   * @property {string} currency_code - The currency code of the split order payment.
   * @description The currency code of the split order payment.
   * @example "USD"
   */
  currency_code: model.text(),
  /**
   * @property {number} authorized_amount - The authorized amount of the split order payment.
   * @description The authorized amount of the split order payment.
   * @example 100
   */
  authorized_amount: model.bigNumber(),
  /**
   * @property {number} captured_amount - The captured amount of the split order payment.
   * @description The captured amount of the split order payment.
   * @example 100
   */
  captured_amount: model.bigNumber().default(0),
  /**
   * @property {number} refunded_amount - The refunded amount of the split order payment.
   * @description The refunded amount of the split order payment.
   * @example 100
   */
  refunded_amount: model.bigNumber().default(0),
  /**
   * @property {string} payment_collection_id - The payment collection id of the split order payment.
   * @description The payment collection id of the split order payment.
   */
  payment_collection_id: model.text(),
});
