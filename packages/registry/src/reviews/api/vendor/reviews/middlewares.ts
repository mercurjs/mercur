import {
  AuthenticatedMedusaRequest,
  maybeApplyLinkFilter,
  MedusaNextFunction,
  MedusaResponse,
  MiddlewareRoute,
} from "@medusajs/framework/http";
import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework";

import sellerReview from "../../../links/seller-review";
import { vendorReviewQueryConfig } from "./query-config";
import { VendorGetReviewsParams, VendorUpdateReview } from "./validators";

const applySellerReviewLinkFilter = (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  req.filterableFields.seller_id = req.auth_context.actor_id;

  return maybeApplyLinkFilter({
    entryPoint: sellerReview.entryPoint,
    resourceId: "review_id",
    filterableField: "seller_id",
  })(req, res, next);
};

export const vendorReviewsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/reviews",
    middlewares: [
      validateAndTransformQuery(
        VendorGetReviewsParams,
        vendorReviewQueryConfig.list
      ),
      applySellerReviewLinkFilter,
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/reviews/:id",
    middlewares: [
      validateAndTransformQuery(
        VendorGetReviewsParams,
        vendorReviewQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/reviews/:id",
    middlewares: [
      validateAndTransformQuery(
        VendorGetReviewsParams,
        vendorReviewQueryConfig.retrieve
      ),
      validateAndTransformBody(VendorUpdateReview),
    ],
  },
];
