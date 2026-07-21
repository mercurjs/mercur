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
