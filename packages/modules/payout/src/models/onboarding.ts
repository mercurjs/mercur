import { model } from "@medusajs/framework/utils";

import { PayoutAccount } from "./payout-account";

/**
 * @class Onboarding
 * @description Represents an onboarding in the system.
 *
 * This model defines the structure for storing onboarding information. Each onboarding
 * is associated with a specific payout account.
 */
export const Onboarding = model.define("onboarding", {
  /**
   * @property {string} id - Unique identifier for the onboarding
   * @description Auto-generated primary key with prefix 'onb'
   * @example "onb_01H9X8Y7Z6W5V4U3T2S1R0Q"
   */
  id: model.id({ prefix: "onb" }).primaryKey(),

  /**
   * @property {string} data - The data of the onboarding
   * @description The data of the onboarding
   * @example "onboarding_data"
   */
  data: model.json().nullable(),

  /**
   * @property {string} context - The context of the onboarding
   * @description The context of the onboarding
   * @example "onboarding_context"
   */
  context: model.json().nullable(),

  /**
   * @property {PayoutAccount} payout_account - The payout account of the onboarding
   * @description The payout account of the onboarding
   * @example "pacc_01H9X8Y7Z6W5V4U3T2S1R0Q"
   */
  payout_account: model.belongsTo(() => PayoutAccount, {
    mappedBy: "onboarding",
  }),
});
