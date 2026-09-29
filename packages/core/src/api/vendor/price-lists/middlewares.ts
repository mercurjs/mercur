import { requirePermission } from "../../utils"
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
import { createBatchBody, createLinkBody } from "@medusajs/medusa/api/utils/validators"

import * as QueryConfig from "./query-config"
import {
  VendorCreatePriceList,
  VendorCreatePriceListPrice,
  VendorGetPriceListParams,
  VendorGetPriceListPricesParams,
  VendorGetPriceListsParams,
  VendorUpdatePriceList,
  VendorUpdatePriceListPrice,
} from "./validators"

const applySellerPriceListLinkFilter = (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  req.filterableFields.seller_id = req.seller_context!.seller_id

  return maybeApplyLinkFilter({
    entryPoint: "price_list_seller",
    resourceId: "price_list_id",
    filterableField: "seller_id",
  })(req, res, next)
}

export const vendorPriceListsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/price-lists",
    middlewares: [
      requirePermission("price_lists", "view"),
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
      requirePermission("price_lists", "view"),
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
      requirePermission("price_lists", "edit"),
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
      requirePermission("price_lists", "edit"),
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
    middlewares: [
      requirePermission("price_lists", "manage"),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/price-lists/:id/products",
    middlewares: [
      requirePermission("price_lists", "edit"),
      validateAndTransformBody(createLinkBody()),
      validateAndTransformQuery(
        VendorGetPriceListParams,
        QueryConfig.retrievePriceListQueryConfig
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/price-lists/:id/prices",
    middlewares: [
      requirePermission("price_lists", "view"),
      validateAndTransformQuery(
        VendorGetPriceListPricesParams,
        QueryConfig.listPriceListPriceQueryConfig
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/price-lists/:id/prices/batch",
    middlewares: [
      requirePermission("price_lists", "edit"),
      validateAndTransformBody(
        createBatchBody(VendorCreatePriceListPrice, VendorUpdatePriceListPrice)
      ),
      validateAndTransformQuery(
        VendorGetPriceListParams,
        QueryConfig.listPriceListPriceQueryConfig
      ),
    ],
  },
]
