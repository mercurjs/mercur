export type CommissionRuleReference =
  | "seller"
  | "product_type"
  | "product_category";

export type ScopeType =
  | "store"
  | "product_type"
  | "category"
  | "store_product_type"
  | "store_category";

// Which CommissionRule.reference dimensions a scope combo populates.
export const SCOPE_TYPE_DIMENSIONS: Record<ScopeType, CommissionRuleReference[]> =
  {
    store: ["seller"],
    product_type: ["product_type"],
    category: ["product_category"],
    store_product_type: ["seller", "product_type"],
    store_category: ["seller", "product_category"],
  };

export type CommissionRuleDTO = {
  id: string;
  reference: string;
  reference_id: string;
};

export type CommissionRateValueDTO = {
  id?: string;
  currency_code: string;
  amount: number;
};

export type CommissionRate = {
  id: string;
  name: string;
  code: string;
  type: "fixed" | "percentage";
  value: number;
  currency_code: string | null;
  include_tax: boolean;
  include_shipping: boolean;
  is_enabled: boolean;
  is_default: boolean;
  rules?: CommissionRuleDTO[];
  values?: CommissionRateValueDTO[];
};
