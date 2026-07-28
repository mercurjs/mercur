import { ExtendedPromotionRule } from "@custom-types/promotion"

export const requiredProductRule: ExtendedPromotionRule = {
  id: "offer",
  attribute: "items.metadata.offer_id",
  attribute_label: "Offer",
  operator: "eq",
  operator_label: "Equal",
  values: [],
  required: true,
  field_type: "select",
  disguised: false,
}

export const requiredCurrencyRule: ExtendedPromotionRule = {
  id: "currency_code",
  attribute: "currency_code",
  attribute_label: "Currency Code",
  operator: "eq",
  operator_label: "Equal",
  values: [],
  required: true,
  field_type: "select",
  disguised: true,
}

// Buyget "buy quantity" — flattened onto application_method.buy_rules_min_quantity
// at submit. Seeded (required, non-removable) so a buyget can't be created without it.
export const buyRulesMinQuantityRule: ExtendedPromotionRule = {
  id: "buy_rules_min_quantity",
  attribute: "buy_rules_min_quantity",
  attribute_label: "Minimum quantity of items",
  operator: "eq",
  operator_label: "Equal",
  values: "1",
  required: true,
  field_type: "number",
  disguised: true,
}

// Buyget "get quantity" — flattened onto application_method.apply_to_quantity at submit.
export const applyToQuantityRule: ExtendedPromotionRule = {
  id: "apply_to_quantity",
  attribute: "apply_to_quantity",
  attribute_label: "Quantity of items promotion will apply to",
  operator: "eq",
  operator_label: "Equal",
  values: "1",
  required: true,
  field_type: "number",
  disguised: true,
}
