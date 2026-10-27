import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes, ShippingRuleRequirement } from "@mercurjs/types"

import { batchShippingRulesWorkflow } from "../../../workflows/shipping-rule"
import { retrieveShippingRule } from "./helpers"
import {
  AdminCreateShippingRuleType,
  AdminGetShippingRulesParamsType,
} from "./validators"

export const GET = async (
  req: AuthenticatedMedusaRequest<AdminGetShippingRulesParamsType>,
  res: MedusaResponse<HttpTypes.AdminShippingRuleListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: shipping_rules, metadata } = await query.graph({
    entity: "shipping_rule",
    fields: req.queryConfig.fields,
    filters: req.filterableFields,
    pagination: req.queryConfig.pagination,
  })

  res.json({
    shipping_rules,
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminCreateShippingRuleType>,
  res: MedusaResponse<HttpTypes.AdminShippingRuleResponse>
) => {
  const { result } = await batchShippingRulesWorkflow(req.scope).run({
    input: {
      create: [
        {
          ...req.validatedBody,
          requirement: req.validatedBody.requirement as ShippingRuleRequirement,
        },
      ],
    },
  })

  res.status(201).json({
    shipping_rule: await retrieveShippingRule(
      req.scope,
      result.created[0].id,
      req.queryConfig.fields
    ),
  })
}
