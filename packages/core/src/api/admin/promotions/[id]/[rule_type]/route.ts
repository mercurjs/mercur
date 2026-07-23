import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  RuleOperator,
  RuleType,
} from "@medusajs/framework/utils"

import {
  getRuleAttributesMap,
  operatorsMap,
  ruleQueryConfigurations,
  validateRuleType,
} from "../../utils"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id, rule_type: ruleType } = req.params

  validateRuleType(ruleType)

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const dasherizedRuleType = ruleType.split("-").join("_")

  const {
    data: [promotion],
  } = await query.graph({
    entity: "promotion",
    filters: { id },
    fields: [...req.queryConfig.fields, "seller.id"],
  })

  const ownerSellerId = promotion?.seller?.id

  const ruleAttributes = getRuleAttributesMap({
    promotionType: promotion?.type || (req.query.promotion_type as any),
    applicationMethodType:
      promotion?.application_method?.type ||
      (req.query.application_method_type as any),
    applicationMethodTargetType:
      promotion?.application_method?.target_type ||
      (req.query.application_method_target_type as any),
  })[ruleType]

  const promotionRules: any[] = []

  if (dasherizedRuleType === RuleType.RULES) {
    promotionRules.push(...(promotion?.rules || []))
  } else if (dasherizedRuleType === RuleType.TARGET_RULES) {
    promotionRules.push(...(promotion?.application_method?.target_rules || []))
  } else if (dasherizedRuleType === RuleType.BUY_RULES) {
    promotionRules.push(...(promotion?.application_method?.buy_rules || []))
  }

  const transformedRules: any[] = []
  const disguisedRules = ruleAttributes.filter((attr: any) => !!attr.disguised)

  for (const disguisedRule of disguisedRules) {
    const getValues = () => {
      const value = promotion?.application_method?.[disguisedRule.id]

      if (disguisedRule.field_type === "number") {
        return value
      }

      if (value) {
        return [{ label: value, value }]
      }

      return []
    }

    const required = disguisedRule.required ?? true
    const applicationMethod = promotion?.application_method
    const recordValue = applicationMethod?.[disguisedRule.id]

    if (required || recordValue) {
      transformedRules.push({
        ...disguisedRule,
        id: undefined,
        attribute: disguisedRule.id,
        attribute_label: disguisedRule.label,
        operator: RuleOperator.EQ,
        operator_label: operatorsMap[RuleOperator.EQ].label,
        value: undefined,
        values: getValues(),
      })
    }
  }

  for (const promotionRule of [...promotionRules, ...transformedRules]) {
    const currentRuleAttribute = ruleAttributes.find(
      (attr: any) => attr.value === promotionRule.attribute
    )

    if (!currentRuleAttribute) {
      continue
    }

    const queryConfig = ruleQueryConfigurations[currentRuleAttribute.id]

    if (!queryConfig) {
      continue
    }

    const filters: Record<string, any> = {
      [queryConfig.valueAttr]: promotionRule.values?.map((v: any) => v.value),
    }

    if (queryConfig.entryPoint === "offer" && ownerSellerId) {
      filters.seller_id = ownerSellerId
    }

    const { data: rows } = await query.graph({
      entity: queryConfig.entryPoint,
      filters,
      fields: [queryConfig.labelAttr, queryConfig.valueAttr],
    })

    const valueLabelMap = new Map<string, string>(
      rows.map((row: any) => [
        row[queryConfig.valueAttr],
        row[queryConfig.labelAttr],
      ])
    )

    promotionRule.values =
      promotionRule.values?.map((value: any) => ({
        value: value.value,
        label: valueLabelMap.get(value.value) || value.value,
      })) || promotionRule.values

    if (!currentRuleAttribute.hydrate) {
      transformedRules.push({
        ...currentRuleAttribute,
        ...promotionRule,
        attribute_label: currentRuleAttribute.label,
        operator_label:
          operatorsMap[promotionRule.operator as keyof typeof operatorsMap]
            ?.label || promotionRule.operator,
      })
    }
  }

  res.json({
    rules: transformedRules,
  })
}
