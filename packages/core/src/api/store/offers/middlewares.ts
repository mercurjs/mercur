import {
  authenticate,
  clearFiltersByKey,
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
  MiddlewareRoute,
} from "@medusajs/framework/http"
import { validateAndTransformQuery } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { ProductStatus } from "@mercurjs/types"
import {
  normalizeDataForContext,
  setPricingContext,
  setTaxContext,
} from "@medusajs/medusa/api/utils/middlewares/index"

import { storeOfferQueryConfig } from "./query-config"
import { StoreGetOfferParams, StoreGetOffersParams } from "./validators"
import { resolveVisibleSellerIds } from "../../utils/sellers"

/**
 * Constrain the offer query to offers owned by sellers currently visible to
 * the storefront (status OPEN, not closed). `offer.seller_id` is a column, so
 * we filter it directly — no link translation needed.
 */
async function applyVisibleSellerIdsFilter(
  req: MedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) {
  req.filterableFields ??= {}
  req.filterableFields.seller_id = await resolveVisibleSellerIds(req.scope)
  next()
}

/**
 * Restrict offers to those on PUBLISHED products. `query.graph` can't filter
 * offers by the cross-module `product` link relation (only select it), so we
 * resolve the published product ids and constrain the offer's `product_id`
 * column directly — intersecting with any incoming `product_id` filter.
 */
async function applyPublishedProductFilter(
  req: MedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) {
  req.filterableFields ??= {}
  const requested = req.filterableFields.product_id as
    | string
    | string[]
    | undefined

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id"],
    filters: {
      status: ProductStatus.PUBLISHED,
      ...(requested ? { id: requested } : {}),
    },
  })

  req.filterableFields.product_id = products.map((p: { id: string }) => p.id)
  next()
}

const pricingMiddlewares = [
  normalizeDataForContext({ priceFieldPaths: ["calculated_price"] }),
  setPricingContext({ priceFieldPaths: ["calculated_price"] }),
  setTaxContext({ priceFieldPaths: ["calculated_price"] }),
]

const offerMiddlewares = [
  authenticate("customer", ["session", "bearer"], {
    allowUnauthenticated: true,
  }),
  applyVisibleSellerIdsFilter,
  // Only surface offers on published products.
  applyPublishedProductFilter,
  ...pricingMiddlewares,
  clearFiltersByKey(["region_id", "country_code", "province", "cart_id"]),
]

export const storeOffersMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/store/offers",
    middlewares: [
      validateAndTransformQuery(
        StoreGetOffersParams,
        storeOfferQueryConfig.list
      ),
      ...offerMiddlewares,
    ],
  },
  {
    method: ["GET"],
    matcher: "/store/offers/:id",
    middlewares: [
      validateAndTransformQuery(
        StoreGetOfferParams,
        storeOfferQueryConfig.retrieve
      ),
      ...offerMiddlewares,
    ],
  },
]
