import { model } from "@medusajs/framework/utils";

import { OrderReturnRequestLineItem } from "./return-request-line-item";

/**
 * @class OrderReturnRequest
 * @description Represents an order return request in the system.
 *
 * This model defines the structure for storing order return request information. Each order
 * return request is associated with a specific customer, can have a note, and can be associated
 * with a shipping option, vendor reviewer, admin reviewer, and line items.
 */
export const OrderReturnRequest = model.define("order_return_request", {
  /**
   * @property {string} id - Unique identifier for the order return request
   * @description Auto-generated primary key with prefix 'oretreq'
   * @example "oretreq_01H9X8Y7Z6W5V4U3T2S1R0Q"
   */
  id: model.id({ prefix: "oretreq" }).primaryKey(),

  /**
   * @property {string} customer_id - The ID of the customer
   * @description The ID of the customer
   * @example "cus_01H9X8Y7Z6W5V4U3T2S1R0Q"
   */
  customer_id: model.text(),

  /**
   * @property {string} customer_note - The note of the customer
   * @description The note of the customer
   * @example "I want to return the product"
   */
  customer_note: model.text(),

  /**
   * @property {string} shipping_option_id - The ID of the shipping option
   * @description The ID of the shipping option
   * @example "so_01H9X8Y7Z6W5V4U3T2S1R0Q"
   */
  shipping_option_id: model.text().nullable(),

  /**
   * @property {string} vendor_reviewer_id - The ID of the vendor reviewer
   * @description The ID of the vendor reviewer
   */
  vendor_reviewer_id: model.text().nullable(),

  /**
   * @property {string} vendor_reviewer_note - The note of the vendor reviewer
   * @description The note of the vendor reviewer
   * @example "I accept the return request"
   */
  vendor_reviewer_note: model.text().nullable(),

  /**
   * @property {Date} vendor_review_date - The date of the vendor review
   * @description The date of the vendor review
   * @example "2021-01-01"
   */
  vendor_review_date: model.dateTime().nullable(),

  /**
   * @property {string} admin_reviewer_id - The ID of the admin reviewer
   * @description The ID of the admin reviewer
   */
  admin_reviewer_id: model.text().nullable(),

  /**
   * @property {string} admin_reviewer_note - The note of the admin reviewer
   * @description The note of the admin reviewer
   * @example "I accept the return request"
   */
  admin_reviewer_note: model.text().nullable(),

  /**
   * @property {Date} admin_review_date - The date of the admin review
   * @description The date of the admin review
   * @example "2021-01-01"
   */
  admin_review_date: model.dateTime().nullable(),

  /**
   * @property {OrderReturnRequestLineItem[]} line_items - The line items of the order return request
   * @description The line items of the order return request
   * @example "oretreqli_01H9X8Y7Z6W5V4U3T2S1R0Q"
   */
  line_items: model.hasMany(() => OrderReturnRequestLineItem, {
    mappedBy: "return_request",
  }),

  /**
   * @property {string} status - The status of the order return request
   * @description The status of the order return request
   * @example "pending"
   */
  status: model
    .enum(["pending", "refunded", "withdrawn", "escalated", "canceled"])
    .default("pending"),
});
