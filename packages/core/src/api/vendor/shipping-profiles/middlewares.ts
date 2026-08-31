import { PolicyResource } from "../../utils/policy-resources"
import { PolicyOperation } from "@medusajs/framework/utils"
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
  req.filterableFields.seller_id = req.seller_context!.seller_id

  return maybeApplyLinkFilter({
    entryPoint: "shipping_profile_seller",
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
    policies: [
      {
        resource: PolicyResource.shipping_profile,
        operation: PolicyOperation.read,
      },
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
    policies: [
      {
        resource: PolicyResource.shipping_profile,
        operation: PolicyOperation.create,
      },
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
    policies: [
      {
        resource: PolicyResource.shipping_profile,
        operation: PolicyOperation.read,
      },
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
    policies: [
      {
        resource: PolicyResource.shipping_profile,
        operation: PolicyOperation.update,
      },
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/vendor/shipping-profiles/:id",
    middlewares: [],
    policies: [
      {
        resource: PolicyResource.shipping_profile,
        operation: PolicyOperation.delete,
      },
    ],
  },
]
