import {
  authenticate,
  clearFiltersByKey,
  MiddlewareRoute,
} from "@medusajs/framework/http"
import { validateAndTransformQuery } from "@medusajs/framework"
import {
  normalizeDataForContext,
  setPricingContext,
  setTaxContext,
} from "@medusajs/medusa/api/utils/middlewares/index"

import { storeOfferQueryConfig } from "./query-config"
import { StoreGetOfferParams, StoreGetOffersParams } from "./validators"

const pricingMiddlewares = [
  normalizeDataForContext({ priceFieldPaths: ["calculated_price"] }),
  setPricingContext({ priceFieldPaths: ["calculated_price"] }),
  setTaxContext({ priceFieldPaths: ["calculated_price"] }),
]

const offerMiddlewares = [
  authenticate("customer", ["session", "bearer"], {
    allowUnauthenticated: true,
  }),
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
