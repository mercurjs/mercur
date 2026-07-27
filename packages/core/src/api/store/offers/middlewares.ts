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

async function applyVisibleSellerIdsFilter(
  req: MedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) {
  req.filterableFields ??= {}

  const visibleSellerIds = await resolveVisibleSellerIds(req.scope)
  const requested = req.filterableFields.seller_id as
    | string
    | string[]
    | undefined

  // Honor a client-supplied `seller_id` filter, but never let it widen scope
  // beyond the visible sellers — intersect the two instead of overwriting.
  if (requested) {
    const requestedIds = Array.isArray(requested) ? requested : [requested]
    const visibleSet = new Set(visibleSellerIds)
    req.filterableFields.seller_id = requestedIds.filter((id) =>
      visibleSet.has(id)
    )
  } else {
    req.filterableFields.seller_id = visibleSellerIds
  }

  next()
}

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
