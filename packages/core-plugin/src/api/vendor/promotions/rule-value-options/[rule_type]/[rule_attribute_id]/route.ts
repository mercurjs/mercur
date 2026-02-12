import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  ApplicationMethodTargetTypeValues,
  RuleTypeValues,
} from "@medusajs/types"
import { HttpTypes } from "@mercurjs/types"

import {
  ruleQueryConfigurations,
  validateRuleAttribute,
  validateRuleType,
} from "../../../utils"
import { VendorGetPromotionsRuleValueParamsType } from "../../../validators"

export const GET = async (
  req: AuthenticatedMedusaRequest<VendorGetPromotionsRuleValueParamsType>,
  res: MedusaResponse<HttpTypes.VendorRuleValueOptionsListResponse>
) => {
  const { rule_type: ruleType, rule_attribute_id: ruleAttributeId } = req.params
  const queryConfig = ruleQueryConfigurations[ruleAttributeId]
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const filterableFields: Record<string, any> = { ...req.filterableFields }

  if (filterableFields.value) {
    filterableFields[queryConfig.valueAttr] = filterableFields.value
    delete filterableFields.value
  }

  validateRuleType(ruleType)
  validateRuleAttribute({
    ruleType: ruleType as RuleTypeValues,
    ruleAttributeId,
    promotionType: undefined,
    applicationMethodType: undefined,
    applicationMethodTargetType: filterableFields.application_method_target_type as
      | ApplicationMethodTargetTypeValues
      | undefined,
  })

  if (filterableFields.application_method_target_type) {
    delete filterableFields.application_method_target_type
  }

  const { data: sellerResources } = await query.graph({
    entity: `${queryConfig.entryPoint}_seller`,
    fields: [`${queryConfig.entryPoint}_id`],
    filters: {
      seller_id: req.auth_context.actor_id,
    },
  })

  const { data: rows, metadata } = await query.graph({
    entity: queryConfig.entryPoint,
    filters: {
      ...filterableFields,
      id: sellerResources.map(r => r[`${queryConfig.entryPoint}_id`]),
    },
    fields: [queryConfig.labelAttr, queryConfig.valueAttr],
    pagination: req.queryConfig.pagination,
  })

  const values = rows.map((r: any) => ({
    label: r[queryConfig.labelAttr],
    value: r[queryConfig.valueAttr],
  }))

  res.json({
    values,
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}
