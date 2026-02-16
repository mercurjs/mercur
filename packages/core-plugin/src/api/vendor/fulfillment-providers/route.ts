import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@medusajs/framework/types"

export const GET = async (
  req: AuthenticatedMedusaRequest<HttpTypes.AdminGetFulfillmentProvidersParams>,
  res: MedusaResponse<HttpTypes.AdminFulfillmentProviderListResponse>
) => {
  const query = req.scope.resolve(
    ContainerRegistrationKeys.QUERY
  )
  const { data: fulfillment_providers, metadata } = await query.graph({
    entity: "fulfillment_provider",
    fields: req.queryConfig.fields,
    filters: req.filterableFields,
    pagination: req.queryConfig.pagination,
  })

  res.json({
    fulfillment_providers,
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}