import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"
import {
  AuthenticatedMedusaRequest,
  MedusaNextFunction,
  MedusaResponse,
  MiddlewareRoute,
} from "@medusajs/framework/http"
import { MercurFeatureFlags } from "@mercurjs/types"

import { requireFeatureFlag, requirePermission } from "../../utils"
import { vendorReturnRequestQueryConfig } from "./query-config"
import {
  VendorAcceptReturnRequest,
  VendorCreateReturnRequest,
  VendorDeclineReturnRequest,
  VendorGetReturnRequestParams,
  VendorGetReturnRequestsParams,
} from "./validators"

const applySellerFilter = (
  req: AuthenticatedMedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) => {
  req.filterableFields.seller_id = req.seller_context!.seller_id
  next()
}

export const vendorReturnRequestsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/return-requests",
    middlewares: [
      requirePermission("orders.returns", "view"),
      validateAndTransformQuery(
        VendorGetReturnRequestsParams,
        vendorReturnRequestQueryConfig.list
      ),
      applySellerFilter,
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/return-requests",
    middlewares: [
      requirePermission("orders.returns", "edit"),
      requireFeatureFlag(MercurFeatureFlags.SELLER_INITIATED_RETURN_REQUESTS),
      validateAndTransformBody(VendorCreateReturnRequest),
      validateAndTransformQuery(
        VendorGetReturnRequestParams,
        vendorReturnRequestQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/return-requests/:id",
    middlewares: [
      requirePermission("orders.returns", "view"),
      validateAndTransformQuery(
        VendorGetReturnRequestParams,
        vendorReturnRequestQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/return-requests/:id/accept",
    middlewares: [
      requirePermission("orders.returns", "edit"),
      validateAndTransformBody(VendorAcceptReturnRequest),
      validateAndTransformQuery(
        VendorGetReturnRequestParams,
        vendorReturnRequestQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/return-requests/:id/decline",
    middlewares: [
      requirePermission("orders.returns", "edit"),
      validateAndTransformBody(VendorDeclineReturnRequest),
      validateAndTransformQuery(
        VendorGetReturnRequestParams,
        vendorReturnRequestQueryConfig.retrieve
      ),
    ],
  },
]
