import { ExtendedPromotionRule } from "@custom-types/promotion"

export const requiredProductRule: ExtendedPromotionRule = {
  id: "product",
  attribute: "items.product.id",
  attribute_label: "Product",
  operator: "eq",
  operator_label: "Equal",
  values: [],
  required: true,
  field_type: "select",
  disguised: false,
}
