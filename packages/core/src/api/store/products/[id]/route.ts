import {
  MedusaResponse,
  MedusaStoreRequest,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

import {
  enrichProductAttributes,
  wrapProductVariantsWithOfferPrice,
} from "../../../utils"
import { splitComputedVariantFields } from "../helpers"

export const GET = async (req: MedusaStoreRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const visibleIds = (req.filterableFields as { id?: unknown }).id
  if (Array.isArray(visibleIds) && !visibleIds.includes(req.params.id)) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product with id ${req.params.id} was not found`,
    )
  }

  // `variants.calculated_price` / `variants.offer_id` are computed from the
  // cheapest offer post-query, not graph columns — strip them before the read.
  const { fields, withCalculatedPrice } = splitComputedVariantFields(
    req.queryConfig.fields
  )
  req.queryConfig.fields = fields

  // region_id / currency_code are consumed by setPricingContext only —
  // the Product entity has neither column, so passing them through
  // raises `Trying to query by not existing property Product.region_id`.
  const {
    region_id: _r,
    currency_code: _c,
    ...productFilters
  } = (req.filterableFields ?? {}) as Record<string, unknown>

  const {
    data: [product],
  } = await query.graph(
    {
      entity: "product",
      fields: req.queryConfig.fields,
      filters: { ...productFilters, id: req.params.id },
    },
    {
      // A miss (unpublished or not yet created) caches an empty result with no
      // automatic tags; the list tag lets the next product write clear it.
      cache: {
        enable: true,
        tags: ["Product:list:*"],
        computeAutomaticTags: true,
      },
      locale: req.locale,
    }
  )

  if (!product) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product with id ${req.params.id} was not found`,
    )
  }

  await enrichProductAttributes(req.scope, [product], {
    hideInternal: true,
  })

  if (withCalculatedPrice) {
    await wrapProductVariantsWithOfferPrice(req, [product] as any[])
  }

  res.json({ product })
}
