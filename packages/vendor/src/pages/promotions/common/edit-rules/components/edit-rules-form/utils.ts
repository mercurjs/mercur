import {
  ExtendedPromotionRule,
  PromotionRuleFormData,
} from "@custom-types/promotion"

export const generateRuleAttributes = (
  rules?: ExtendedPromotionRule[]
): PromotionRuleFormData[] =>
  (rules || []).map((rule): PromotionRuleFormData => {
    let values: string | string[]
    const firstValue = Array.isArray(rule.values)
      ? rule.values[0]?.value
      : rule.values

    if (rule.field_type === "number") {
      values = firstValue ? String(firstValue) : ""
    } else if (rule.operator === "eq") {
      values = firstValue ? String(firstValue) : ""
    } else {
      values = Array.isArray(rule.values)
        ? rule.values.map((v) => String(v.value || "")).filter(Boolean)
        : []
    }

    return {
      id: rule.id,
      required: rule.required,
      field_type: rule.field_type,
      disguised: rule.disguised,
      attribute: rule.attribute || "",
      operator: rule.operator || "",
      values,
    }
  })
