import { validateAndTransformQuery } from "@medusajs/framework"
import { MiddlewareRoute } from "@medusajs/medusa"

import { VendorGetSellerParams } from "../sellers/validators"

const retrieveVendorSubscriptionQueryConfig = {
  defaults: [
    "id",
    "currency_code",
    "monthly_amount",
    "free_months",
    "requires_orders",
    "*overrides",
    "metadata",
    "created_at",
    "updated_at",
  ],
}

export const vendorSubscriptionMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/subscription",
    middlewares: [
      validateAndTransformQuery(
        VendorGetSellerParams,
        retrieveVendorSubscriptionQueryConfig
      ),
    ],
  },
]
