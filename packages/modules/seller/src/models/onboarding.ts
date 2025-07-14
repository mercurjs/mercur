import { model } from "@medusajs/framework/utils";

import { Seller } from "./seller";

/**
 * @class SellerOnboarding
 * @description Represents a seller onboarding in the system.
 *
 * This model defines the structure for storing seller onboarding information. Each onboarding
 * is associated with a specific seller, and includes information about the seller's store
 * information, Stripe connection, locations, products, and the seller itself.
 */
export const SellerOnboarding = model.define("seller_onboarding", {
  /**
   * @property {string} id - The ID of the seller onboarding.
   * @description Auto-generated primary key with prefix 'sel_onb'
   * @example "sel_onb_01H9X8Y7Z6W5V4U3T2S1R0Q"
   */
  id: model.id({ prefix: "sel_onb" }).primaryKey(),
  /**
   * @property {boolean} store_information - The store information of the seller onboarding.
   * @description The store information of the seller onboarding.
   * @example true
   */
  store_information: model.boolean().default(false),
  /**
   * @property {boolean} stripe_connection - The stripe connection of the seller onboarding.
   * @description The stripe connection of the seller onboarding.
   * @example true
   */
  stripe_connection: model.boolean().default(false),
  /**
   * @property {boolean} locations_shipping - The locations shipping of the seller onboarding.
   * @description The locations shipping of the seller onboarding.
   * @example true
   */
  locations_shipping: model.boolean().default(false),
  /**
   * @property {boolean} products - The products of the seller onboarding.
   * @description The products of the seller onboarding.
   * @example true
   */
  products: model.boolean().default(false),
  /**
   * @property {Seller} seller - The seller associated with the seller onboarding.
   * @description The seller associated with the seller onboarding.
   */
  seller: model.belongsTo(() => Seller, { mappedBy: "onboarding" }),
});
