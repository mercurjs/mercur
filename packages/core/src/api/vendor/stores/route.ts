import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { HttpTypes } from "@medusajs/framework/types"

import { vendorStoreFields } from "./query-config"

export const GET = async (
  req: AuthenticatedMedusaRequest<HttpTypes.AdminStoreListParams>,
  res: MedusaResponse<HttpTypes.AdminStoreListResponse>
) => {
  const memberId = req.auth_context?.actor_id

  if (!memberId) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "You must be authenticated to access store information."
    )
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: stores, metadata } = await query.graph({
    entity: "store",
    fields: vendorStoreFields,
    filters: req.filterableFields,
    pagination: req.queryConfig.pagination,
  })

  res.json({
    stores,
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: req.queryConfig.pagination.take ?? 0,
  })
}
