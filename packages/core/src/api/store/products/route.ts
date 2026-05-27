import {
  MedusaResponse,
  MedusaStoreRequest,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export const GET = async (req: MedusaStoreRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  // region_id / currency_code are consumed by setPricingContext only.
  // The Product entity has neither column, so passing them through to
  // query.graph raises `Trying to query by not existing property
  // Product.region_id`.
  const {
    region_id: _r,
    currency_code: _c,
    ...productFilters
  } = (req.filterableFields ?? {}) as Record<string, unknown>

  const { data: products, metadata } = await query.graph({
    entity: "product",
    fields: req.queryConfig.fields,
    filters: productFilters,
    pagination: req.queryConfig.pagination,
  })

  res.json({
    products,
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}
