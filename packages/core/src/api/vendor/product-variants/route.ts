import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorProductVariantListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: variants, metadata } = await query.graph({
    entity: "variant",
    fields: req.queryConfig.fields,
    filters: req.filterableFields,
    pagination: req.queryConfig.pagination,
  })

  res.json({
    variants,
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}
