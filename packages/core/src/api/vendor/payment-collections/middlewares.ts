import { MiddlewareRoute } from "@medusajs/framework/http"
import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"

import { vendorPaymentCollectionQueryConfig } from "./query-config"
import {
  VendorGetPaymentCollectionParams,
  VendorMarkPaymentCollectionAsPaid,
} from "./validators"

export const vendorPaymentCollectionsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["POST"],
    matcher: "/vendor/payment-collections/:id/mark-as-paid",
    middlewares: [
      validateAndTransformBody(VendorMarkPaymentCollectionAsPaid),
      validateAndTransformQuery(
        VendorGetPaymentCollectionParams,
        vendorPaymentCollectionQueryConfig.retrieve
      ),
    ],
  },
]
