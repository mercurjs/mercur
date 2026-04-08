import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { AdminCreateServiceFeeType } from "./validators"
import { createServiceFeesWorkflow } from "../../../workflows/service-fee"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminServiceFeeListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: service_fees, metadata } = await query.graph({
    entity: "service_fee",
    fields: req.queryConfig.fields,
    filters: req.filterableFields,
    pagination: req.queryConfig.pagination,
  })

  res.json({
    service_fees,
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminCreateServiceFeeType>,
  res: MedusaResponse<HttpTypes.AdminServiceFeeResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { result } = await createServiceFeesWorkflow(req.scope).run({
    input: [req.validatedBody],
  })

  const {
    data: [service_fee],
  } = await query.graph({
    entity: "service_fee",
    fields: req.queryConfig.fields,
    filters: { id: result[0].id },
  })

  res.status(201).json({ service_fee })
}
