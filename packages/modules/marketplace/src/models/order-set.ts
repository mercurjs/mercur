import { model } from "@medusajs/framework/utils";

/**
 * @class OrderSet
 * @description Represents an order set in the system.
 *
 * This model defines the structure for storing order set information. Each order set
 * is associated with a specific sales channel, cart, customer, and payment collection.
 */
export const OrderSet = model.define("order_set", {
  /**
   * @property {string} id - Unique identifier for the order set
   * @description Auto-generated primary key with prefix 'ordset'
   * @example "ordset_01H9X8Y7Z6W5V4U3T2S1R0Q"
   */
  id: model.id({ prefix: "ordset" }).primaryKey(),

  /**
   * @property {number} display_id - The display id of the order set
   * @description The display id of the order set
   * @example 123456
   */
  display_id: model.number().nullable(),

  /**
   * @property {string} sales_channel_id - The sales channel id of the order set
   * @description The sales channel id of the order set
   * @example "sales_channel_01H9X8Y7Z6W5V4U3T2S1R0Q"
   */
  sales_channel_id: model.text(),

  /**
   * @property {string} cart_id - The cart id of the order set
   * @description The cart id of the order set
   * @example "cart_01H9X8Y7Z6W5V4U3T2S1R0Q"
   */
  cart_id: model.text(),

  /**
   * @property {string} customer_id - The customer id of the order set
   * @description The customer id of the order set
   * @example "customer_01H9X8Y7Z6W5V4U3T2S1R0Q"
   */
  customer_id: model.text().nullable(),

  /**
   * @property {string} payment_collection_id - The payment collection id of the order set
   * @description The payment collection id of the order set
   * @example "payment_collection_01H9X8Y7Z6W5V4U3T2S1R0Q"
   */
  payment_collection_id: model.text(),
});
