import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework";
import { MiddlewareRoute } from "@medusajs/medusa";

import {
  vendorOnboardingQueryConfig,
  vendorSellerQueryConfig,
} from "./query-config";
import {
  VendorCreateSeller,
  VendorGetOnboardingParams,
  VendorGetSellerParams,
  VendorUpdateSeller,
} from "./validators";

export const vendorSellersMiddlewares: MiddlewareRoute[] = [
  {
    method: ["POST"],
    matcher: "/vendor/sellers",
    middlewares: [
      validateAndTransformBody(VendorCreateSeller),
      validateAndTransformQuery(
        VendorGetSellerParams,
        vendorSellerQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/sellers/me",
    middlewares: [
      validateAndTransformQuery(
        VendorGetSellerParams,
        vendorSellerQueryConfig.list
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/sellers/me",
    middlewares: [
      validateAndTransformBody(VendorUpdateSeller),
      validateAndTransformQuery(
        VendorGetSellerParams,
        vendorSellerQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["GET", "POST"],
    matcher: "/vendor/sellers/me/onboarding",
    middlewares: [
      validateAndTransformQuery(
        VendorGetOnboardingParams,
        vendorOnboardingQueryConfig.retrieve
      ),
    ],
  },
];
