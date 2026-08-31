import { PolicyResource } from "../../utils/policy-resources"
import { PolicyOperation } from "@medusajs/framework/utils"
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
      validateAndTransformQuery(
        VendorGetPriceListsParams,
        QueryConfig.listPriceListQueryConfig
      ),
      applySellerPriceListLinkFilter,
    ],
    policies: [
      {
        resource: PolicyResource.price_list,
        operation: PolicyOperation.read,
      },
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
    policies: [
      {
        resource: PolicyResource.price_list,
        operation: PolicyOperation.read,
      },
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
    policies: [
      {
        resource: PolicyResource.price_list,
        operation: PolicyOperation.create,
      },
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
    policies: [
      {
        resource: PolicyResource.price_list,
        operation: PolicyOperation.update,
      },
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/vendor/price-lists/:id",
    middlewares: [],
    policies: [
      {
        resource: PolicyResource.price_list,
        operation: PolicyOperation.delete,
      },
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/price-lists/:id/products",
    middlewares: [
      validateAndTransformBody(createLinkBody()),
      validateAndTransformQuery(
        VendorGetPriceListParams,
        QueryConfig.retrievePriceListQueryConfig
      ),
    ],
    policies: [
      {
        resource: PolicyResource.price_list,
        operation: PolicyOperation.update,
      },
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/price-lists/:id/prices",
    middlewares: [
      validateAndTransformQuery(
        VendorGetPriceListPricesParams,
        QueryConfig.listPriceListPriceQueryConfig
      ),
    ],
    policies: [
      {
        resource: PolicyResource.price_list,
        operation: PolicyOperation.read,
      },
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/price-lists/:id/prices/batch",
    middlewares: [
      validateAndTransformBody(
        createBatchBody(VendorCreatePriceListPrice, VendorUpdatePriceListPrice)
      ),
      validateAndTransformQuery(
        VendorGetPriceListParams,
        QueryConfig.listPriceListPriceQueryConfig
      ),
    ],
    policies: [
      {
        resource: PolicyResource.price_list,
        operation: PolicyOperation.update,
      },
    ],
  },
]
