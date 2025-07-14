import { model } from "@medusajs/framework/utils";

/**
 * @class CommissionLine
 * @description Represents a commission line in the system.
 *
 * This model defines the structure for storing commission line information. Each commission
 * line is associated with a specific item line and a rule, and contains the value of the
 * commission for that line.
 */
export const CommissionLine = model.define("commission_line", {
  /**
   * @property {string} id - Unique identifier for the commission line
   * @description Auto-generated primary key with prefix 'com_line'
   * @example "com_line_01H9X8Y7Z6W5V4U3T2S1R0Q"
   */
  id: model.id({ prefix: "com_line" }).primaryKey(),

  /**
   * @property {string} item_line_id - The ID of the item line
   * @description The ID of the item line
   * @example "item_line_01H9X8Y7Z6W5V4U3T2S1R0Q"
   */
  item_line_id: model.text(),

  /**
   * @property {string} rule_id - The ID of the rule
   * @description The ID of the rule
   * @example "rule_01H9X8Y7Z6W5V4U3T2S1R0Q"
   */
  rule_id: model.text(),

  /**
   * @property {string} currency_code - The currency code
   * @description The currency code
   * @example "USD"
   */
  currency_code: model.text(),

  /**
   * @property {bigNumber} value - The value of the commission
   * @description The value of the commission
   * @example 100
   */
  value: model.bigNumber(),
});
