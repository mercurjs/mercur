import type { MiddlewareRoute } from "@medusajs/framework";
import { validateExchangeEligibilityMiddleware } from "../../../../../../shared/infra/http/middlewares";

export const adminExchangeInboundItemsMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/exchanges/:id/inbound/items",
    method: ["POST"],
    middlewares: [
      validateExchangeEligibilityMiddleware,
    ],
  },
];
