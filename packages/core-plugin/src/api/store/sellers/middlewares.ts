import {
  validateAndTransformQuery,
  applyDefaultFilters,
} from "@medusajs/framework/http"
import { MiddlewareRoute } from "@medusajs/medusa"
import { SellerStatus } from "@mercurjs/types"

import * as QueryConfig from "./query-config"
import { StoreGetSellersParams, StoreGetSellerParams } from "./validators"

export const storeSellersMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/store/sellers",
    middlewares: [
      validateAndTransformQuery(
        StoreGetSellersParams,
        QueryConfig.listSellerQueryConfig
      ),
      applyDefaultFilters({
        status: SellerStatus.OPEN,
        closed_from: () => {
          const now = new Date()
          return {
            $or: [{ closed_from: null }, { closed_from: { $gt: now } }],
          }
        },
        closed_to: () => {
          const now = new Date()
          return {
            $or: [{ closed_to: null }, { closed_to: { $lt: now } }],
          }
        },
      }),
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
      applyDefaultFilters({
        status: SellerStatus.OPEN,
        closed_from: () => {
          const now = new Date()
          return {
            $or: [{ closed_from: null }, { closed_from: { $gt: now } }],
          }
        },
        closed_to: () => {
          const now = new Date()
          return {
            $or: [{ closed_to: null }, { closed_to: { $lt: now } }],
          }
        },
      }),
    ],
  },
]
