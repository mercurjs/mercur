import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { HttpTypes, ShippingRuleRequirement } from "@mercurjs/types"

import { batchShippingRulesWorkflow } from "../../../../workflows/shipping-rule"
import { retrieveShippingRule } from "../helpers"
import { AdminUpdateShippingRuleType } from "../validators"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminShippingRuleResponse>
) => {
  res.json({
    shipping_rule: await retrieveShippingRule(
      req.scope,
      req.params.id,
      req.queryConfig.fields
    ),
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminUpdateShippingRuleType>,
  res: MedusaResponse<HttpTypes.AdminShippingRuleResponse>
) => {
  await retrieveShippingRule(req.scope, req.params.id, ["id"])

  const { requirement, ...rest } = req.validatedBody

  await batchShippingRulesWorkflow(req.scope).run({
    input: {
      update: [
        {
          id: req.params.id,
          ...rest,
          ...(requirement
            ? { requirement: requirement as ShippingRuleRequirement }
            : {}),
        },
      ],
    },
  })

  res.json({
    shipping_rule: await retrieveShippingRule(
      req.scope,
      req.params.id,
      req.queryConfig.fields
    ),
  })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminShippingRuleDeleteResponse>
) => {
  await batchShippingRulesWorkflow(req.scope).run({
    input: { delete: [req.params.id] },
  })

  res.json({ id: req.params.id, object: "shipping_rule", deleted: true })
}
