import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@medusajs/framework/types"

import { listSellerRegionIds } from "./helpers"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminRegionListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const assignedIds = await listSellerRegionIds(
    req.scope,
    req.seller_context!.seller_id
  )

  const requested = req.filterableFields.id as string | string[] | undefined
  const requestedIds = requested
    ? Array.isArray(requested)
      ? requested
      : [requested]
    : null

  const ids = requestedIds
    ? assignedIds.filter((id) => requestedIds.includes(id))
    : assignedIds

  if (!ids.length) {
    res.json({
      regions: [],
      count: 0,
      offset: req.queryConfig.pagination?.skip ?? 0,
      limit: req.queryConfig.pagination?.take ?? 0,
    })
    return
  }

  const { data: regions, metadata } = await query.graph({
    entity: "region",
    fields: req.queryConfig.fields,
    filters: { ...req.filterableFields, id: ids },
    pagination: req.queryConfig.pagination,
  })

  res.json({
    regions,
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}
