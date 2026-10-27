import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorShippingOptionListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: shipping_options, metadata } = await query.graph({
    entity: "shipping_option",
    fields: req.queryConfig.fields,
    filters: req.filterableFields,
    pagination: req.queryConfig.pagination,
  })

  res.json({
    shipping_options,
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}

export const POST = async (
  _req: AuthenticatedMedusaRequest,
  _res: MedusaResponse<HttpTypes.VendorShippingOptionResponse>
) => {
  throw new MedusaError(
    MedusaError.Types.NOT_ALLOWED,
    "Shipping options are created from the marketplace's shipping rules. Use POST /vendor/shipping-rules/:id/enable"
  )
}
