import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { createShippingZonesWorkflow } from "../../../workflows/shipping-rule"
import {
  AdminCreateShippingZoneType,
  AdminGetShippingZonesParamsType,
} from "./validators"

export const GET = async (
  req: AuthenticatedMedusaRequest<AdminGetShippingZonesParamsType>,
  res: MedusaResponse<HttpTypes.AdminShippingZoneListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: shipping_zones, metadata } = await query.graph({
    entity: "shipping_zone",
    fields: req.queryConfig.fields,
    filters: req.filterableFields,
    pagination: req.queryConfig.pagination,
  })

  res.json({
    shipping_zones,
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminCreateShippingZoneType>,
  res: MedusaResponse<HttpTypes.AdminShippingZoneResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { result } = await createShippingZonesWorkflow(req.scope).run({
    input: { shipping_zones: [req.validatedBody] },
  })

  const {
    data: [shipping_zone],
  } = await query.graph({
    entity: "shipping_zone",
    fields: req.queryConfig.fields,
    filters: { id: result[0].id },
  })

  res.status(201).json({ shipping_zone })
}
