import {
  validateAndTransformQuery,
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MiddlewareRoute } from "@medusajs/medusa"
import { SellerStatus } from "@mercurjs/types"

import { storeSellerQueryConfig } from "./query-config"
import { StoreGetSellerParams, StoreGetSellersParams } from "./validators"

function applySellerOpenFilters(
  req: MedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) {
  const now = new Date()

  req.filterableFields.status ??= SellerStatus.OPEN

  req.filterableFields.$and ??= []
    ; (req.filterableFields.$and as any[]).push(
      { $or: [{ closed_from: null }, { closed_from: { $gt: now } }] },
      { $or: [{ closed_to: null }, { closed_to: { $lt: now } }] }
    )

  next()
}

export const storeSellersMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/store/sellers",
    middlewares: [
      validateAndTransformQuery(
        StoreGetSellersParams,
        storeSellerQueryConfig.list
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
        storeSellerQueryConfig.retrieve
      ),
      applySellerOpenFilters,
    ],
  },
]
