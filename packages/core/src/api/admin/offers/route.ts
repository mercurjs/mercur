import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { AdminGetOffersParamsType } from "./validators"

export const GET = async (
  req: AuthenticatedMedusaRequest<AdminGetOffersParamsType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const filters = req.filterableFields

  const { data: offers, metadata } = await query.graph({
    entity: "offer",
    fields: req.queryConfig.fields,
    filters,
    pagination: req.queryConfig.pagination,
    withDeleted: req.queryConfig.withDeleted || "deleted_at" in filters,
  })

  res.json({
    offers,
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}
