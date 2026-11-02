import { applySellerLinkFilter, requirePermission } from "../../utils"
import {
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

const applySellerCampaignLinkFilter = applySellerLinkFilter()

export const vendorCampaignsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/campaigns",
    middlewares: [
      requirePermission("campaigns", "view"),
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
      requirePermission("campaigns", "edit"),
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
      requirePermission("campaigns", "view"),
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
      requirePermission("campaigns", "edit"),
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
      requirePermission("campaigns", "manage"),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/campaigns/:id/promotions",
    middlewares: [
      requirePermission("campaigns", "edit"),
      validateAndTransformBody(createLinkBody()),
      validateAndTransformQuery(
        VendorGetCampaignParams,
        vendorCampaignQueryConfig.retrieve
      ),
    ],
  },
]
