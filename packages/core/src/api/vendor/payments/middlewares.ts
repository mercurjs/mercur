import {
  applySellerLinkFilter,
  requirePermission,
  restrictVendorFields,
  VENDOR_SELLER_PRIVATE_FIELD_SEGMENTS,
} from "../../utils"
import {
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

// Order payments hang off the order's payment collection; cart-stage
// payments are only reachable through the cart and are not listed here.
// Provider data holds the buyer's payment-page tokens and secrets.
const restrictVendorPaymentFields = restrictVendorFields([
  ...VENDOR_SELLER_PRIVATE_FIELD_SEGMENTS,
  "data",
  "context",
])

const applySellerPaymentLinkFilter = applySellerLinkFilter([
  "payment_collection",
  "order",
  "seller",
])

export const vendorPaymentsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/payments",
    middlewares: [
      requirePermission("payments", "view"),
      restrictVendorPaymentFields,
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
      restrictVendorPaymentFields,
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
      restrictVendorPaymentFields,
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
      restrictVendorPaymentFields,
      validateAndTransformBody(VendorCreatePaymentRefund),
      validateAndTransformQuery(
        VendorGetPaymentParams,
        vendorPaymentQueryConfig.retrieve
      ),
    ],
  },
]
