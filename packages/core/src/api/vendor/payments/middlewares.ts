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

import {
  vendorPaymentQueryConfig,
  vendorPaymentProviderQueryConfig,
} from "./query-config"
import {
  VendorCreatePaymentCapture,
  VendorCreatePaymentRefund,
  VendorGetPaymentParams,
  VendorGetPaymentProvidersParams,
  VendorGetPaymentsParams,
} from "./validators"

const applySellerPaymentLinkFilter = (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  req.filterableFields.seller_id = req.seller_context!.seller_id

  return maybeApplyLinkFilter({
    entryPoint: "seller_payment",
    resourceId: "payment_id",
    filterableField: "seller_id",
  })(req, res, next)
}

export const vendorPaymentsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/payments",
    middlewares: [
      requirePermission("payments", "view"),
      validateAndTransformQuery(
        VendorGetPaymentsParams,
        vendorPaymentQueryConfig.list
      ),
      applySellerPaymentLinkFilter,
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/payments/payment-providers",
    middlewares: [
      requirePermission("payments", "view"),
      validateAndTransformQuery(
        VendorGetPaymentProvidersParams,
        vendorPaymentProviderQueryConfig.list
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/payments/:id",
    middlewares: [
      requirePermission("payments", "view"),
      validateAndTransformQuery(
        VendorGetPaymentParams,
        vendorPaymentQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/payments/:id/capture",
    middlewares: [
      requirePermission("payments", "edit"),
      validateAndTransformBody(VendorCreatePaymentCapture),
      validateAndTransformQuery(
        VendorGetPaymentParams,
        vendorPaymentQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/payments/:id/refund",
    middlewares: [
      requirePermission("payments", "edit"),
      validateAndTransformBody(VendorCreatePaymentRefund),
      validateAndTransformQuery(
        VendorGetPaymentParams,
        vendorPaymentQueryConfig.retrieve
      ),
    ],
  },
]
