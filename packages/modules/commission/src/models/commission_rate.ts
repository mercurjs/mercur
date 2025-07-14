import { model } from "@medusajs/framework/utils";

import { CommissionRule } from "./commission_rule";

/**
 * @class CommissionRate
 * @description Represents a commission rate in the system.
 *
 * This model defines the structure for storing commission rate information. Each commission
 * rate is associated with a specific rule and can have different types of rates.
 */
export const CommissionRate = model.define("commission_rate", {
  /**
   * @property {string} id - Unique identifier for the commission rate
   * @description Auto-generated primary key with prefix 'com_rate'
   * @example "com_rate_01H9X8Y7Z6W5V4U3T2S1R0Q"
   */
  id: model.id({ prefix: "com_rate" }).primaryKey(),

  /**
   * @property {string} type - The type of the commission rate
   * @description The type of the commission rate
   * @example "percentage"
   */
  type: model.text(),

  /**
   * @property {number} percentage_rate - The percentage rate of the commission rate
   * @description The percentage rate of the commission rate
   * @example 10
   */
  percentage_rate: model.number().nullable(),

  /**
   * @property {boolean} include_tax - The include tax of the commission rate
   * @description The include tax of the commission rate
   * @example true
   */
  include_tax: model.boolean(),

  /**
   * @property {string} price_set_id - The price set id of the commission rate
   * @description The price set id of the commission rate
   * @example "price_set_01H9X8Y7Z6W5V4U3T2S1R0Q"
   */
  price_set_id: model.text().nullable(),

  /**
   * @property {string} max_price_set_id - The max price set id of the commission rate
   * @description The max price set id of the commission rate
   * @example "max_price_set_01H9X8Y7Z6W5V4U3T2S1R0Q"
   */
  max_price_set_id: model.text().nullable(),

  /**
   * @property {string} min_price_set_id - The min price set id of the commission rate
   * @description The min price set id of the commission rate
   * @example "min_price_set_01H9X8Y7Z6W5V4U3T2S1R0Q"
   */
  min_price_set_id: model.text().nullable(),

  /**
   * @property {CommissionRule} rule - The rule of the commission rate
   * @description The rule of the commission rate
   * @example "rule_01H9X8Y7Z6W5V4U3T2S1R0Q"
   */
  rule: model
    .belongsTo(() => CommissionRule, {
      mappedBy: "rate",
    })
    .nullable(),
});
