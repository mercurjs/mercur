import {
  AuthenticatedMedusaRequest,
  maybeApplyLinkFilter,
  MedusaNextFunction,
  MedusaResponse,
  MiddlewareRoute,
} from "@medusajs/framework/http"
import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"

import { vendorShippingProfileQueryConfig } from "./query-config"
import {
  VendorCreateShippingProfile,
  VendorGetShippingProfileParams,
  VendorGetShippingProfilesParams,
  VendorUpdateShippingProfile,
} from "./validators"

const applySellerShippingProfileLinkFilter = (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  req.filterableFields.seller_id = req.auth_context.actor_id

  return maybeApplyLinkFilter({
    entryPoint: "seller_shipping_profile",
    resourceId: "shipping_profile_id",
    filterableField: "seller_id",
  })(req, res, next)
}

export const vendorShippingProfilesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/shipping-profiles",
    middlewares: [
      validateAndTransformQuery(
        VendorGetShippingProfilesParams,
        vendorShippingProfileQueryConfig.list
      ),
      applySellerShippingProfileLinkFilter,
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/shipping-profiles",
    middlewares: [
      validateAndTransformBody(VendorCreateShippingProfile),
      validateAndTransformQuery(
        VendorGetShippingProfileParams,
        vendorShippingProfileQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/shipping-profiles/:id",
    middlewares: [
      validateAndTransformQuery(
        VendorGetShippingProfileParams,
        vendorShippingProfileQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/shipping-profiles/:id",
    middlewares: [
      validateAndTransformBody(VendorUpdateShippingProfile),
      validateAndTransformQuery(
        VendorGetShippingProfileParams,
        vendorShippingProfileQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/vendor/shipping-profiles/:id",
    middlewares: [],
  },
]
