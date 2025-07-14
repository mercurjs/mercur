import { BigNumberValue } from "@medusajs/framework/types";

/**
 * *
 * @interface
 * 
 * The commission rate details.
 * @property {string} id - The ID of the commission rate.
 * @property {Date} created_at - The associated date.
 * @property {Date} updated_at - The associated date.
 * @property {string} type - The type of the commission rate
 * @property {number} percentage_rate - The percentage rate of the commission rate
 * @property {boolean} include_tax - Whether the commission rate include tax.
 * @property {string} price_set_id - The associated price set's ID.
 * @property {string} max_price_set_id - The associated max price set's ID.
 * @property {string} min_price_set_id - The associated min price set's ID.

 */
export type CommissionRateDTO = {
  /**
 * *
 * The ID of the commission rate.

 */
  id: string;
  /**
 * *
 * The associated date.

 */
  created_at: Date;
  /**
 * *
 * The associated date.

 */
  updated_at: Date;
  /**
 * *
 * The type of the commission rate

 */
  type: string;
  /**
 * *
 * The percentage rate of the commission rate

 */
  percentage_rate: number | null;
  /**
 * *
 * Whether the commission rate include tax.

 */
  include_tax: boolean;
  /**
 * *
 * The associated price set's ID.

 */
  price_set_id: string | null;
  /**
 * *
 * The associated max price set's ID.

 */
  max_price_set_id: string | null;
  /**
 * *
 * The associated min price set's ID.

 */
  min_price_set_id: string | null;
};

/**
 * *
 * @interface
 * 
 * The commission rule details.
 * @property {string} id - The ID of the commission rule.
 * @property {Date} created_at - The associated date.
 * @property {Date} updated_at - The associated date.
 * @property {string} name - The name of the commission rule
 * @property {string} reference - The reference of the commission rule
 * @property {string} reference_id - The associated reference's ID.
 * @property {CommissionRateDTO} rate - The rate of the commission rule

 */
export type CommissionRuleDTO = {
  /**
 * *
 * The ID of the commission rule.

 */
  id: string;
  /**
 * *
 * The associated date.

 */
  created_at: Date;
  /**
 * *
 * The associated date.

 */
  updated_at: Date;
  /**
 * *
 * The name of the commission rule

 */
  name: string;
  /**
 * *
 * The reference of the commission rule

 */
  reference: string;
  /**
 * *
 * The associated reference's ID.

 */
  reference_id: string;
  /**
 * *
 * The rate of the commission rule

 */
  rate: CommissionRateDTO;
};

/**
 * *
 * @interface
 * 
 * The commission line details.
 * @property {string} id - The ID of the commission line.
 * @property {string} item_line_id - The associated item line's ID.
 * @property {string} rule_id - The associated rule's ID.
 * @property {string} currency_code - The currency code of the commission line
 * @property {BigNumberValue} value - The value of the commission line
 * @property {Date} created_at - The associated date.
 * @property {Date} updated_at - The associated date.

 */
export type CommissionLineDTO = {
  /**
 * *
 * The ID of the commission line.

 */
  id: string;
  /**
 * *
 * The associated item line's ID.

 */
  item_line_id: string;
  /**
 * *
 * The associated rule's ID.

 */
  rule_id: string;
  /**
 * *
 * The currency code of the commission line

 */
  currency_code: string;
  /**
 * *
 * The value of the commission line

 */
  value: BigNumberValue;
  /**
 * *
 * The associated date.

 */
  created_at: Date;
  /**
 * *
 * The associated date.

 */
  updated_at: Date;
};

/**
 * *
 * @interface
 * 
 * CommissionCalculationContext
 * @property {string} product_type_id - The associated product type's ID.
 * @property {string} product_category_id - The associated product category's ID.
 * @property {string} seller_id - The associated seller's ID.

 */
export type CommissionCalculationContext = {
  /**
 * *
 * The associated product type's ID.

 */
  product_type_id: string;
  /**
 * *
 * The associated product category's ID.

 */
  product_category_id: string;
  /**
 * *
 * The associated seller's ID.

 */
  seller_id: string;
};

/**
 * *
 * @interface
 * 
 * Price
 * @property {number} amount - The amount of the price
 * @property {string} currency_code - The currency code of the price

 */
type Price = {
  /**
 * *
 * SUMMARY

 */
  amount: number /**
 * *
 * SUMMARY

 */;
  currency_code: string;
};

/**
 * *
 * @interface
 * 
 * AdminCommissionAggregate
 * @property {string} id - The ID of the admin commission aggregate.
 * @property {string} name - The name of the admin commission aggregate
 * @property {string} type - The type of the admin commission aggregate
 * @property {string} reference - The reference of the admin commission aggregate
 * @property {string} reference_id - The associated reference's ID.
 * @property {boolean} include_tax - Whether the admin commission aggregate include tax.
 * @property {boolean} is_active - Whether the admin commission aggregate is active.
 * @property {string} ref_value - The ref value of the admin commission aggregate
 * @property {string} price_set_id - The associated price set's ID.
 * @property {Price[]} price_set - The price set of the admin commission aggregate
 * @property {string} min_price_set_id - The associated min price set's ID.
 * @property {Price[]} min_price_set - The min price set of the admin commission aggregate
 * @property {string} max_price_set_id - The associated max price set's ID.
 * @property {Price[]} max_price_set - The max price set of the admin commission aggregate
 * @property {number} percentage_rate - The percentage rate of the admin commission aggregate
 * @property {string} fee_value - The fee value of the admin commission aggregate

 */
export type AdminCommissionAggregate = {
  /**
 * *
 * The ID of the entity.

 */
  id: string;
  /**
 * *
 * SUMMARY

 */
  name: string;
  /**
 * *
 * SUMMARY

 */
  type: string;
  /**
 * *
 * SUMMARY

 */
  reference: string;
  /**
 * *
 * The associated reference's ID.

 */
  reference_id: string;
  /**
 * *
 * SUMMARY

 */
  include_tax: boolean;
  /**
 * *
 * SUMMARY

 */
  is_active: boolean;
  /**
 * *
 * SUMMARY

 */
  ref_value: string;
  /**
 * *
 * The associated price set's ID.

 */
  price_set_id: string | null;
  /**
 * *
 * The list of SUMMARY

 */
  price_set: Price[];
  /**
 * *
 * The associated min price set's ID.

 */
  min_price_set_id: string | null;
  /**
 * *
 * The list of SUMMARY

 */
  min_price_set: Price[];
  /**
 * *
 * The associated max price set's ID.

 */
  max_price_set_id: string | null;
  /**
 * *
 * The list of SUMMARY

 */
  max_price_set: Price[];
  /**
 * *
 * The percentage rate of the admin commission aggregate

 */
  percentage_rate: number | null;
  /**
 * *
 * The fee value of the admin commission aggregate

 */
  fee_value: string;
};
