import { validateAndTransformQuery } from "@medusajs/framework";
import { MiddlewareRoute } from "@medusajs/medusa";

import { applyReferenceFilter } from "@mercurjs/framework";
import { adminReviewsConfig } from "./query-config";
import { AdminGetReviewsParams } from "./validators";

export const reviewsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/reviews",
    middlewares: [
      validateAndTransformQuery(AdminGetReviewsParams, adminReviewsConfig.list),
      applyReferenceFilter(),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/reviews/:id",
    middlewares: [
      validateAndTransformQuery(
        AdminGetReviewsParams,
        adminReviewsConfig.retrieve
      ),
    ],
  },
];
