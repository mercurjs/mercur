import { model } from "@medusajs/framework/utils";

import { PayoutAccountStatus } from "@mercurjs/framework";
import { Onboarding } from "./onboarding";
import { Payout } from "./payout";

/**
 * @class PayoutAccount
 * @description Represents a payout account in the system.
 *
 * This model defines the structure for storing payout account information. Each payout account
 * is associated with a specific reference ID, status, data, context, onboarding, and payouts.
 */
export const PayoutAccount = model.define("payout_account", {
  /**
   * @property {string} id - Unique identifier for the payout account
   * @description Auto-generated primary key with prefix 'pacc'
   * @example "pacc_01H9X8Y7Z6W5V4U3T2S1R0Q"
   */
  id: model.id({ prefix: "pacc" }).primaryKey(),
  /**
   * @property {PayoutAccountStatus} status - The status of the payout account
   * @description The status of the payout account
   * @example "pending"
   */
  status: model.enum(PayoutAccountStatus).default(PayoutAccountStatus.PENDING),
  /**
   * @property {string} reference_id - The reference id of the payout account
   * @description The reference id of the payout account
   * @example "reference_id"
   */
  reference_id: model.text(),
  /**
   * @property {string} data - The data of the payout account
   * @description The data of the payout account
   * @example "payout_account_data"
   */
  data: model.json(),
  /**
   * @property {string} context - The context of the payout account
   * @description The context of the payout account
   * @example "payout_account_context"
   */
  context: model.json().nullable(),
  /**
   * @property {Onboarding} onboarding - The onboarding of the payout account
   * @description The onboarding of the payout account
   * @example "onb_01H9X8Y7Z6W5V4U3T2S1R0Q"
   */
  onboarding: model.hasOne(() => Onboarding).nullable(),
  /**
   * @property {Payout[]} payouts - The payouts of the payout account
   * @description The payouts of the payout account
   * @example "payout_01H9X8Y7Z6W5V4U3T2S1R0Q"
   */
  payouts: model.hasMany(() => Payout),
});
