import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  ApplicationMethodTargetTypeValues,
  HttpTypes,
  RuleTypeValues,
} from "@medusajs/types"

import {
  ruleQueryConfigurations,
  validateRuleAttribute,
  validateRuleType,
} from "../../../utils"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminRuleValueOptionsListResponse>
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
    applicationMethodTargetType:
      filterableFields.application_method_target_type as
        | ApplicationMethodTargetTypeValues
        | undefined,
  })

  if (filterableFields.application_method_target_type) {
    delete filterableFields.application_method_target_type
  }

  // Offers are seller-owned; scope them to a store when the admin picks one
  // (offer carries `seller_id` as a read-only column).
  if (queryConfig.entryPoint === "offer" && req.query.seller_id) {
    filterableFields.seller_id = req.query.seller_id
  }

  const { data: rows, metadata } = await query.graph({
    entity: queryConfig.entryPoint,
    filters: filterableFields,
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
