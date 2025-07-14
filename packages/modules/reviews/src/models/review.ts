import { model } from "@medusajs/framework/utils";

/**
 * @class Review
 * @description Represents a review in the system.
 *
 * This model defines the structure for storing review information. Each review
 * is associated with a specific reference (product or seller), a rating, and
 * optional customer and seller notes.
 */
export const Review = model.define("review", {
  /**
   * @property {string} id - The ID of the review.
   * @description Auto-generated primary key with prefix 'rev'
   * @example "rev_01H9X8Y7Z6W5V4U3T2S1R0Q"
   */
  id: model.id({ prefix: "rev" }).primaryKey(),
  /**
   * @property {string} reference - The reference of the review.
   * @description The reference of the review.
   * @example "product"
   */
  reference: model.enum(["product", "seller"]),
  /**
   * @property {number} rating - The rating of the review.
   * @description The rating of the review.
   * @example 5
   */
  rating: model.number(),
  /**
   * @property {string} customer_note - The customer note of the review.
   * @description The customer note of the review.
   * @example "This is a great product!"
   */
  customer_note: model.text().nullable(),
  /**
   * @property {string} seller_note - The seller note of the review.
   * @description The seller note of the review.
   * @example "This is a great product!"
   */
  seller_note: model.text().nullable(),
});
