import { MiddlewareRoute } from "@medusajs/medusa";
import {
  checkResourceOwnershipByResourceId,
  SELLER_ORDER_LINK,
} from "@mercurjs/framework";

export const vendorOrderCommissionMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/orders/:id/commission",
    middlewares: [
      checkResourceOwnershipByResourceId({
        entryPoint: SELLER_ORDER_LINK,
        filterField: "order_id",
      }),
    ],
  },
];
