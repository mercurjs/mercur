import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { createShippingMethodsWorkflow } from "../../../workflows/shipping-rule"
import {
  AdminCreateShippingMethodType,
  AdminGetShippingMethodsParamsType,
} from "./validators"

export const GET = async (
  req: AuthenticatedMedusaRequest<AdminGetShippingMethodsParamsType>,
  res: MedusaResponse<HttpTypes.AdminShippingMethodListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: shipping_methods, metadata } = await query.graph({
    entity: "marketplace_shipping_method",
    fields: req.queryConfig.fields,
    filters: req.filterableFields,
    pagination: req.queryConfig.pagination,
  })

  res.json({
    shipping_methods,
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminCreateShippingMethodType>,
  res: MedusaResponse<HttpTypes.AdminShippingMethodResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { result } = await createShippingMethodsWorkflow(req.scope).run({
    input: { shipping_methods: [req.validatedBody] },
  })

  const {
    data: [shipping_method],
  } = await query.graph({
    entity: "marketplace_shipping_method",
    fields: req.queryConfig.fields,
    filters: { id: result[0].id },
  })

  res.status(201).json({ shipping_method })
}
