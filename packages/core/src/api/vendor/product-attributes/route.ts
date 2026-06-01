import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorProductAttributeListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  // Same global-only filter as the admin endpoint — vendors should not
  // see other products' inline-custom attributes.
  const { data: product_attributes, metadata } = await query.graph({
    entity: "product_attribute",
    fields: req.queryConfig.fields,
    filters: {
      ...req.filterableFields,
      product_id: null,
    },
    pagination: req.queryConfig.pagination,
  })

  res.json({
    product_attributes,
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}
