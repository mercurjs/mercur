import { requirePermission } from "../../utils"
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

import { applyCampaignFilters } from "./helpers"
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
  req.filterableFields.seller_id = req.seller_context!.seller_id

  return maybeApplyLinkFilter({
    entryPoint: "campaign_seller",
    resourceId: "campaign_id",
    filterableField: "seller_id",
  })(req, res, next)
}

export const vendorCampaignsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/campaigns",
    middlewares: [
      requirePermission("promotions", "view"),
      validateAndTransformQuery(
        VendorGetCampaignsParams,
        vendorCampaignQueryConfig.list
      ),
      applySellerCampaignLinkFilter,
      applyCampaignFilters,
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/campaigns",
    middlewares: [
      requirePermission("promotions", "edit"),
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
      requirePermission("promotions", "view"),
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
      requirePermission("promotions", "edit"),
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
    middlewares: [
      requirePermission("promotions", "manage"),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/campaigns/:id/promotions",
    middlewares: [
      requirePermission("promotions", "edit"),
      validateAndTransformBody(createLinkBody()),
      validateAndTransformQuery(
        VendorGetCampaignParams,
        vendorCampaignQueryConfig.retrieve
      ),
    ],
  },
]
