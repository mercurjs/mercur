import { CommissionLineDTO } from "./common";

/**
 * *
 * @interface
 * 
 * Price
 * @property {number} amount - The amount of the price
 * @property {string} currency_code - The currency code of the price

 */
export type Price = {
  /**
 * *
 * SUMMARY

 */
  amount: number;
  /**
 * *
 * SUMMARY

 */
  currency_code: string;
};

/**
 * *
 * @interface
 * 
 * The commission rate to be created.
 * @property {string} type - The type of the commission rate
 * @property {number} percentage_rate - The percentage rate of the commission rate
 * @property {boolean} include_tax - Whether the commission rate include tax.
 * @property {Price[]} price_set - The price set of the commission rate
 * @property {Price[]} min_price_set - The min price set of the commission rate
 * @property {Price[]} max_price_set - The max price set of the commission rate

 */
export type CreateCommissionRateDTO = {
  /**
 * *
 * The type of the commission rate

 */
  type: string;
  /**
 * *
 * The percentage rate of the commission rate

 */
  percentage_rate?: number;
  /**
 * *
 * Whether the commission rate include tax.

 */
  include_tax: boolean;
  /**
 * *
 * The price set of the commission rate

 */
  price_set?: Price[];
  /**
 * *
 * The min price set of the commission rate

 */
  min_price_set?: Price[];
  /**
 * *
 * The max price set of the commission rate

 */
  max_price_set?: Price[];
};

/**
 * *
 * @interface
 * 
 * The commission rule to be created.
 * @property {string} name - The name of the commission rule
 * @property {string} reference - The reference of the commission rule
 * @property {string} reference_id - The associated reference's ID.
 * @property {boolean} is_active - Whether the commission rule is active.
 * @property {CreateCommissionRateDTO} rate - The rate of the commission rule

 */
export type CreateCommissionRuleDTO = {
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
 * Whether the commission rule is active.

 */
  is_active: boolean;
  /**
 * *
 * The rate of the commission rule

 */
  rate: CreateCommissionRateDTO;
};

/**
 * *
 * @interface
 * 
 * The commission line to be created.

 */
export type CreateCommissionLineDTO = Omit<
  CommissionLineDTO,
  "id" | "created_at" | "updated_at"
>;

export type UpdateCommissionRateDTO = Partial<CreateCommissionRateDTO> & {
  /**
 * *
 * The ID of the entity.

 */
  id: string;
};

export type UpdateCommissionRuleDTO = Partial<CreateCommissionRuleDTO> & {
  /**
 * *
 * The ID of the entity.

 */
  id: string;
};
