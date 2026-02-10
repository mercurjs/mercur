import type { BigNumberValue } from "@medusajs/types";

import type { Order } from "@custom-types/order/common";

export type CommissionRateDTO = {
  id: string;
  created_at: Date;
  updated_at: Date;
  type: string;
  percentage_rate: number | null;
  include_tax: boolean;
  price_set_id: string | null;
  max_price_set_id: string | null;
  min_price_set_id: string | null;
};

export type CommissionRuleDTO = {
  id: string;
  created_at: Date;
  updated_at: Date;
  name: string;
  reference: string;
  reference_id: string;
  rate: CommissionRateDTO;
};

export type CommissionLineDTO = {
  id: string;
  item_line_id: string;
  rule_id: string;
  currency_code: string;
  value: BigNumberValue;
  created_at: Date;
  updated_at: Date;
};

export type CommissionCalculationContext = {
  product_type_id: string;
  product_category_id: string;
  seller_id: string;
};

type Price = { amount: number; currency_code: string };

export type AdminCommissionAggregate = {
  id: string;
  name: string;
  type: string;
  reference: string;
  reference_id: string;
  include_tax: boolean;
  is_active: boolean;
  ref_value: string;
  price_set_id: string | null;
  price_set: Price[];
  min_price_set_id: string | null;
  min_price_set: Price[];
  max_price_set_id: string | null;
  max_price_set: Price[];
  percentage_rate: number | null;
  fee_value: string;
};

export interface CommissionRule {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateCommissionRule {
  name: string;
  description?: string;
  is_active: boolean;
}

export interface UpdateCommissionRule {
  is_active: boolean;
}

export interface UpsertDefaultCommissionRule {
  name: string;
  description?: string;
  is_active: boolean;
}

export interface AdminCommissionPriceValue {
  amount: number;
  currency_code: string;
}

export interface Rate {
  id: string;
  type: string;
  percentage_rate: number;
  include_tax: boolean;
}

export interface Rule {
  id: string;
  name: string;
  reference: string;
  reference_id: string;
  is_active: boolean;
  rate: Rate;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CommissionLine {
  id: string;
  item_line_id: string;
  rule_id: string;
  currency_code: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  value: number;
  order: Order;
  rule: Rule;
}
