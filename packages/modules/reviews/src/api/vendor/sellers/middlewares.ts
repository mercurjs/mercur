import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework";
import { MiddlewareRoute } from "@medusajs/medusa";

import sellerReview from "../../../links/seller-review";
import {
  checkResourceOwnershipByResourceId,
  filterBySellerId,
} from "@mercurjs/framework";
import { vendorReviewQueryConfig } from "./query-config";
import { VendorGetReviewsParams, VendorUpdateReview } from "./validators";

export const vendorSellersMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/sellers/me/reviews",
    middlewares: [
      validateAndTransformQuery(
        VendorGetReviewsParams,
        vendorReviewQueryConfig.list
      ),
      filterBySellerId(),
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/sellers/me/reviews/:id",
    middlewares: [
      validateAndTransformQuery(
        VendorGetReviewsParams,
        vendorReviewQueryConfig.retrieve
      ),
      checkResourceOwnershipByResourceId({
        entryPoint: sellerReview.entryPoint,
        filterField: "review_id",
      }),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/sellers/me/reviews/:id",
    middlewares: [
      validateAndTransformQuery(
        VendorGetReviewsParams,
        vendorReviewQueryConfig.retrieve
      ),
      validateAndTransformBody(VendorUpdateReview),
      checkResourceOwnershipByResourceId({
        entryPoint: sellerReview.entryPoint,
        filterField: "review_id",
      }),
    ],
  },
];
