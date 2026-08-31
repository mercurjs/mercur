import { MiddlewareRoute } from "@medusajs/framework/http"

import { normalizeSplitOrderPaymentStatus } from "../../utils/split-order-payment-status"

export const storeOrdersMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/store/orders",
    middlewares: [normalizeSplitOrderPaymentStatus],
  },
  {
    method: ["GET"],
    matcher: "/store/orders/:id",
    middlewares: [normalizeSplitOrderPaymentStatus],
  },
]
