import {
  authenticate,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework";
import { MiddlewareRoute } from "@medusajs/medusa";

import { storeReviewQueryConfig } from "./query-config";
import {
  StoreCreateReview,
  StoreGetReviewsParams,
  StoreUpdateReview,
} from "./validators";

export const storeReviewMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/store/reviews",
    middlewares: [
      authenticate("customer", ["session", "bearer"]),
      validateAndTransformQuery(
        StoreGetReviewsParams,
        storeReviewQueryConfig.list
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/store/reviews",
    middlewares: [
      authenticate("customer", ["session", "bearer"]),
      validateAndTransformQuery(
        StoreGetReviewsParams,
        storeReviewQueryConfig.retrieve
      ),
      validateAndTransformBody(StoreCreateReview),
    ],
  },
  {
    method: ["GET"],
    matcher: "/store/reviews/:id",
    middlewares: [
      authenticate("customer", ["session", "bearer"]),
      validateAndTransformQuery(
        StoreGetReviewsParams,
        storeReviewQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/store/reviews/:id",
    middlewares: [
      authenticate("customer", ["session", "bearer"]),
    ],
  },
  {
    method: ["POST"],
    matcher: "/store/reviews/:id",
    middlewares: [
      authenticate("customer", ["session", "bearer"]),
      validateAndTransformQuery(
        StoreGetReviewsParams,
        storeReviewQueryConfig.retrieve
      ),
      validateAndTransformBody(StoreUpdateReview),
    ],
  },
];
