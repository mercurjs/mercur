import { MiddlewareRoute } from "@medusajs/framework/http"

import { rejectSellerLinkedStockLocation } from "../../../shared/infra/http/middlewares"

export const adminOrdersMiddlewares: MiddlewareRoute[] = [
  {
    method: ["POST"],
    matcher: "/admin/orders/:id/fulfillments",
    middlewares: [
      rejectSellerLinkedStockLocation({
        resourceId: (req: any) => req?.body?.location_id,
        message:
          "You are not allowed to create an admin fulfillment from a seller-linked stock location",
      }),
    ],
  },
]


