import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { HttpTypes, ShippingRuleRequirement } from "@mercurjs/types"

import { batchShippingRulesWorkflow } from "../../../../workflows/shipping-rule"
import { refetchShippingRules } from "../helpers"
import { AdminBatchShippingRulesType } from "../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminBatchShippingRulesType>,
  res: MedusaResponse<HttpTypes.AdminShippingRulesBatchResponse>
) => {
  const body = req.validatedBody

  const { result } = await batchShippingRulesWorkflow(req.scope).run({
    input: {
      create: (body.create ?? []).map((rule) => ({
        ...rule,
        requirement: rule.requirement as ShippingRuleRequirement,
      })),
      update: (body.update ?? []).map(({ requirement, ...rule }) => ({
        ...rule,
        ...(requirement
          ? { requirement: requirement as ShippingRuleRequirement }
          : {}),
      })),
      delete: body.delete ?? [],
    },
  })

  const [created, updated] = await Promise.all([
    refetchShippingRules(
      req.scope,
      result.created.map((rule) => rule.id),
      req.queryConfig.fields
    ),
    refetchShippingRules(
      req.scope,
      result.updated.map((rule) => rule.id),
      req.queryConfig.fields
    ),
  ])

  res.json({
    created,
    updated,
    deleted: {
      ids: result.deleted,
      object: "shipping_rule",
      deleted: true,
    },
  })
}
