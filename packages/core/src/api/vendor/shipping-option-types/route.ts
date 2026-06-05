import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorShippingOptionTypeListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: shipping_option_types, metadata } = await query.graph({
    entity: "shipping_option_type",
    fields: req.queryConfig.fields,
    filters: req.filterableFields,
    pagination: req.queryConfig.pagination,
  })

  res.json({
    shipping_option_types,
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}
