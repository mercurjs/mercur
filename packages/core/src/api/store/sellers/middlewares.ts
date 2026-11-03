import {
  validateAndTransformQuery,
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MiddlewareRoute } from "@medusajs/medusa"

import * as QueryConfig from "./query-config"
import { StoreGetSellersParams, StoreGetSellerParams } from "./validators"
import { storeSellerVisibilityFilter } from "../../utils/sellers"

function applySellerOpenFilters(
  req: MedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) {
  const { status, $and } = storeSellerVisibilityFilter(new Date())

  req.filterableFields.status ??= status
  req.filterableFields.$and = [
    ...((req.filterableFields.$and as unknown[] | undefined) ?? []),
    ...$and,
  ]

  next()
}

export const storeSellersMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/store/sellers",
    middlewares: [
      validateAndTransformQuery(
        StoreGetSellersParams,
        QueryConfig.listSellerQueryConfig
      ),
      applySellerOpenFilters,
    ],
  },
  {
    method: ["GET"],
    matcher: "/store/sellers/:id",
    middlewares: [
      validateAndTransformQuery(
        StoreGetSellerParams,
        QueryConfig.retrieveSellerQueryConfig
      ),
      applySellerOpenFilters,
    ],
  },
]
