import {
  validateAndTransformQuery,
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MiddlewareRoute } from "@medusajs/medusa"

import sellerReview from "../../../links/seller-review"
import { applyPublicReviewFilters } from "../reviews/helpers"
import { storePublicReviewQueryConfig } from "../reviews/query-config"
import { StoreGetPublicReviewsParams } from "../reviews/validators"
import { getSellerOpenFilters } from "./helpers"
import * as QueryConfig from "./query-config"
import { StoreGetSellersParams, StoreGetSellerParams } from "./validators"

function applySellerOpenFilters(
  req: MedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) {
  const { status, $and } = getSellerOpenFilters()

  req.filterableFields.status ??= status

  req.filterableFields.$and ??= []
    ; (req.filterableFields.$and as unknown[]).push(...$and)

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
  {
    method: ["GET"],
    matcher: "/store/sellers/:id/reviews",
    middlewares: [
      validateAndTransformQuery(
        StoreGetPublicReviewsParams,
        storePublicReviewQueryConfig.list
      ),
      applyPublicReviewFilters("seller", sellerReview.entryPoint, "seller_id"),
    ],
  },
]
