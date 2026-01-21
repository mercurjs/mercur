import type { MiddlewareRoute } from "@medusajs/framework";
import { validateReturnEligibilityMiddleware } from "../../../../../shared/infra/http/middlewares";

export const adminReturnRequestItemsMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/returns/:id/request-items",
    middlewares: [
      validateReturnEligibilityMiddleware,
    ],
  },
];
