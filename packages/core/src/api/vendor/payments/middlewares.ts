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
      validateAndTransformQuery(
        VendorGetPaymentsParams,
        vendorPaymentQueryConfig.list
      ),
      applySellerPaymentLinkFilter,
    ],
    policies: [
      {
        resource: PolicyResource.payment,
        operation: PolicyOperation.read,
      },
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/payments/payment-providers",
    middlewares: [
      validateAndTransformQuery(
        VendorGetPaymentProvidersParams,
        vendorPaymentProviderQueryConfig.list
      ),
    ],
    policies: [
      {
        resource: PolicyResource.payment,
        operation: PolicyOperation.read,
      },
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/payments/:id",
    middlewares: [
      validateAndTransformQuery(
        VendorGetPaymentParams,
        vendorPaymentQueryConfig.retrieve
      ),
    ],
    policies: [
      {
        resource: PolicyResource.payment,
        operation: PolicyOperation.read,
      },
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/payments/:id/capture",
    middlewares: [
      validateAndTransformBody(VendorCreatePaymentCapture),
      validateAndTransformQuery(
        VendorGetPaymentParams,
        vendorPaymentQueryConfig.retrieve
      ),
    ],
    policies: [
      {
        resource: PolicyResource.payment,
        operation: PolicyOperation.update,
      },
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/payments/:id/refund",
    middlewares: [
      validateAndTransformBody(VendorCreatePaymentRefund),
      validateAndTransformQuery(
        VendorGetPaymentParams,
        vendorPaymentQueryConfig.retrieve
      ),
    ],
    policies: [
      {
        resource: PolicyResource.payment,
        operation: PolicyOperation.update,
      },
    ],
  },
]
