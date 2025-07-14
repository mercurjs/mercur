import { model } from "@medusajs/framework/utils";

import { CommissionRate } from "./commission_rate";

/**
 * @class CommissionRule
 * @description Represents a commission rule in the system.
 *
 * This model defines the structure for storing commission rule information. Each commission
 * rule is associated with a specific rate and can have different types of rules.
 */
export const CommissionRule = model.define("commission_rule", {
  /**
   * @property {string} id - Unique identifier for the commission rule
   * @description Auto-generated primary key with prefix 'com_rule'
   * @example "com_rule_01H9X8Y7Z6W5V4U3T2S1R0Q"
   */
  id: model.id({ prefix: "com_rule" }).primaryKey(),

  /**
   * @property {string} name - The name of the commission rule
   * @description The name of the commission rule
   * @example "Commission Rule 1"
   */
  name: model.text().searchable(),

  /**
   * @property {string} reference - The reference of the commission rule
   * @description The reference of the commission rule
   * @example "Commission Rule 1"
   */
  reference: model.text().searchable(),

  /**
   * @property {string} reference_id - The reference id of the commission rule
   * @description The reference id of the commission rule
   * @example "Commission Rule 1"
   */
  reference_id: model.text(),

  /**
   * @property {CommissionRate} rate - The rate of the commission rule
   * @description The rate of the commission rule
   * @example "Commission Rate 1"
   */
  rate: model.hasOne(() => CommissionRate, {
    mappedBy: "rule",
  }),
});
