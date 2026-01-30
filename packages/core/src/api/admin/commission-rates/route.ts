import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { AdminCreateCommissionRateType } from "./validators"
import { createCommissionRatesWorkflow } from "../../../workflows/commission"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminCommissionRateListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: commission_rates, metadata } = await query.graph({
    entity: "commission_rate",
    fields: req.queryConfig.fields,
    filters: req.filterableFields,
    pagination: req.queryConfig.pagination,
  })

  res.json({
    commission_rates,
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminCreateCommissionRateType>,
  res: MedusaResponse<HttpTypes.AdminCommissionRateResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { result } = await createCommissionRatesWorkflow(req.scope).run({
    input: [req.validatedBody],
  })

  const {
    data: [commission_rate],
  } = await query.graph({
    entity: "commission_rate",
    fields: req.queryConfig.fields,
    filters: { id: result[0].id },
  })

  res.status(201).json({ commission_rate })
}
