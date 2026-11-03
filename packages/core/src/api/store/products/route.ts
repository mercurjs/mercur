import {
  MedusaResponse,
  MedusaStoreRequest,
} from "@medusajs/framework/http"
import {
  enrichProductAttributes,
  listProducts,
  wrapProductVariantsWithOfferPrice,
} from "../../utils"
import { splitComputedVariantFields } from "./helpers"

export const GET = async (req: MedusaStoreRequest, res: MedusaResponse) => {
  // `variants.calculated_price` / `variants.offer_id` are computed from the
  // cheapest offer post-query, not graph columns — strip them before the read.
  const { fields, withCalculatedPrice } = splitComputedVariantFields(
    req.queryConfig.fields
  )
  req.queryConfig.fields = fields

  // Pricing-context keys feed setPricingContext / the offer-price wrap, not
  // product columns: query.graph errors on region_id, and the index rejects
  // every non-indexed key (`Field country_code is not indexed`).
  const {
    region_id: _r,
    currency_code: _c,
    country_code: _cc,
    province: _p,
    cart_id: _cart,
    ...productFilters
  } = (req.filterableFields ?? {}) as Record<string, unknown>

  const { products, count, estimate_count, offset, limit } = await listProducts(
    req.scope,
    {
      fields: req.queryConfig.fields,
      filters: productFilters,
      pagination: req.queryConfig.pagination,
      locale: req.locale,
      cache: true,
    }
  )

  await enrichProductAttributes(req.scope, products as any[])

  if (withCalculatedPrice) {
    await wrapProductVariantsWithOfferPrice(req, products as any[])
  }

  res.json({ products, count, estimate_count, offset, limit })
}
