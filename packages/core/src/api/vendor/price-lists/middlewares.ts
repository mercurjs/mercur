import {
  AuthenticatedMedusaRequest,
  maybeApplyLinkFilter,
  MedusaNextFunction,
  MedusaResponse,
  MiddlewareRoute,
} from "@medusajs/framework/http"
import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"

import * as QueryConfig from "./query-config"
import {
  VendorCreatePriceList,
  VendorGetPriceListParams,
  VendorGetPriceListsParams,
  VendorUpdatePriceList,
} from "./validators"

const applySellerPriceListLinkFilter = (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  req.filterableFields.seller_id = req.auth_context.actor_id

  return maybeApplyLinkFilter({
    entryPoint: "seller_price_list",
    resourceId: "price_list_id",
    filterableField: "seller_id",
  })(req, res, next)
}

export const vendorPriceListsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/price-lists",
    middlewares: [
      validateAndTransformQuery(
        VendorGetPriceListsParams,
        QueryConfig.listPriceListQueryConfig
      ),
      applySellerPriceListLinkFilter,
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/price-lists/:id",
    middlewares: [
      validateAndTransformQuery(
        VendorGetPriceListParams,
        QueryConfig.retrievePriceListQueryConfig
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/price-lists",
    middlewares: [
      validateAndTransformBody(VendorCreatePriceList),
      validateAndTransformQuery(
        VendorGetPriceListParams,
        QueryConfig.retrievePriceListQueryConfig
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/price-lists/:id",
    middlewares: [
      validateAndTransformBody(VendorUpdatePriceList),
      validateAndTransformQuery(
        VendorGetPriceListParams,
        QueryConfig.retrievePriceListQueryConfig
      ),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/vendor/price-lists/:id",
    middlewares: [],
  },
]
