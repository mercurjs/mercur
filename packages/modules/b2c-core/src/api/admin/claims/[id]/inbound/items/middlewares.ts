import type { MiddlewareRoute } from "@medusajs/framework";
import { validateClaimEligibilityMiddleware } from "../../../../../../shared/infra/http/middlewares";

export const adminClaimInboundItemsMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/claims/:id/inbound/items",
    method: ["POST"],
    middlewares: [
      validateClaimEligibilityMiddleware,
    ],
  },
];
