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
import { createLinkBody } from "@medusajs/medusa/api/utils/validators"

import { vendorCampaignQueryConfig } from "./query-config"
import {
  VendorCreateCampaign,
  VendorGetCampaignParams,
  VendorGetCampaignsParams,
  VendorUpdateCampaign,
} from "./validators"

const applySellerCampaignLinkFilter = (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  req.filterableFields.seller_id = req.auth_context.actor_id

  return maybeApplyLinkFilter({
    entryPoint: "seller_campaign",
    resourceId: "campaign_id",
    filterableField: "seller_id",
  })(req, res, next)
}

export const vendorCampaignsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/campaigns",
    middlewares: [
      validateAndTransformQuery(
        VendorGetCampaignsParams,
        vendorCampaignQueryConfig.list
      ),
      applySellerCampaignLinkFilter,
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/campaigns",
    middlewares: [
      validateAndTransformBody(VendorCreateCampaign),
      validateAndTransformQuery(
        VendorGetCampaignParams,
        vendorCampaignQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/campaigns/:id",
    middlewares: [
      validateAndTransformQuery(
        VendorGetCampaignParams,
        vendorCampaignQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/campaigns/:id",
    middlewares: [
      validateAndTransformBody(VendorUpdateCampaign),
      validateAndTransformQuery(
        VendorGetCampaignParams,
        vendorCampaignQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/vendor/campaigns/:id",
    middlewares: [],
  },
  {
    method: ["POST"],
    matcher: "/vendor/campaigns/:id/promotions",
    middlewares: [
      validateAndTransformBody(createLinkBody()),
      validateAndTransformQuery(
        VendorGetCampaignParams,
        vendorCampaignQueryConfig.retrieve
      ),
    ],
  },
]
