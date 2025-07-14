import { model } from "@medusajs/framework/utils";

import { Payout } from "./payout";

/**
 * @class PayoutReversal
 * @description Represents a payout reversal in the system.
 *
 * This model defines the structure for storing payout reversal information. Each payout reversal
 * is associated with a specific payout.
 */
export const PayoutReversal = model.define("payout_reversal", {
  /**
   * @property {string} id - Unique identifier for the payout reversal
   * @description Auto-generated primary key with prefix 'prev'
   * @example "prev_01H9X8Y7Z6W5V4U3T2S1R0Q"
   */
  id: model.id({ prefix: "prev" }).primaryKey(),
  /**
   * @property {string} currency_code - The currency code of the payout reversal
   * @description The currency code of the payout reversal
   * @example "USD"
   */
  currency_code: model.text(),
  /**
   * @property {number} amount - The amount of the payout reversal
   * @description The amount of the payout reversal
   * @example 100
   */
  amount: model.bigNumber(),
  /**
   * @property {string} data - The data of the payout reversal
   * @description The data of the payout reversal
   * @example "payout_reversal_data"
   */
  data: model.json().nullable(),
  /**
   * @property {Payout} payout - The payout of the payout reversal
   * @description The payout of the payout reversal
   * @example "payout_01H9X8Y7Z6W5V4U3T2S1R0Q"
   */
  payout: model.belongsTo(() => Payout, {
    mappedBy: "reversals",
  }),
});
