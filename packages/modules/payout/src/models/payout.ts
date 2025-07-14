import { model } from "@medusajs/framework/utils";

import { PayoutAccount } from "./payout-account";
import { PayoutReversal } from "./payout-reversal";

/**
 * @class Payout
 * @description Represents a payout in the system.
 *
 * This model defines the structure for storing payout information. Each payout
 * is associated with a specific currency code, amount, data, payout account, and reversals.
 */
export const Payout = model.define("payout", {
  /**
   * @property {string} id - Unique identifier for the payout
   * @description Auto-generated primary key with prefix 'pout'
   * @example "pout_01H9X8Y7Z6W5V4U3T2S1R0Q"
   */
  id: model.id({ prefix: "pout" }).primaryKey(),
  /**
   * @property {string} currency_code - The currency code of the payout
   * @description The currency code of the payout
   * @example "USD"
   */
  currency_code: model.text(),
  /**
   * @property {number} amount - The amount of the payout
   * @description The amount of the payout
   * @example 100
   */
  amount: model.bigNumber(),
  /**
   * @property {string} data - The data of the payout
   * @description The data of the payout
   * @example "payout_data"
   */
  data: model.json().nullable(),
  /**
   * @property {PayoutAccount} payout_account - The payout account of the payout
   * @description The payout account of the payout
   * @example "pacc_01H9X8Y7Z6W5V4U3T2S1R0Q"
   */
  payout_account: model.belongsTo(() => PayoutAccount, {
    mappedBy: "payouts",
  }),
  /**
   * @property {PayoutReversal[]} reversals - The reversals of the payout
   * @description The reversals of the payout
   * @example "prev_01H9X8Y7Z6W5V4U3T2S1R0Q"
   */
  reversals: model.hasMany(() => PayoutReversal),
});
