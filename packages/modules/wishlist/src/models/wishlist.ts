import { model } from "@medusajs/framework/utils";

/**
 * @class Wishlist
 * @description Represents a wishlist in the system.
 *
 * This model defines the structure for storing wishlist information. Each wishlist
 * is associated with a specific reference.
 */
export const Wishlist = model.define("wishlist", {
  /**
   * @property {string} id - The ID of the wishlist.
   * @description Auto-generated primary key with prefix 'wish'
   * @example "wish_01H9X8Y7Z6W5V4U3T2S1R0Q"
   */
  id: model.id({ prefix: "wish" }).primaryKey(),
  /**
   * @property {string} reference - The reference of the wishlist.
   * @description The reference of the wishlist.
   * @example "product"
   */
  reference: model.enum(["product"]),
});
